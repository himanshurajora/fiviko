import { Prisma } from '@prisma/client';
import { LiquidityType, SAFETY_THRESHOLDS, type FinancialSummary } from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/http.js';
import { getRateConverter } from '../../lib/currency.js';

const dec = (d: Prisma.Decimal | number): number => Number(d);

/** Convert any-frequency base-currency amount into a monthly figure. */
function toMonthly(amount: number, frequency: 'MONTHLY' | 'YEARLY' | 'ONE_TIME'): number {
  if (frequency === 'YEARLY') return amount / 12;
  if (frequency === 'ONE_TIME') return 0; // one-time amounts don't recur monthly
  return amount;
}

/**
 * Computes the derived FinancialSummary (spec §8.3) for a user, in base currency.
 * All persisted rows already carry a `baseCurrencyAmount`, so this stays pure
 * arithmetic — no live currency lookups on the hot dashboard path.
 */
export async function getFinancialSummary(userId: string): Promise<FinancialSummary> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');

  const [assets, liabilities, incomes, mandatory, convert] = await Promise.all([
    prisma.asset.findMany({ where: { userId, deletedAt: null } }),
    prisma.liability.findMany({ where: { userId, deletedAt: null } }),
    prisma.income.findMany({ where: { userId, deletedAt: null } }),
    prisma.mandatoryExpense.findMany({ where: { userId, deletedAt: null } }),
    getRateConverter(user.baseCurrency),
  ]);

  // Convert every row from its native amount + currency using the latest rates,
  // so the totals always reflect today's FX (not the rate captured at write).
  const totalAssets = assets.reduce((s, a) => s + convert(dec(a.amount), a.currency), 0);
  const liquidNetWorth = assets.reduce((s, a) => {
    const baseAmount = convert(dec(a.amount), a.currency);
    if (a.liquidityType === LiquidityType.Liquid) return s + baseAmount;
    if (a.liquidityType === LiquidityType.SemiLiquid) return s + baseAmount * SAFETY_THRESHOLDS.semiLiquidHaircut;
    return s; // illiquid assets (property/vehicles) are excluded from liquid
  }, 0);

  const totalLiabilities = liabilities.reduce((s, l) => s + convert(dec(l.outstandingAmount), l.currency), 0);
  const monthlyDebtPayments = liabilities.reduce((s, l) => s + convert(dec(l.monthlyPayment), l.currency), 0);

  const monthlyIncome = incomes.reduce((s, i) => s + toMonthly(convert(dec(i.amount), i.currency), i.frequency), 0);
  const monthlyMandatoryExpenses = mandatory.reduce(
    (s, m) => s + toMonthly(convert(dec(m.amount), m.currency), m.frequency),
    0,
  );

  const netWorth = totalAssets - totalLiabilities;
  const monthlySurplus = monthlyIncome - monthlyMandatoryExpenses - monthlyDebtPayments;

  // Current calendar-month spending from the expense log.
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [spendAgg, cashFlowRows] = await Promise.all([
    prisma.expense.aggregate({
      where: { userId, date: { gte: monthStart }, deletedAt: null },
      _sum: { baseCurrencyAmount: true },
    }),
    // "This month so far" strip — every signed money movement we logged.
    // Transfers are zero-sum (one IN + one OUT) so they fall out of net change
    // but still show up if you split inflow vs outflow.
    prisma.cashFlow.findMany({
      where: { userId, occurredAt: { gte: monthStart } },
      select: { baseAmount: true, kind: true },
    }),
  ]);
  const currentMonthSpending = dec(spendAgg._sum.baseCurrencyAmount ?? new Prisma.Decimal(0));

  let currentMonthInflow = 0;
  let currentMonthOutflow = 0;
  for (const row of cashFlowRows) {
    const amt = dec(row.baseAmount);
    if (row.kind.endsWith('_IN') || row.kind === 'INCOME_CREDIT') currentMonthInflow += amt;
    else if (row.kind.endsWith('_OUT')) currentMonthOutflow += amt;
  }
  // Expenses live in the Expense table, not CashFlow (we'd have double-logged).
  // Add them to outflow here so the strip reflects "what you spent" too.
  currentMonthOutflow += currentMonthSpending;
  const currentMonthNetChange = currentMonthInflow - currentMonthOutflow;

  // Essential monthly cost drives the emergency-fund target. Fall back to a
  // fraction of income when no mandatory expenses are logged, so the target
  // never collapses to zero (which would fake a "fully funded" cushion).
  const essentialMonthly =
    monthlyMandatoryExpenses > 0
      ? monthlyMandatoryExpenses
      : monthlyIncome * SAFETY_THRESHOLDS.emergencyIncomeEssentialRate;
  const emergencyFundTarget = essentialMonthly * SAFETY_THRESHOLDS.emergencyFundMonths;
  const emergencyFundHealth =
    emergencyFundTarget > 0 ? clamp01(liquidNetWorth / emergencyFundTarget) : 1;

  const debtToIncomeRatio = monthlyIncome > 0 ? monthlyDebtPayments / monthlyIncome : 0;

  // "Safe to spend" = surplus left this month after what's already been spent, floored at 0.
  const safeRemainingSpend = Math.max(0, monthlySurplus - currentMonthSpending);

  return {
    baseCurrency: user.baseCurrency,
    totalAssets: round2(totalAssets),
    totalLiabilities: round2(totalLiabilities),
    netWorth: round2(netWorth),
    liquidNetWorth: round2(liquidNetWorth),
    monthlyIncome: round2(monthlyIncome),
    monthlyMandatoryExpenses: round2(monthlyMandatoryExpenses),
    monthlyDebtPayments: round2(monthlyDebtPayments),
    monthlySurplus: round2(monthlySurplus),
    emergencyFundTarget: round2(emergencyFundTarget),
    emergencyFundHealth: round2(emergencyFundHealth),
    debtToIncomeRatio: round2(debtToIncomeRatio),
    currentMonthSpending: round2(currentMonthSpending),
    safeRemainingSpend: round2(safeRemainingSpend),
    currentMonthInflow: round2(currentMonthInflow),
    currentMonthOutflow: round2(currentMonthOutflow),
    currentMonthNetChange: round2(currentMonthNetChange),
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
