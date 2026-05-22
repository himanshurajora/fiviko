import type { Recommendation } from './enums.js';
import type { FinancialSummary } from './dto.js';

/**
 * The thirteen 1–100 subjective scores a user answers when creating a goal.
 * (See spec §8.6.) All values are integers 1–100.
 */
export interface GoalScoreInputValues {
  incomeImpact: number;
  productivity: number;
  happiness: number;
  necessity: number;
  urgency: number;
  dreamLuxury: number;
  timeSaving: number;
  frequencyOfUse: number;
  careerGrowth: number;
  healthWellbeing: number;
  familySocialImpact: number;
  regretRisk: number;
  maintenanceBurden: number;
}

/** Metadata describing each score question for rendering the slider UI. */
export interface ScoreQuestionMeta {
  key: keyof GoalScoreInputValues;
  label: string;
  helper: string;
  emoji: string;
  /** When true, a high value is a negative signal (penalty), not a benefit. */
  inverse: boolean;
}

export const SCORE_QUESTIONS: ScoreQuestionMeta[] = [
  { key: 'incomeImpact', label: 'Income Impact', helper: 'How much can this increase your income?', emoji: '💰', inverse: false },
  { key: 'productivity', label: 'Productivity', helper: 'How much will this improve your productivity?', emoji: '⚡', inverse: false },
  { key: 'happiness', label: 'Happiness', helper: 'How happy will this make you?', emoji: '😄', inverse: false },
  { key: 'necessity', label: 'Necessity', helper: 'How necessary is this in your life right now?', emoji: '🎯', inverse: false },
  { key: 'urgency', label: 'Urgency', helper: 'How soon do you genuinely need it?', emoji: '⏰', inverse: false },
  { key: 'dreamLuxury', label: 'Dream / Luxury', helper: 'Is this more of a dream or luxury purchase?', emoji: '✨', inverse: true },
  { key: 'timeSaving', label: 'Time Saving', helper: 'How much time will this save you?', emoji: '⏳', inverse: false },
  { key: 'frequencyOfUse', label: 'Frequency of Use', helper: 'How often will you use it?', emoji: '🔁', inverse: false },
  { key: 'careerGrowth', label: 'Career / Education Growth', helper: 'Will this help your career, education or skills?', emoji: '📈', inverse: false },
  { key: 'healthWellbeing', label: 'Health / Wellbeing', helper: 'Will this improve health, comfort or wellbeing?', emoji: '❤️', inverse: false },
  { key: 'familySocialImpact', label: 'Family / Social Impact', helper: 'Will this positively affect family or relationships?', emoji: '👨‍👩‍👧', inverse: false },
  { key: 'regretRisk', label: 'Regret Risk', helper: 'How likely are you to regret this purchase?', emoji: '😬', inverse: true },
  { key: 'maintenanceBurden', label: 'Maintenance Burden', helper: 'How much future running cost will it create?', emoji: '🔧', inverse: true },
];

/**
 * Configurable weights for the scoring engine. Kept in one place (spec §9) so the
 * model can be tuned without touching engine logic. All sub-scores are normalised
 * to 0–100 before being combined with these weights.
 */
export const SCORING_WEIGHTS = {
  /**
   * Weights for combining components into the final readiness score.
   * The three positive components sum to 1.0 (so they alone can reach 100);
   * the two penalties are then subtracted. Final score is clamped to 0–100.
   */
  components: {
    financialSafety: 0.35,
    personalValue: 0.3,
    futureBenefit: 0.35,
    riskPenalty: 0.3,
    goalConflictPenalty: 0.2,
  },
  /** Financial Safety: positive strengths sum to 1.0; penalties are subtracted. */
  financialSafety: {
    netWorthStrength: 0.25,
    liquidMoneyStrength: 0.3,
    monthlySurplusStrength: 0.2,
    emergencyFundStrength: 0.25,
    debtPressure: 0.25,
    overspendingPenalty: 0.15,
  },
  /** Weights inside the Personal Value sub-score (over the user's 1–100 answers). */
  personalValue: {
    happiness: 0.2,
    necessity: 0.25,
    urgency: 0.2,
    frequencyOfUse: 0.15,
    healthWellbeing: 0.1,
    familySocialImpact: 0.1,
  },
  /** Weights inside the Future Benefit sub-score. */
  futureBenefit: {
    incomeImpact: 0.3,
    productivity: 0.25,
    timeSaving: 0.2,
    careerGrowth: 0.25,
  },
  /** Weights inside the Risk Penalty sub-score. */
  risk: {
    lowEmergencyFund: 0.2,
    highEmiBurden: 0.15,
    lowLiquidity: 0.15,
    dreamLuxury: 0.15,
    maintenanceBurden: 0.1,
    regretRisk: 0.15,
    negativeSurplus: 0.1,
  },
} as const;

