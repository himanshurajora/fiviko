import { z } from 'zod';
import {
  AssetType,
  Frequency,
  IncomeType,
  LiabilityType,
  LiquidityType,
  MandatoryExpenseCategory,
} from '@fiviko/shared';

const enumValues = <T extends string>(obj: Record<string, T>) => Object.values(obj) as [T, ...T[]];
const currency = z.string().trim().toUpperCase().length(3);
const amount = z.number().min(0);

export const assetSchema = z.object({
  type: z.enum(enumValues(AssetType)),
  name: z.string().trim().min(1).max(80),
  amount: amount.refine((n) => n > 0, 'Amount must be greater than 0'),
  currency,
  liquidityType: z.enum(enumValues(LiquidityType)).default(LiquidityType.Liquid),
});

export const liabilitySchema = z.object({
  type: z.enum(enumValues(LiabilityType)),
  name: z.string().trim().min(1).max(80),
  outstandingAmount: amount,
  monthlyPayment: amount,
  currency,
  interestRate: z.number().min(0).max(100).optional().nullable(),
});

export const incomeSchema = z.object({
  type: z.enum(enumValues(IncomeType)),
  amount: amount.refine((n) => n > 0, 'Amount must be greater than 0'),
  currency,
  frequency: z.enum(enumValues(Frequency)).default(Frequency.Monthly),
});

export const mandatoryExpenseSchema = z.object({
  category: z.enum(enumValues(MandatoryExpenseCategory)),
  amount: amount.refine((n) => n > 0, 'Amount must be greater than 0'),
  currency,
  frequency: z.enum(enumValues(Frequency)).default(Frequency.Monthly),
});

export const assetUpdateSchema = assetSchema.partial();
export const liabilityUpdateSchema = liabilitySchema.partial();

export type AssetInput = z.infer<typeof assetSchema>;
export type LiabilityInput = z.infer<typeof liabilitySchema>;
export type IncomeInput = z.infer<typeof incomeSchema>;
export type MandatoryExpenseInput = z.infer<typeof mandatoryExpenseSchema>;
