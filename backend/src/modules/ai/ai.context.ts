import { getFinancialSummary } from '../profile/profile.service.js';
import { listGoals } from '../goals/goals.service.js';
import { monthlySummary } from '../expenses/expenses.service.js';
import { getLevel } from '../level/level.service.js';

/**
 * Builds a compact, plain-text snapshot of the user's finances to feed the model
 * as grounding. Kept short to control token cost. All amounts are base currency.
 */
export async function buildFinancialContext(userId: string): Promise<string> {
  const [summary, goals, month, level] = await Promise.all([
    getFinancialSummary(userId),
    listGoals(userId),
    monthlySummary(userId),
    getLevel(userId),
  ]);

  const cur = summary.baseCurrency;
  const m = (n: number) => `${cur} ${Math.round(n)}`;

  const lines: string[] = [];
  lines.push(`Currency: ${cur}. Level ${level.level} (${level.name}).`);
  lines.push(
    `Net worth ${m(summary.netWorth)}; liquid ${m(summary.liquidNetWorth)}; monthly income ${m(summary.monthlyIncome)}; ` +
      `mandatory ${m(summary.monthlyMandatoryExpenses)}; debt payments ${m(summary.monthlyDebtPayments)}; ` +
      `monthly surplus ${m(summary.monthlySurplus)}.`,
  );
  lines.push(
    `Emergency fund ${Math.round(summary.emergencyFundHealth * 100)}% of target (${m(summary.emergencyFundTarget)}); ` +
      `debt-to-income ${Math.round(summary.debtToIncomeRatio * 100)}%.`,
  );
  lines.push(
    `This month: spent ${m(month.total)} of ${m(month.monthlyBudget)} budget (${month.overBudget ? 'OVER budget' : 'within budget'}); ` +
      `needs ${m(month.needTotal)}, wants ${m(month.wantTotal)}.`,
  );
  if (month.byCategory.length) {
    lines.push('Top categories: ' + month.byCategory.slice(0, 5).map((c) => `${c.category} ${m(c.amount)}`).join(', ') + '.');
  }

  const active = goals.filter((g) => g.status === 'ACTIVE');
  if (active.length) {
    lines.push('Active goals:');
    for (const g of active.slice(0, 8)) {
      const progress = g.baseCurrencyTargetAmount > 0 ? Math.round((g.baseCurrencyCurrentSavedAmount / g.baseCurrencyTargetAmount) * 100) : 0;
      lines.push(
        `- ${g.name} (${g.category}, ${g.type === 'SHORT_TERM' ? 'short-term' : 'long-term'}): ` +
          `target ${m(g.baseCurrencyTargetAmount)}, ${progress}% saved, ` +
          `recommendation ${g.recommendation ?? 'n/a'}` +
          (g.recommendedMonthlySaving ? `, suggested ${m(g.recommendedMonthlySaving)}/mo` : '') +
          '.',
      );
    }
  } else {
    lines.push('No active goals yet.');
  }

  return lines.join('\n');
}