/** Thresholds used for hard-warning rules and safety checks (spec §17). */
export const SAFETY_THRESHOLDS = {
  /** Recommended emergency fund = this many months of mandatory expenses. */
  emergencyFundMonths: 6,
  /** A "healthy" debt-to-income ratio ceiling. Above this, debt pressure rises. */
  maxHealthyDebtToIncome: 0.36,
  /** Minimum share of monthly income to set aside for the emergency fund. */
  minEmergencyContributionRate: 0.1,
  /** Below this readiness score, the purchase is "Not Recommended". */
  notRecommendedBelow: 40,
  /** At/above this readiness score, "Buy Now" is allowed (if no hard warning). */
  buyNowAtOrAbove: 70,
  /** Liquid money must stay above this multiple of mandatory expenses post-purchase. */
  minLiquidityMonthsAfterPurchase: 3,
  /**
   * Fraction of semi-liquid assets (stocks, gold, mutual funds…) counted toward
   * "liquid" money — they can be sold, but with friction/volatility, so we apply
   * a haircut rather than counting them fully or not at all.
   */
  semiLiquidHaircut: 0.6,
  /**
   * When a user has no mandatory expenses logged yet, base the emergency-fund
   * target on this fraction of monthly income (assume part of income is
   * essential) so the target never collapses to zero.
   */
  emergencyIncomeEssentialRate: 0.5,
} as const;

/**
 * Smart 1–100 score defaults per goal category. Lets a goal be created (and
 * scored) with zero slider work — used by the create flow and to auto-seed the
 * onboarding goal. Each profile encodes the typical character of the category.
 */
const NEUTRAL_SCORES: GoalScoreInputValues = {
  incomeImpact: 50, productivity: 50, happiness: 50, necessity: 50, urgency: 50,
  dreamLuxury: 50, timeSaving: 50, frequencyOfUse: 50, careerGrowth: 50,
  healthWellbeing: 50, familySocialImpact: 50, regretRisk: 50, maintenanceBurden: 50,
};

const withScores = (p: Partial<GoalScoreInputValues>): GoalScoreInputValues => ({ ...NEUTRAL_SCORES, ...p });

