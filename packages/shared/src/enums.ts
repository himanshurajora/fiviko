/**
 * Domain enums shared across backend and frontend.
 *
 * These are declared as `const` objects + union types (rather than TS `enum`)
 * so they serialize cleanly over JSON and can be reused by Prisma, Zod and React
 * without runtime surprises.
 */

export const FinancialPersonality = {
  CarefulSaver: 'CAREFUL_SAVER',
  BalancedPlanner: 'BALANCED_PLANNER',
  DreamBuilder: 'DREAM_BUILDER',
  AggressiveAchiever: 'AGGRESSIVE_ACHIEVER',
} as const;
export type FinancialPersonality =
  (typeof FinancialPersonality)[keyof typeof FinancialPersonality];

export const AssetType = {
  BankBalance: 'BANK_BALANCE',
  Cash: 'CASH',
  Gold: 'GOLD',
  Stocks: 'STOCKS',
  MutualFunds: 'MUTUAL_FUNDS',
  Crypto: 'CRYPTO',
  Property: 'PROPERTY',
  Vehicle: 'VEHICLE',
  BusinessAsset: 'BUSINESS_ASSET',
  Other: 'OTHER',
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];

/** Whether an asset can be quickly turned into spendable cash. */
export const LiquidityType = {
  Liquid: 'LIQUID',
  SemiLiquid: 'SEMI_LIQUID',
  Illiquid: 'ILLIQUID',
} as const;
export type LiquidityType = (typeof LiquidityType)[keyof typeof LiquidityType];

export const LiabilityType = {
  PersonalLoan: 'PERSONAL_LOAN',
  EducationLoan: 'EDUCATION_LOAN',
  CreditCardDebt: 'CREDIT_CARD_DEBT',
  VehicleLoan: 'VEHICLE_LOAN',
  HomeLoan: 'HOME_LOAN',
  BorrowedMoney: 'BORROWED_MONEY',
  Other: 'OTHER',
} as const;
export type LiabilityType = (typeof LiabilityType)[keyof typeof LiabilityType];

export const IncomeType = {
  Salary: 'SALARY',
  Freelance: 'FREELANCE',
  Business: 'BUSINESS',
  PassiveIncome: 'PASSIVE_INCOME',
  Other: 'OTHER',
} as const;
export type IncomeType = (typeof IncomeType)[keyof typeof IncomeType];

export const Frequency = {
  Monthly: 'MONTHLY',
  Yearly: 'YEARLY',
  OneTime: 'ONE_TIME',
} as const;
export type Frequency = (typeof Frequency)[keyof typeof Frequency];

export const MandatoryExpenseCategory = {
  Rent: 'RENT',
  Insurance: 'INSURANCE',
  Food: 'FOOD',
  Groceries: 'GROCERIES',
  Travel: 'TRAVEL',
  Education: 'EDUCATION',
  Subscriptions: 'SUBSCRIPTIONS',
  Utilities: 'UTILITIES',
  LoanEmi: 'LOAN_EMI',
  Other: 'OTHER',
} as const;
export type MandatoryExpenseCategory =
  (typeof MandatoryExpenseCategory)[keyof typeof MandatoryExpenseCategory];

export const ExpenseCategory = {
  Food: 'FOOD',
  Groceries: 'GROCERIES',
  Transport: 'TRANSPORT',
  Shopping: 'SHOPPING',
  Entertainment: 'ENTERTAINMENT',
  Health: 'HEALTH',
  Bills: 'BILLS',
  Education: 'EDUCATION',
  Travel: 'TRAVEL',
  Subscriptions: 'SUBSCRIPTIONS',
  Other: 'OTHER',
} as const;
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const PaymentMethod = {
  Cash: 'CASH',
  Card: 'CARD',
  Upi: 'UPI',
  BankTransfer: 'BANK_TRANSFER',
  Wallet: 'WALLET',
  Other: 'OTHER',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const NeedOrWant = {
  Need: 'NEED',
  Want: 'WANT',
} as const;
export type NeedOrWant = (typeof NeedOrWant)[keyof typeof NeedOrWant];

/** Sync state for offline-first expense entry. */
export const SyncStatus = {
  Synced: 'SYNCED',
  Pending: 'PENDING',
} as const;
export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

export const GoalType = {
  ShortTerm: 'SHORT_TERM',
  LongTerm: 'LONG_TERM',
} as const;
export type GoalType = (typeof GoalType)[keyof typeof GoalType];

export const GoalCategory = {
  House: 'HOUSE',
  Car: 'CAR',
  Bike: 'BIKE',
  Laptop: 'LAPTOP',
  Phone: 'PHONE',
  Education: 'EDUCATION',
  BusinessEquipment: 'BUSINESS_EQUIPMENT',
  Travel: 'TRAVEL',
  Health: 'HEALTH',
  Family: 'FAMILY',
  Hobby: 'HOBBY',
  Luxury: 'LUXURY',
  EmergencyFund: 'EMERGENCY_FUND',
  Other: 'OTHER',
} as const;
export type GoalCategory = (typeof GoalCategory)[keyof typeof GoalCategory];

export const GoalStatus = {
  Active: 'ACTIVE',
  Achieved: 'ACHIEVED',
  Paused: 'PAUSED',
  Abandoned: 'ABANDONED',
} as const;
export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];

export const GoalPriority = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
} as const;
export type GoalPriority = (typeof GoalPriority)[keyof typeof GoalPriority];

/** The five possible purchase-decision outcomes. */
export const Recommendation = {
  BuyNow: 'BUY_NOW',
  Wait: 'WAIT',
  ReduceBudget: 'REDUCE_BUDGET',
  NotRecommended: 'NOT_RECOMMENDED',
  HardWarning: 'HARD_WARNING',
} as const;
export type Recommendation = (typeof Recommendation)[keyof typeof Recommendation];

export const StreakType = {
  Saving: 'SAVING',
  ExpenseLogging: 'EXPENSE_LOGGING',
  UnderBudget: 'UNDER_BUDGET',
  NoImpulse: 'NO_IMPULSE',
} as const;
export type StreakType = (typeof StreakType)[keyof typeof StreakType];

export const ChallengeType = {
  Daily: 'DAILY',
  Monthly: 'MONTHLY',
} as const;
export type ChallengeType = (typeof ChallengeType)[keyof typeof ChallengeType];

export const UserChallengeStatus = {
  InProgress: 'IN_PROGRESS',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
} as const;
export type UserChallengeStatus =
  (typeof UserChallengeStatus)[keyof typeof UserChallengeStatus];
