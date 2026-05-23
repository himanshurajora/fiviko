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
  /** "This month so far" strip on the Money hub — derived from CashFlow rows. */
  currentMonthInflow: number;
  currentMonthOutflow: number;
  /** inflow − outflow. The bit a user actually controls (FX drift is excluded). */
  currentMonthNetChange: number;
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
  /** What was owed at creation; the denominator for "% paid down". */
  originalOutstandingAmount: number;
  /** 0..1, clipped — driven by outstanding vs original. */
  paidDownProgress: number;
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
  /** Optional label so multiple sources of the same type are distinguishable. */
  name: string | null;
  /** Modelled/expected per-period amount in native currency. */
  amount: number;
  currency: string;
  baseCurrencyAmount: number;
  frequency: Frequency;
  /** Asset that auto-receives this income each month, or null. */
  depositToAssetId: string | null;
  /** Last month (YYYY-MM) the auto-credit was applied. */
  lastDepositedMonth: string | null;
  /** Most recent IncomeReceipt — null if the user hasn't logged any actuals yet. */
  latestReceipt: IncomeReceiptDTO | null;
  createdAt: string;
  updatedAt: string;
}

/** A logged actual receipt for one income source in one period (YYYY-MM). */
export interface IncomeReceiptDTO {
  id: string;
  incomeId: string;
  /** YYYY-MM */
  periodKey: string;
  amount: number;
  currency: string;
  baseCurrencyAmount: number;
  source: 'manual' | 'auto';
  receivedAt: string;
  note: string | null;
  createdAt: string;
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

/** A recorded month of income (spec §16). Editable for variable-income months. */
export interface IncomeHistoryEntry {
  /** YYYY-MM */
  month: string;
  amount: number;
  source: 'auto' | 'manual';
}

/** One day's net-worth snapshot for the net-worth trend (spec §16). */
export interface NetWorthHistoryEntry {
  /** YYYY-MM-DD */
  date: string;
  netWorth: number;
  liquidNetWorth: number;
}

/** A category's monthly budget cap and how much has been spent this month. */
export interface CategoryBudgetStatus {
  category: ExpenseCategory;
  /** Monthly cap in base currency, or null if no cap is set. */
  monthlyLimit: number | null;
  /** Base-currency spend in this category this month. */
  spent: number;
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

/** One point on the multi-month income-vs-spending trend (spec §16). */
export interface ExpenseTrendPoint {
  /** YYYY-MM */
  month: string;
  /** Total spending logged that month (base currency). */
  total: number;
  /** Monthly income reference for that month (base currency). */
  income: number;
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

/** A transfer between two accounts — returns the two paired balance entries
 *  the server wrote, plus the FX rate used if cross-currency. */
export interface TransferResult {
  /** Stable id linking both sides of the transfer. */
  transferId: string;
  fromAssetId: string;
  toAssetId: string;
  /** Native amount that left the source account. */
  fromAmount: number;
  fromCurrency: string;
  /** Native amount that landed in the destination account (may differ if FX). */
  toAmount: number;
  toCurrency: string;
  /** Rate applied at transfer time: toAmount = fromAmount × fxRate. */
  fxRate: number;
}

/** One bin of expense data for the D/W/M/Y trend on the Expenses page. */
export type ExpenseGranularity = 'D' | 'W' | 'M' | 'Y';

export interface ExpenseTrendBin {
  /** Bucket key — YYYY-MM-DD (D), YYYY-W## (W), YYYY-MM (M), YYYY (Y). */
  key: string;
  /** Human label rendered on the X axis. */
  label: string;
  /** Spend total in base currency for this bucket. */
  total: number;
}

export interface ExpenseTrendResult {
  granularity: ExpenseGranularity;
  bins: ExpenseTrendBin[];
  /** Total of the most recent fully-elapsed bin (the "current period"). */
  currentTotal: number;
  /** Total of the period immediately before that. */
  priorTotal: number;
  /** Signed: positive = spending grew. */
  deltaAbsolute: number;
  /** Signed proportion (1.0 = doubled). null if prior was zero. */
  deltaPct: number | null;
  /** The category that contributed most to the delta, if any. */
  topMover: {
    category: ExpenseCategory;
    delta: number;
  } | null;
}

/** One-tap recurring spend pattern derived from the user's last-30-days log. */
export interface QuickAddSuggestion {
  category: ExpenseCategory;
  amount: number;
  currency: string;
  note: string | null;
  paymentMethod: PaymentMethod;
  needOrWant: NeedOrWant;
  /** How often this exact pattern appeared in the last 30 days. */
  occurrences: number;
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