/** Keyed by GoalCategory string value (see enums.ts). */
export const CATEGORY_SCORE_PRESETS: Record<string, GoalScoreInputValues> = {
  LAPTOP: withScores({ incomeImpact: 75, productivity: 88, necessity: 70, timeSaving: 72, frequencyOfUse: 92, careerGrowth: 78, dreamLuxury: 25, regretRisk: 18, maintenanceBurden: 25, happiness: 55, healthWellbeing: 30, familySocialImpact: 25 }),
  PHONE: withScores({ incomeImpact: 40, productivity: 62, happiness: 65, necessity: 65, frequencyOfUse: 95, dreamLuxury: 45, careerGrowth: 40, familySocialImpact: 50, regretRisk: 35, maintenanceBurden: 30, healthWellbeing: 30 }),
  HOUSE: withScores({ happiness: 85, necessity: 90, frequencyOfUse: 100, familySocialImpact: 85, healthWellbeing: 60, maintenanceBurden: 70, dreamLuxury: 50, careerGrowth: 25, regretRisk: 30, incomeImpact: 40, productivity: 40 }),
  CAR: withScores({ timeSaving: 82, frequencyOfUse: 90, necessity: 65, happiness: 65, maintenanceBurden: 72, dreamLuxury: 50, familySocialImpact: 55, productivity: 55, regretRisk: 40, incomeImpact: 35 }),
  BIKE: withScores({ timeSaving: 78, frequencyOfUse: 85, necessity: 55, happiness: 62, maintenanceBurden: 50, healthWellbeing: 50, dreamLuxury: 45, regretRisk: 35, productivity: 45, incomeImpact: 30 }),
  EDUCATION: withScores({ incomeImpact: 78, productivity: 70, necessity: 70, careerGrowth: 92, dreamLuxury: 15, regretRisk: 18, maintenanceBurden: 15, happiness: 60, frequencyOfUse: 60 }),
  BUSINESS_EQUIPMENT: withScores({ incomeImpact: 85, productivity: 86, necessity: 75, timeSaving: 75, frequencyOfUse: 85, careerGrowth: 70, dreamLuxury: 20, regretRisk: 22, maintenanceBurden: 40, happiness: 45 }),
  TRAVEL: withScores({ happiness: 92, dreamLuxury: 70, familySocialImpact: 72, necessity: 25, frequencyOfUse: 20, incomeImpact: 12, productivity: 18, timeSaving: 12, careerGrowth: 22, regretRisk: 45, maintenanceBurden: 10, healthWellbeing: 55 }),
  HEALTH: withScores({ healthWellbeing: 95, necessity: 82, happiness: 72, urgency: 68, frequencyOfUse: 70, dreamLuxury: 12, regretRisk: 18, familySocialImpact: 50, incomeImpact: 20, productivity: 45 }),
  FAMILY: withScores({ familySocialImpact: 92, happiness: 82, necessity: 65, healthWellbeing: 55, frequencyOfUse: 60, dreamLuxury: 35, regretRisk: 25, incomeImpact: 20, productivity: 25 }),
  HOBBY: withScores({ happiness: 85, dreamLuxury: 60, frequencyOfUse: 60, necessity: 25, regretRisk: 45, maintenanceBurden: 45, healthWellbeing: 48, incomeImpact: 15, productivity: 28 }),
  LUXURY: withScores({ dreamLuxury: 95, happiness: 82, necessity: 10, urgency: 15, frequencyOfUse: 35, regretRisk: 65, maintenanceBurden: 55, incomeImpact: 10, productivity: 10, careerGrowth: 10, healthWellbeing: 15 }),
  EMERGENCY_FUND: withScores({ necessity: 95, urgency: 72, healthWellbeing: 60, familySocialImpact: 60, dreamLuxury: 5, regretRisk: 8, maintenanceBurden: 5, frequencyOfUse: 30, happiness: 45, incomeImpact: 20, productivity: 20, careerGrowth: 10, timeSaving: 10 }),
  OTHER: NEUTRAL_SCORES,
};

/** Net-worth affordability multipliers per goal category (spec §10). */
export const CATEGORY_NET_WORTH_MULTIPLIER: Record<string, number> = {
  HOUSE: 3,
  CAR: 5,
  BIKE: 4,
  LAPTOP: 2,
  PHONE: 3,
  EDUCATION: 1.5,
  BUSINESS_EQUIPMENT: 1.5,
  TRAVEL: 4,
  HOBBY: 5,
  LUXURY: 8,
  HEALTH: 2,
  FAMILY: 3,
  EMERGENCY_FUND: 1,
  OTHER: 4,
};

/**
 * A transparent 0–100 financial-health score blending emergency-fund health,
 * monthly-surplus health and debt pressure. Shared so the dashboard, onboarding
 * reveal and backend all report the same number.
 */
export function computeHealthScore(s: FinancialSummary): number {
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const emergency = s.emergencyFundHealth * 100;
  const surplus = s.monthlyIncome > 0 ? clamp01(s.monthlySurplus / s.monthlyIncome) * 100 : 0;
  const debt = (1 - Math.min(1, s.debtToIncomeRatio / 0.5)) * 100;
  const score = emergency * 0.4 + surplus * 0.35 + debt * 0.25;
  return Math.round(clamp01(score / 100) * 100);
}

/** A single named factor that contributed to the score, for transparent explanations. */
export interface ScoreFactor {
  label: string;
  /** Positive = helped the decision, negative = hurt it. */
  impact: number;
  detail: string;
}

/** How buying this goal now would affect one other goal. */
export interface GoalConflict {
  goalId: string;
  goalName: string;
  /** Estimated extra months of delay caused to that goal. */
  delayMonths: number;
  /** Percentage progress reduction caused to that goal. */
  progressReductionPct: number;
}

/** Full, explainable result of running the purchase-decision engine on a goal. */
export interface RecommendationResult {
  purchaseReadinessScore: number;
  financialSafetyScore: number;
  personalValueScore: number;
  futureBenefitScore: number;
  riskScore: number;
  goalConflictScore: number;
  recommendation: Recommendation;
  safeBudgetMin: number;
  safeBudgetMax: number;
  recommendedPurchaseDate: string | null;
  monthlySavingRequired: number;
  explanation: string;
  factors: ScoreFactor[];
  conflicts: GoalConflict[];
}
