import type { Request, Response } from 'express';
import { AppError } from '../../lib/http.js';
import {
  createExpense,
  deleteExpense,
  expenseTrend,
  expenseTrendByGranularity,
  listExpenses,
  monthlySummary,
  quickAddSuggestions,
  syncOffline,
  updateExpense,
} from './expenses.service.js';
import type { ExpenseGranularity } from '@fiviko/shared';
import { generateRecurringForUser } from './recurring.service.js';
import { recomputeActiveGoals } from '../goals/goals.service.js';
import { listQuerySchema } from './expenses.schema.js';

function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function postExpense(req: Request, res: Response): Promise<void> {
  const expense = await createExpense(userId(req), req.body);
  // Spending shifts overspending/safety, which feeds goal recommendations.
  await recomputeActiveGoals(userId(req)).catch(() => undefined);
  res.status(201).json(expense);
}

export async function getExpenses(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.parse(req.query);
  res.json(await listExpenses(userId(req), query));
}

export async function getMonthlySummary(req: Request, res: Response): Promise<void> {
  const month = typeof req.query.month === 'string' ? req.query.month : undefined;
  res.json(await monthlySummary(userId(req), month));
}

export async function getTrend(req: Request, res: Response): Promise<void> {
  const months = req.query.months ? Number(req.query.months) : 6;
  res.json(await expenseTrend(userId(req), Number.isFinite(months) ? months : 6));
}

/** D/W/M/Y trend with current-vs-prior delta and top mover. */
export async function getTrendByGranularity(req: Request, res: Response): Promise<void> {
  const g = (typeof req.query.granularity === 'string' ? req.query.granularity : 'M').toUpperCase();
  const granularity = (['D', 'W', 'M', 'Y'].includes(g) ? g : 'M') as ExpenseGranularity;
  const bins = req.query.bins ? Number(req.query.bins) : undefined;
  res.json(await expenseTrendByGranularity(userId(req), granularity, bins && Number.isFinite(bins) ? bins : undefined));
}

/** Quick-add chips: top-5 recurring spend patterns from the last 30 days. */
export async function getQuickAdd(req: Request, res: Response): Promise<void> {
  const take = req.query.take ? Number(req.query.take) : 5;
  res.json(await quickAddSuggestions(userId(req), Number.isFinite(take) ? take : 5));
}

export async function putExpense(req: Request, res: Response): Promise<void> {
  res.json(await updateExpense(userId(req), req.params.id, req.body));
}

export async function removeExpense(req: Request, res: Response): Promise<void> {
  await deleteExpense(userId(req), req.params.id);
  res.json({ ok: true });
}

export async function postSyncOffline(req: Request, res: Response): Promise<void> {
  const result = await syncOffline(userId(req), req.body);
  await recomputeActiveGoals(userId(req)).catch(() => undefined);
  res.json(result);
}

export async function postGenerateRecurring(req: Request, res: Response): Promise<void> {
  const created = await generateRecurringForUser(userId(req));
  res.json({ created });
}
