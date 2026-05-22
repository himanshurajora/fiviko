import { z } from 'zod';
import { ExpenseCategory, NeedOrWant, PaymentMethod } from '@fiviko/shared';

const enumValues = <T extends string>(obj: Record<string, T>) => Object.values(obj) as [T, ...T[]];

export const createExpenseSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().trim().toUpperCase().length(3),
  category: z.enum(enumValues(ExpenseCategory)),
  note: z.string().max(280).optional().nullable(),
  /** ISO date; defaults to now server-side when omitted. */
  date: z.string().datetime().optional(),
  paymentMethod: z.enum(enumValues(PaymentMethod)).default(PaymentMethod.Cash),
  isRecurring: z.boolean().default(false),
  needOrWant: z.enum(enumValues(NeedOrWant)).default(NeedOrWant.Need),
  linkedGoalId: z.string().optional().nullable(),
  /** Stable client-generated id for offline de-duplication. */
  clientId: z.string().min(1).max(64).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().omit({ clientId: true });

/** Batch sync of expenses queued while offline (spec §8.4). */
export const syncOfflineSchema = z.object({
  expenses: z.array(createExpenseSchema.extend({ clientId: z.string().min(1).max(64) })).max(200),
});

export const listQuerySchema = z.object({
  /** YYYY-MM to scope to a calendar month. */
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  category: z.enum(enumValues(ExpenseCategory)).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type SyncOfflineInput = z.infer<typeof syncOfflineSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
