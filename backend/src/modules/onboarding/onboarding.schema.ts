import { z } from 'zod';
import {
  AssetType,
  FinancialPersonality,
  Frequency,
  GoalCategory,
  GoalPriority,
  GoalType,
  IncomeType,
  LiabilityType,
  LiquidityType,
  MandatoryExpenseCategory,
} from '@fiviko/shared';

const enumValues = <T extends string>(obj: Record<string, T>) => Object.values(obj) as [T, ...T[]];
const positive = z.number().positive();
const nonNeg = z.number().min(0);

/**
 * All onboarding amounts are entered in the user's chosen base currency, so no
 * conversion is needed on the server (baseCurrencyAmount === amount).
 */
export const onboardingSchema = z.object({
  baseCurrency: z.string().trim().toUpperCase().length(3),
  financialPersonality: z.enum(enumValues(FinancialPersonality)),
  incomes: z
    .array(z.object({ type: z.enum(enumValues(IncomeType)), amount: positive, frequency: z.enum(enumValues(Frequency)).default(Frequency.Monthly) }))
    .default([]),
  mandatoryExpenses: z
    .array(z.object({ category: z.enum(enumValues(MandatoryExpenseCategory)), amount: positive, frequency: z.enum(enumValues(Frequency)).default(Frequency.Monthly) }))
    .default([]),
  assets: z
    .array(z.object({ type: z.enum(enumValues(AssetType)), name: z.string().trim().min(1).max(80), amount: positive, liquidityType: z.enum(enumValues(LiquidityType)).default(LiquidityType.Liquid) }))
    .default([]),
  liabilities: z
    .array(z.object({ type: z.enum(enumValues(LiabilityType)), name: z.string().trim().min(1).max(80), outstandingAmount: nonNeg, monthlyPayment: nonNeg }))
    .default([]),
  firstGoal: z
    .object({
      name: z.string().trim().min(1).max(80),
      type: z.enum(enumValues(GoalType)),
      category: z.enum(enumValues(GoalCategory)),
      targetAmount: positive,
      priority: z.enum(enumValues(GoalPriority)).default(GoalPriority.Medium),
    })
    .nullable()
    .optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
