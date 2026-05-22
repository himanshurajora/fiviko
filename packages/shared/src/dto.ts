import type {
  AssetType,
  ExpenseCategory,
  FinancialPersonality,
  Frequency,
  GoalCategory,
  GoalPriority,
  GoalStatus,
  GoalType,
  IncomeType,
  LiabilityType,
  LiquidityType,
  MandatoryExpenseCategory,
  NeedOrWant,
  PaymentMethod,
  Recommendation,
  StreakType,
  SyncStatus,
  ChallengeType,
  UserChallengeStatus,
} from './enums.js';

/** Public-safe representation of a user (never includes the password hash). */
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  baseCurrency: string;
  financialPersonality: FinancialPersonality | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: UserDTO;
  token: string;
}

/**
 * Derived financial figures shown across the dashboard and used by the scoring
 * engine. All amounts are in the user's base currency. (Spec §8.3.)
 */
export interface FinancialSummary {
  baseCurrency: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquidNetWorth: number;
  monthlyIncome: number;
  monthlyMandatoryExpenses: number;
  monthlyDebtPayments: number;
  monthlySurplus: number;
  /** Recommended emergency fund and how close the user is (0–1). */
  emergencyFundTarget: number;
  emergencyFundHealth: number;
  debtToIncomeRatio: number;
  currentMonthSpending: number;
  /** What the user can still safely spend this month. */
  safeRemainingSpend: number;
}

export interface GoalDTO {
  id: string;
  name: string;
  type: GoalType;
  category: GoalCategory;
  targetAmount: number;
  currency: string;
  baseCurrencyTargetAmount: number;
  currentSavedAmount: number;
  baseCurrencyCurrentSavedAmount: number;
  targetDate: string | null;
  priority: GoalPriority;
  expectedMaintenanceCost: number | null;
  expectedResaleValue: number | null;
  isReplacingExistingItem: boolean;
  status: GoalStatus;
  notes: string | null;
  /** Auto-computed monthly allocation from the savings split (if any). */
  recommendedMonthlySaving?: number;
  estimatedCompletionDate?: string | null;
  recommendation?: Recommendation;
  createdAt: string;
  updatedAt: string;
}

export interface AssetDTO {
  id: string;
  type: AssetType;
  name: string;
  amount: number;
  currency: string;
  baseCurrencyAmount: number;
  liquidityType: LiquidityType;
  createdAt: string;
  updatedAt: string;
}

export interface LiabilityDTO {
  id: string;
  type: LiabilityType;
  name: string;
  outstandingAmount: number;
  monthlyPayment: number;
  currency: string;
  baseCurrencyOutstandingAmount: number;
  baseCurrencyMonthlyPayment: number;
  interestRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeDTO {
  id: string;
  type: IncomeType;
  amount: number;
  currency: string;
  baseCurrencyAmount: number;
  frequency: Frequency;
  createdAt: string;
  updatedAt: string;
}

export interface MandatoryExpenseDTO {
  id: string;
  category: MandatoryExpenseCategory;
  amount: number;
  currency: string;
  baseCurrencyAmount: number;
  frequency: Frequency;
  createdAt: string;
  updatedAt: string;
}

/** Single-shot payload submitted at the end of the gamified onboarding (spec §8.2). */
export interface OnboardingPayload {
  baseCurrency: string;
  financialPersonality: FinancialPersonality;
  incomes: { type: IncomeType; amount: number; frequency: Frequency }[];
  mandatoryExpenses: { category: MandatoryExpenseCategory; amount: number; frequency: Frequency }[];
  assets: { type: AssetType; name: string; amount: number; liquidityType: LiquidityType }[];
  liabilities: { type: LiabilityType; name: string; outstandingAmount: number; monthlyPayment: number }[];
  firstGoal?: {
    name: string;
    type: GoalType;
    category: GoalCategory;
    targetAmount: number;
    priority: GoalPriority;
  } | null;
}

export interface OnboardingResult {
  summary: FinancialSummary;
  /** Health score 0–100 shown on the reveal step. */
  healthScore: number;
  unlockedBadges: BadgeDTO[];
  goalId: string | null;
}

export interface ExpenseDTO {
  id: string;
  amount: number;
  currency: string;
  baseCurrencyAmount: number;
  category: ExpenseCategory;
  note: string | null;
  date: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  needOrWant: NeedOrWant;
  linkedGoalId: string | null;
  syncStatus: SyncStatus;
  clientId: string | null;
  createdAt: string;
}

/** Spending rollup for one calendar month (spec §8.4). Amounts in base currency. */
export interface MonthlySummary {
  /** YYYY-MM */
  month: string;
  baseCurrency: string;
  total: number;
  count: number;
  byCategory: { category: ExpenseCategory; amount: number; pct: number }[];
  needTotal: number;
  wantTotal: number;
  dailyAverage: number;
  daysElapsed: number;
  daysInMonth: number;
  /** Disposable monthly budget (income − mandatory − debt). */
  monthlyBudget: number;
  remainingSafeSpend: number;
  overBudget: boolean;
}

export interface StreakDTO {
  type: StreakType;
  currentCount: number;
  longestCount: number;
  lastUpdatedAt: string | null;
}

export interface ChallengeDTO {
  id: string;
  code: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  progress: number;
  status: UserChallengeStatus;
  rewardBadge: { name: string; icon: string } | null;
}

export interface BadgeDTO {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

/** A standard error envelope returned by the API. */
export interface ApiError {
  error: {
    message: string;
    code?: string;
    /** Field-level validation issues, keyed by field path. */
    details?: Record<string, string[]>;
  };
}
