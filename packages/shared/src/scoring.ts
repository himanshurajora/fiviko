import type { Recommendation } from './enums.js';

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
  /** Weights for combining the four components into the final readiness score. */
  components: {
    financialSafety: 0.35,
    personalValue: 0.3,
    futureBenefit: 0.35,
    riskPenalty: 0.3,
    goalConflictPenalty: 0.2,
  },
  /** Weights inside the Financial Safety sub-score. */
  financialSafety: {
    netWorthStrength: 0.2,
    liquidMoneyStrength: 0.25,
    monthlySurplusStrength: 0.2,
    emergencyFundStrength: 0.2,
    debtPressure: 0.1,
    overspendingPenalty: 0.05,
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
} as const;

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
