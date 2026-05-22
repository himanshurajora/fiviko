import type { Request, Response } from 'express';
import { AppError } from '../../lib/http.js';
import {
  createExpense,
  deleteExpense,
  expenseTrend,
  listExpenses,
  monthlySummary,
  syncOffline,
  updateExpense,
} from './expenses.service.js';
import { listQuerySchema } from './expenses.schema.js';

function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function postExpense(req: Request, res: Response): Promise<void> {
  res.status(201).json(await createExpense(userId(req), req.body));
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

export async function putExpense(req: Request, res: Response): Promise<void> {
  res.json(await updateExpense(userId(req), req.params.id, req.body));
}

export async function removeExpense(req: Request, res: Response): Promise<void> {
  await deleteExpense(userId(req), req.params.id);
  res.json({ ok: true });
}

export async function postSyncOffline(req: Request, res: Response): Promise<void> {
  res.json(await syncOffline(userId(req), req.body));
}
