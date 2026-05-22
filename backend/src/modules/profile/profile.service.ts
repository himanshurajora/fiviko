import { Prisma } from '@prisma/client';
import { LiquidityType, SAFETY_THRESHOLDS, type FinancialSummary } from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/http.js';

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

  const [assets, liabilities, incomes, mandatory] = await Promise.all([
    prisma.asset.findMany({ where: { userId } }),
    prisma.liability.findMany({ where: { userId } }),
    prisma.income.findMany({ where: { userId } }),
    prisma.mandatoryExpense.findMany({ where: { userId } }),
  ]);

  const totalAssets = assets.reduce((s, a) => s + dec(a.baseCurrencyAmount), 0);
  // "Liquid" money available for a purchase or emergency = cash-like assets in
  // full, plus semi-liquid assets (stocks/gold/funds) at a haircut, since they
  // can be sold but with friction/volatility. Illiquid assets (property,
  // vehicles) are excluded.
  const liquidNetWorth = assets.reduce((s, a) => {
    const amount = dec(a.baseCurrencyAmount);
    if (a.liquidityType === LiquidityType.Liquid) return s + amount;
    if (a.liquidityType === LiquidityType.SemiLiquid) return s + amount * SAFETY_THRESHOLDS.semiLiquidHaircut;
    return s;
  }, 0);

  const totalLiabilities = liabilities.reduce((s, l) => s + dec(l.baseCurrencyOutstandingAmount), 0);
  const monthlyDebtPayments = liabilities.reduce((s, l) => s + dec(l.baseCurrencyMonthlyPayment), 0);

  const monthlyIncome = incomes.reduce((s, i) => s + toMonthly(dec(i.baseCurrencyAmount), i.frequency), 0);
  const monthlyMandatoryExpenses = mandatory.reduce(
    (s, m) => s + toMonthly(dec(m.baseCurrencyAmount), m.frequency),
    0,
  );

  const netWorth = totalAssets - totalLiabilities;
  const monthlySurplus = monthlyIncome - monthlyMandatoryExpenses - monthlyDebtPayments;

  // Current calendar-month spending from the expense log.
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const spendAgg = await prisma.expense.aggregate({
    where: { userId, date: { gte: monthStart } },
    _sum: { baseCurrencyAmount: true },
  });
  const currentMonthSpending = dec(spendAgg._sum.baseCurrencyAmount ?? new Prisma.Decimal(0));

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
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
