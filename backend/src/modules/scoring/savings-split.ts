import { SAFETY_THRESHOLDS, type FinancialSummary, type GoalScoreInputValues } from '@fiviko/shared';

/** Priority maps to a flat weight bonus in the goal-weight formula. */
const PRIORITY_WEIGHT: Record<string, number> = { LOW: 10, MEDIUM: 25, HIGH: 40 };

export interface SplitGoalInput {
  id: string;
  name: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Remaining amount to save, base currency. */
  remaining: number;
  /** May be null if the user hasn't answered the score questions yet. */
  scores: GoalScoreInputValues | null;
}

export interface GoalAllocation {
  goalId: string;
  name: string;
  weight: number;
  monthlyAllocation: number;
  monthsToComplete: number | null;
  estimatedCompletionDate: string | null;
}

export interface SavingsSplitResult {
  /** Money available for goals each month after obligations & emergency contribution. */
  monthlySavingsPool: number;
  /** Amount steered to the emergency fund first when the cushion is low. */
  emergencyContribution: number;
  allocations: GoalAllocation[];
  /** True when there's nothing to allocate (negative/zero surplus). */
  noSurplus: boolean;
}

/**
 * Goal weight (spec §11): rewards necessity, urgency, income/productivity impact
 * and growth; penalises luxury, maintenance burden and regret risk. Always >= 1
 * so every active goal receives at least a sliver of allocation.
 */
export function goalWeight(g: SplitGoalInput): number {
  const base = PRIORITY_WEIGHT[g.priority] ?? 25;
  if (!g.scores) return Math.max(1, base);
  const s = g.scores;
  const weight =
    base +
    s.necessity +
    s.urgency +
    s.productivity +
    s.incomeImpact +
    s.timeSaving +
    s.happiness +
    s.careerGrowth -
    s.dreamLuxury -
    s.maintenanceBurden -
    s.regretRisk;
  return Math.max(1, weight);
}

/**
 * Splits the monthly savings pool across active goals by weight (spec §11).
 * The emergency fund is funded first whenever the cushion is below target.
 */
export function computeSavingsSplit(summary: FinancialSummary, goals: SplitGoalInput[]): SavingsSplitResult {
  // Monthly Savings Pool = surplus - minimum emergency contribution.
  const emergencyContribution =
    summary.emergencyFundHealth < 1 && summary.monthlySurplus > 0
      ? Math.min(
          summary.monthlySurplus,
          summary.monthlyIncome * SAFETY_THRESHOLDS.minEmergencyContributionRate,
        )
      : 0;

  const monthlySavingsPool = round(Math.max(0, summary.monthlySurplus - emergencyContribution));
  const noSurplus = monthlySavingsPool <= 0;

  const active = goals.filter((g) => g.remaining > 0);
  const totalWeight = active.reduce((sum, g) => sum + goalWeight(g), 0);

  const allocations: GoalAllocation[] = goals.map((g) => {
    const weight = goalWeight(g);
    const share = !noSurplus && totalWeight > 0 && g.remaining > 0 ? weight / totalWeight : 0;
    const monthlyAllocation = round(monthlySavingsPool * share);
    const monthsToComplete =
      monthlyAllocation > 0 ? Math.ceil(g.remaining / monthlyAllocation) : null;
    return {
      goalId: g.id,
      name: g.name,
      weight: round(weight, 0),
      monthlyAllocation,
      monthsToComplete,
      estimatedCompletionDate: monthsToComplete != null ? addMonths(new Date(), monthsToComplete).toISOString() : null,
    };
  });

  return { monthlySavingsPool, emergencyContribution: round(emergencyContribution), allocations, noSurplus };
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
}
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
