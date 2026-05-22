import { z } from 'zod';
import {
  GoalCategory,
  GoalPriority,
  GoalType,
} from '@fiviko/shared';

/** Build a Zod enum that infers the precise string-literal union (not `string`). */
const enumValues = <T extends string>(obj: Record<string, T>) =>
  Object.values(obj) as [T, ...T[]];

const score = z.number().int().min(1).max(100);

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  type: z.enum(enumValues(GoalType)),
  category: z.enum(enumValues(GoalCategory)),
  targetAmount: z.number().positive('Target must be greater than 0'),
  currency: z.string().trim().toUpperCase().length(3),
  currentSavedAmount: z.number().min(0).default(0),
  targetDate: z.string().datetime().optional().nullable(),
  priority: z.enum(enumValues(GoalPriority)).default(GoalPriority.Medium),
  expectedMaintenanceCost: z.number().min(0).optional().nullable(),
  expectedResaleValue: z.number().min(0).optional().nullable(),
  isReplacingExistingItem: z.boolean().default(false),
  notes: z.string().max(500).optional().nullable(),
});

export const updateGoalSchema = createGoalSchema.partial();

/** The thirteen 1–100 score answers (spec §8.6). */
export const scoreInputSchema = z.object({
  incomeImpact: score,
  productivity: score,
  happiness: score,
  necessity: score,
  urgency: score,
  dreamLuxury: score,
  timeSaving: score,
  frequencyOfUse: score,
  careerGrowth: score,
  healthWellbeing: score,
  familySocialImpact: score,
  regretRisk: score,
  maintenanceBurden: score,
});

/** What-if simulator overrides: try a different price / buy date (spec §15). */
export const whatIfSchema = z.object({
  overrideTargetAmount: z.number().positive().optional(),
});

/** Record actual savings toward a goal (in the goal's currency). */
export const contributeSchema = z.object({
  amount: z.number().positive('Contribution must be greater than 0'),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type ScoreInput = z.infer<typeof scoreInputSchema>;
export type WhatIfInput = z.infer<typeof whatIfSchema>;
