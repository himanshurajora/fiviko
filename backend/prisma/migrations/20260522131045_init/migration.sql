-- CreateEnum
CREATE TYPE "FinancialPersonality" AS ENUM ('CAREFUL_SAVER', 'BALANCED_PLANNER', 'DREAM_BUILDER', 'AGGRESSIVE_ACHIEVER');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('BANK_BALANCE', 'CASH', 'GOLD', 'STOCKS', 'MUTUAL_FUNDS', 'CRYPTO', 'PROPERTY', 'VEHICLE', 'BUSINESS_ASSET', 'OTHER');

-- CreateEnum
CREATE TYPE "LiquidityType" AS ENUM ('LIQUID', 'SEMI_LIQUID', 'ILLIQUID');

-- CreateEnum
CREATE TYPE "LiabilityType" AS ENUM ('PERSONAL_LOAN', 'EDUCATION_LOAN', 'CREDIT_CARD_DEBT', 'VEHICLE_LOAN', 'HOME_LOAN', 'BORROWED_MONEY', 'OTHER');

-- CreateEnum
CREATE TYPE "IncomeType" AS ENUM ('SALARY', 'FREELANCE', 'BUSINESS', 'PASSIVE_INCOME', 'OTHER');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('MONTHLY', 'YEARLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "MandatoryExpenseCategory" AS ENUM ('RENT', 'INSURANCE', 'FOOD', 'GROCERIES', 'TRAVEL', 'EDUCATION', 'SUBSCRIPTIONS', 'UTILITIES', 'LOAN_EMI', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('FOOD', 'GROCERIES', 'TRANSPORT', 'SHOPPING', 'ENTERTAINMENT', 'HEALTH', 'BILLS', 'EDUCATION', 'TRAVEL', 'SUBSCRIPTIONS', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET', 'OTHER');

-- CreateEnum
CREATE TYPE "NeedOrWant" AS ENUM ('NEED', 'WANT');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SYNCED', 'PENDING');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('SHORT_TERM', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('HOUSE', 'CAR', 'BIKE', 'LAPTOP', 'PHONE', 'EDUCATION', 'BUSINESS_EQUIPMENT', 'TRAVEL', 'HEALTH', 'FAMILY', 'HOBBY', 'LUXURY', 'EMERGENCY_FUND', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'PAUSED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "GoalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('BUY_NOW', 'WAIT', 'REDUCE_BUDGET', 'NOT_RECOMMENDED', 'HARD_WARNING');

-- CreateEnum
CREATE TYPE "StreakType" AS ENUM ('SAVING', 'EXPENSE_LOGGING', 'UNDER_BUDGET', 'NO_IMPULSE');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('DAILY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "UserChallengeStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "financialPersonality" "FinancialPersonality",
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "baseCurrencyAmount" DECIMAL(18,2) NOT NULL,
    "liquidityType" "LiquidityType" NOT NULL DEFAULT 'LIQUID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LiabilityType" NOT NULL,
    "name" TEXT NOT NULL,
    "outstandingAmount" DECIMAL(18,2) NOT NULL,
    "monthlyPayment" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "baseCurrencyOutstandingAmount" DECIMAL(18,2) NOT NULL,
    "baseCurrencyMonthlyPayment" DECIMAL(18,2) NOT NULL,
    "interestRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "IncomeType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "baseCurrencyAmount" DECIMAL(18,2) NOT NULL,
    "frequency" "Frequency" NOT NULL DEFAULT 'MONTHLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MandatoryExpense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "MandatoryExpenseCategory" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "baseCurrencyAmount" DECIMAL(18,2) NOT NULL,
    "frequency" "Frequency" NOT NULL DEFAULT 'MONTHLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MandatoryExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "baseCurrencyAmount" DECIMAL(18,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "needOrWant" "NeedOrWant" NOT NULL DEFAULT 'NEED',
    "linkedGoalId" TEXT,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'SYNCED',
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "category" "GoalCategory" NOT NULL,
    "targetAmount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "baseCurrencyTargetAmount" DECIMAL(18,2) NOT NULL,
    "currentSavedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "baseCurrencyCurrentSavedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "priority" "GoalPriority" NOT NULL DEFAULT 'MEDIUM',
    "expectedMaintenanceCost" DECIMAL(18,2),
    "expectedResaleValue" DECIMAL(18,2),
    "isReplacingExistingItem" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalScoreInput" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "incomeImpact" INTEGER NOT NULL,
    "productivity" INTEGER NOT NULL,
    "happiness" INTEGER NOT NULL,
    "necessity" INTEGER NOT NULL,
    "urgency" INTEGER NOT NULL,
    "dreamLuxury" INTEGER NOT NULL,
    "timeSaving" INTEGER NOT NULL,
    "frequencyOfUse" INTEGER NOT NULL,
    "careerGrowth" INTEGER NOT NULL,
    "healthWellbeing" INTEGER NOT NULL,
    "familySocialImpact" INTEGER NOT NULL,
    "regretRisk" INTEGER NOT NULL,
    "maintenanceBurden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalScoreInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalRecommendation" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "purchaseReadinessScore" DOUBLE PRECISION NOT NULL,
    "financialSafetyScore" DOUBLE PRECISION NOT NULL,
    "personalValueScore" DOUBLE PRECISION NOT NULL,
    "futureBenefitScore" DOUBLE PRECISION NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "goalConflictScore" DOUBLE PRECISION NOT NULL,
    "recommendation" "Recommendation" NOT NULL,
    "safeBudgetMin" DECIMAL(18,2) NOT NULL,
    "safeBudgetMax" DECIMAL(18,2) NOT NULL,
    "recommendedPurchaseDate" TIMESTAMP(3),
    "monthlySavingRequired" DECIMAL(18,2) NOT NULL,
    "explanation" TEXT NOT NULL,
    "breakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "unlockCondition" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "StreakType" NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "longestCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "rewardBadgeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "UserChallengeStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyRate" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencyRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Asset_userId_idx" ON "Asset"("userId");

-- CreateIndex
CREATE INDEX "Liability_userId_idx" ON "Liability"("userId");

-- CreateIndex
CREATE INDEX "Income_userId_idx" ON "Income"("userId");

-- CreateIndex
CREATE INDEX "MandatoryExpense_userId_idx" ON "MandatoryExpense"("userId");

-- CreateIndex
CREATE INDEX "Expense_userId_date_idx" ON "Expense"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_userId_clientId_key" ON "Expense"("userId", "clientId");

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalScoreInput_goalId_key" ON "GoalScoreInput"("goalId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalRecommendation_goalId_key" ON "GoalRecommendation"("goalId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "Streak_userId_type_key" ON "Streak"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_code_key" ON "Challenge"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserChallenge_userId_challengeId_key" ON "UserChallenge"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyRate_fromCurrency_toCurrency_key" ON "CurrencyRate"("fromCurrency", "toCurrency");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liability" ADD CONSTRAINT "Liability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MandatoryExpense" ADD CONSTRAINT "MandatoryExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_linkedGoalId_fkey" FOREIGN KEY ("linkedGoalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalScoreInput" ADD CONSTRAINT "GoalScoreInput_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalRecommendation" ADD CONSTRAINT "GoalRecommendation_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_rewardBadgeId_fkey" FOREIGN KEY ("rewardBadgeId") REFERENCES "Badge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallenge" ADD CONSTRAINT "UserChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChallenge" ADD CONSTRAINT "UserChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
