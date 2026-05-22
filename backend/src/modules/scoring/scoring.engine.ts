import {
  CATEGORY_NET_WORTH_MULTIPLIER,
  Recommendation,
  SAFETY_THRESHOLDS,
  SCORING_WEIGHTS,
  type FinancialSummary,
  type GoalCategory,
  type GoalConflict,
  type GoalScoreInputValues,
  type GoalType,
  type RecommendationResult,
  type ScoreFactor,
} from '@fiviko/shared';

/** One competing active goal, used for conflict and savings-split reasoning. */
export interface CompetingGoal {
  id: string;
  name: string;
  /** Remaining amount to save, in base currency. */
  remaining: number;
}

/** Everything the engine needs to score a single purchase decision. */
export interface ScoringContext {
  summary: FinancialSummary;
  scores: GoalScoreInputValues;
  /** Goal target & progress in base currency. */
  targetAmount: number;
  currentSaved: number;
  category: GoalCategory;
  goalType: GoalType;
  targetDate: Date | null;
  /** Monthly amount the user can put toward goals (from the savings-split pool). */
  monthlySavingsPool: number;
  /** Other active goals competing for the same savings pool / liquidity. */
  competingGoals: CompetingGoal[];
  now?: Date;
}

const clamp = (n: number, min = 0, max = 100): number => Math.max(min, Math.min(max, n));
const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const round = (n: number, dp = 2): number => {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/**
 * The purchase-decision engine (spec §7–§11). Pure and deterministic: given the
 * same context it always returns the same result, and every number is traceable
 * through the returned `factors`. Tunable via SCORING_WEIGHTS in @fiviko/shared.
 */
export function scorePurchase(ctx: ScoringContext): RecommendationResult {
  const now = ctx.now ?? new Date();
  const { summary: s, scores, targetAmount } = ctx;
  const multiplier = CATEGORY_NET_WORTH_MULTIPLIER[ctx.category] ?? 4;

  // --- Financial Safety (0–100) -------------------------------------------
  const netWorthStrength = clamp01(s.netWorth / (targetAmount * multiplier || 1)) * 100;
  const liquidMoneyStrength = clamp01(s.liquidNetWorth / (targetAmount || 1)) * 100;
  const surplusStrength = clamp01(s.monthlyIncome > 0 ? s.monthlySurplus / (s.monthlyIncome * 0.25) : 0) * 100;
  const emergencyStrength = s.emergencyFundHealth * 100;
  const debtPressure = clamp01(s.debtToIncomeRatio / SAFETY_THRESHOLDS.maxHealthyDebtToIncome) * 100;
  const overspendPenalty = s.monthlySurplus < 0 ? 100 : clamp01(s.currentMonthSpending / (Math.max(1, s.monthlySurplus) + s.currentMonthSpending)) * 100;

  const fw = SCORING_WEIGHTS.financialSafety;
  const financialSafetyScore = clamp(
    netWorthStrength * fw.netWorthStrength +
      liquidMoneyStrength * fw.liquidMoneyStrength +
      surplusStrength * fw.monthlySurplusStrength +
      emergencyStrength * fw.emergencyFundStrength -
      debtPressure * fw.debtPressure -
      overspendPenalty * fw.overspendingPenalty,
  );

  // --- Personal Value (0–100) ---------------------------------------------
  const pv = SCORING_WEIGHTS.personalValue;
  const personalValueScore = clamp(
    scores.happiness * pv.happiness +
      scores.necessity * pv.necessity +
      scores.urgency * pv.urgency +
      scores.frequencyOfUse * pv.frequencyOfUse +
      scores.healthWellbeing * pv.healthWellbeing +
      scores.familySocialImpact * pv.familySocialImpact,
  );

  // --- Future Benefit (0–100) ---------------------------------------------
  const fb = SCORING_WEIGHTS.futureBenefit;
  const futureBenefitScore = clamp(
    scores.incomeImpact * fb.incomeImpact +
      scores.productivity * fb.productivity +
      scores.timeSaving * fb.timeSaving +
      scores.careerGrowth * fb.careerGrowth,
  );

  // --- Risk (0–100, higher = riskier) -------------------------------------
  const liquidAfter = s.liquidNetWorth - targetAmount;
  const rw = SCORING_WEIGHTS.risk;
  const riskScore = clamp(
    (1 - s.emergencyFundHealth) * 100 * rw.lowEmergencyFund +
      clamp01(s.debtToIncomeRatio / 0.5) * 100 * rw.highEmiBurden +
      (1 - clamp01(s.liquidNetWorth / (targetAmount || 1))) * 100 * rw.lowLiquidity +
      scores.dreamLuxury * rw.dreamLuxury +
      scores.maintenanceBurden * rw.maintenanceBurden +
      scores.regretRisk * rw.regretRisk +
      (s.monthlySurplus < 0 ? 100 : 0) * rw.negativeSurplus,
  );

  // --- Goal Conflict (0–100, higher = more disruptive) --------------------
  const { goalConflictScore, conflicts } = computeConflicts(ctx, now);

  // --- Final readiness ----------------------------------------------------
  const cw = SCORING_WEIGHTS.components;
  const purchaseReadinessScore = clamp(
    financialSafetyScore * cw.financialSafety +
      personalValueScore * cw.personalValue +
      futureBenefitScore * cw.futureBenefit -
      riskScore * cw.riskPenalty -
      goalConflictScore * cw.goalConflictPenalty,
  );

  // --- Hard-warning rules (spec §17) --------------------------------------
  const emergencyTarget = s.emergencyFundTarget;
  const cannotCoverMandatory = liquidAfter < s.monthlyMandatoryExpenses * SAFETY_THRESHOLDS.minLiquidityMonthsAfterPurchase;
  const breaksEmergency = liquidAfter < emergencyTarget && s.emergencyFundHealth < 0.5;
  const highCostLowNeed = scores.necessity < 30 && scores.dreamLuxury > 70 && targetAmount > s.monthlyIncome;
  const hardWarning =
    s.monthlySurplus < 0 ||
    s.debtToIncomeRatio > SAFETY_THRESHOLDS.maxHealthyDebtToIncome * 1.5 ||
    cannotCoverMandatory ||
    breaksEmergency ||
    highCostLowNeed;

  const recommendation = decideRecommendation(purchaseReadinessScore, hardWarning);

  // --- Saving plan & safe budget ------------------------------------------
  const remaining = Math.max(0, targetAmount - ctx.currentSaved);
  const horizonMonths = ctx.targetDate
    ? Math.max(1, monthsBetween(now, ctx.targetDate))
    : ctx.goalType === 'SHORT_TERM'
      ? 6
      : 24;
  const monthlySavingRequired = round(remaining / horizonMonths);

  const monthsToAfford =
    ctx.monthlySavingsPool > 0 ? Math.ceil(remaining / ctx.monthlySavingsPool) : null;
  const recommendedPurchaseDate =
    recommendation === Recommendation.BuyNow
      ? now
      : monthsToAfford != null
        ? addMonths(now, monthsToAfford)
        : ctx.targetDate;

  const affordableByNetWorth = s.netWorth / multiplier;
  const affordableByLiquidity = Math.max(0, s.liquidNetWorth - emergencyTarget) + ctx.monthlySavingsPool * 12;
  const safeBudgetMax = round(Math.max(0, Math.min(affordableByNetWorth, affordableByLiquidity)));
  const safeBudgetMin = round(safeBudgetMax * 0.5);

  // --- Transparent factors & explanation ----------------------------------
  const factors = buildFactors({
    netWorthStrength,
    liquidMoneyStrength,
    surplusStrength,
    emergencyStrength,
    debtPressure,
    riskScore,
    goalConflictScore,
    personalValueScore,
    futureBenefitScore,
  });

  const explanation = buildExplanation({
    recommendation,
    score: purchaseReadinessScore,
    hardWarning,
    breaksEmergency,
    cannotCoverMandatory,
    personalValueScore,
    futureBenefitScore,
    conflicts,
  });

  return {
    purchaseReadinessScore: round(purchaseReadinessScore),
    financialSafetyScore: round(financialSafetyScore),
    personalValueScore: round(personalValueScore),
    futureBenefitScore: round(futureBenefitScore),
    riskScore: round(riskScore),
    goalConflictScore: round(goalConflictScore),
    recommendation,
    safeBudgetMin,
    safeBudgetMax,
    recommendedPurchaseDate: recommendedPurchaseDate ? recommendedPurchaseDate.toISOString() : null,
    monthlySavingRequired,
    explanation,
    factors,
    conflicts,
  };
}

function decideRecommendation(score: number, hardWarning: boolean): Recommendation {
  if (hardWarning) return Recommendation.HardWarning;
  if (score >= SAFETY_THRESHOLDS.buyNowAtOrAbove) return Recommendation.BuyNow;
  if (score >= 55) return Recommendation.Wait;
  if (score >= SAFETY_THRESHOLDS.notRecommendedBelow) return Recommendation.ReduceBudget;
  return Recommendation.NotRecommended;
}

/**
 * Estimates how buying this goal *now* disrupts other active goals. Buying now
 * consumes liquidity; any shortfall must be financed from the monthly savings
 * pool, starving competing goals for that many months.
 */
function computeConflicts(ctx: ScoringContext, _now: Date): { goalConflictScore: number; conflicts: GoalConflict[] } {
  const { summary: s, targetAmount, monthlySavingsPool, competingGoals } = ctx;
  const shortfall = Math.max(0, targetAmount - s.liquidNetWorth);
  const monthsDiverted = monthlySavingsPool > 0 ? Math.ceil(shortfall / monthlySavingsPool) : shortfall > 0 ? 36 : 0;

  const conflicts: GoalConflict[] = competingGoals.map((g) => {
    const reduction = g.remaining > 0 ? clamp01((monthlySavingsPool * monthsDiverted) / g.remaining) : 0;
    return {
      goalId: g.id,
      goalName: g.name,
      delayMonths: monthsDiverted,
      progressReductionPct: round(reduction * 100, 0),
    };
  });

  const liquidAfter = s.liquidNetWorth - targetAmount;
  const emergencyDrop =
    s.emergencyFundTarget > 0 ? clamp01((s.emergencyFundTarget - liquidAfter) / s.emergencyFundTarget) : 0;

  const goalConflictScore = clamp(
    100 *
      (0.5 * clamp01(shortfall / Math.max(1, monthlySavingsPool * 6)) +
        0.3 * emergencyDrop +
        0.2 * clamp01(competingGoals.length / 5)),
  );

  return { goalConflictScore, conflicts };
}

function buildFactors(v: Record<string, number>): ScoreFactor[] {
  const factors: ScoreFactor[] = [
    { label: 'Liquid affordability', impact: round(v.liquidMoneyStrength - 50), detail: 'Can you pay from cash on hand?' },
    { label: 'Net worth strength', impact: round(v.netWorthStrength - 50), detail: 'Your wealth relative to the price.' },
    { label: 'Monthly surplus', impact: round(v.surplusStrength - 50), detail: 'Money left over each month.' },
    { label: 'Emergency fund', impact: round(v.emergencyStrength - 50), detail: 'Your safety cushion.' },
    { label: 'Personal value', impact: round(v.personalValueScore - 50), detail: 'How much this matters to you.' },
    { label: 'Future benefit', impact: round(v.futureBenefitScore - 50), detail: 'Income, productivity & growth payoff.' },
    { label: 'Debt pressure', impact: -round(v.debtPressure / 2), detail: 'Existing debt obligations.' },
    { label: 'Risk', impact: -round(v.riskScore / 2), detail: 'Luxury, regret & maintenance risk.' },
    { label: 'Goal conflict', impact: -round(v.goalConflictScore / 2), detail: 'Impact on your other goals.' },
  ];
  // Surface the most influential factors first.
  return factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

function buildExplanation(args: {
  recommendation: Recommendation;
  score: number;
  hardWarning: boolean;
  breaksEmergency: boolean;
  cannotCoverMandatory: boolean;
  personalValueScore: number;
  futureBenefitScore: number;
  conflicts: GoalConflict[];
}): string {
  const { recommendation, breaksEmergency, cannotCoverMandatory, personalValueScore, futureBenefitScore, conflicts } = args;
  const delayed = conflicts.filter((c) => c.delayMonths > 0);
  const parts: string[] = [];

  switch (recommendation) {
    case Recommendation.BuyNow:
      parts.push('This purchase fits your finances well.');
      if (futureBenefitScore >= 60) parts.push('It has strong income or productivity payoff,');
      if (personalValueScore >= 60) parts.push('and clear personal value,');
      parts.push('and it does not break your safety buffer or stall important goals.');
      break;
    case Recommendation.Wait:
      parts.push('You’re close, but waiting a little builds a safer cushion first.');
      if (delayed.length) parts.push(`Buying now would delay ${delayed.length} other goal${delayed.length > 1 ? 's' : ''}.`);
      break;
    case Recommendation.ReduceBudget:
      parts.push('Consider a cheaper option or saving more before buying.');
      parts.push('At this price it strains your monthly room.');
      break;
    case Recommendation.NotRecommended:
      parts.push('This isn’t a great time for this purchase.');
      parts.push('Its cost and value don’t justify the financial pressure right now.');
      break;
    case Recommendation.HardWarning:
      parts.push('⚠️ Strong caution.');
      if (cannotCoverMandatory) parts.push('Buying now could leave you unable to cover mandatory expenses.');
      if (breaksEmergency) parts.push('It would push your emergency fund below a safe level.');
      if (delayed.length) parts.push(`It would also delay ${delayed.length} active goal${delayed.length > 1 ? 's' : ''}.`);
      if (!cannotCoverMandatory && !breaksEmergency && !delayed.length) parts.push('Your current finances make this risky.');
      break;
  }
  return parts.join(' ').replace(/\s+,/g, ',');
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
