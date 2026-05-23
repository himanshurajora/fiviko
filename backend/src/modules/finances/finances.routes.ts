import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import {
  assetSchema,
  assetUpdateSchema,
  depositSchema,
  incomeSchema,
  incomeUpdateSchema,
  liabilitySchema,
  liabilityUpdateSchema,
  mandatoryExpenseSchema,
  mandatoryExpenseUpdateSchema,
  payDownSchema,
  receiptSchema,
  transferSchema,
} from './finances.schema.js';
import * as svc from './finances.service.js';
import { recomputeActiveGoals } from '../goals/goals.service.js';
import { snapshotDate } from '../networth-history/networth-history.service.js';
import type { Request } from 'express';

const uid = (req: Request): string => {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
};

/** Any financial-profile change rescores active goals and snapshots net worth. */
const recompute = async (userId: string) => {
  await Promise.all([
    recomputeActiveGoals(userId).catch(() => undefined),
    snapshotDate(userId).catch(() => undefined),
  ]);
};

const balanceSchema = z.object({ amount: z.number().min(0), recordedAt: z.string().datetime().optional() });

export const assetsRouter = Router();
assetsRouter.use(requireAuth);
assetsRouter.post('/', validateBody(assetSchema), asyncHandler(async (req, res) => { const r = await svc.createAsset(uid(req), req.body); await recompute(uid(req)); res.status(201).json(r); }));
assetsRouter.get('/', asyncHandler(async (req, res) => res.json(await svc.listAssets(uid(req)))));
assetsRouter.put('/:id', validateBody(assetUpdateSchema), asyncHandler(async (req, res) => { const r = await svc.updateAsset(uid(req), req.params.id, req.body); await recompute(uid(req)); res.json(r); }));
/** Lightweight balance-only update used by the net-worth tracker. */
assetsRouter.put('/:id/balance', validateBody(balanceSchema), asyncHandler(async (req, res) => {
  const r = await svc.setAssetBalance(uid(req), req.params.id, req.body.amount, req.body.recordedAt ? new Date(req.body.recordedAt) : undefined);
  await recompute(uid(req));
  res.json(r);
}));
/** Add a windfall (bonus, gift, refund) to the account. */
assetsRouter.post('/:id/deposit', validateBody(depositSchema), asyncHandler(async (req, res) => {
  const r = await svc.depositToAsset(uid(req), req.params.id, req.body.amount, req.body.note);
  await recompute(uid(req));
  res.json(r);
}));
/** Atomic transfer between two accounts (cross-currency OK). */
assetsRouter.post('/transfer', validateBody(transferSchema), asyncHandler(async (req, res) => {
  const r = await svc.transferBetweenAssets(uid(req), req.body.fromAssetId, req.body.toAssetId, req.body.amount, req.body.note);
  await recompute(uid(req));
  res.json(r);
}));
assetsRouter.delete('/:id', asyncHandler(async (req, res) => { await svc.deleteAsset(uid(req), req.params.id); await recompute(uid(req)); res.json({ ok: true }); }));
/** Undo a delete — pairs with the toast's Undo action. */
assetsRouter.post('/:id/restore', asyncHandler(async (req, res) => { const r = await svc.restoreAsset(uid(req), req.params.id); await recompute(uid(req)); res.json(r); }));

export const liabilitiesRouter = Router();
liabilitiesRouter.use(requireAuth);
liabilitiesRouter.post('/', validateBody(liabilitySchema), asyncHandler(async (req, res) => { const r = await svc.createLiability(uid(req), req.body); await recompute(uid(req)); res.status(201).json(r); }));
liabilitiesRouter.get('/', asyncHandler(async (req, res) => res.json(await svc.listLiabilities(uid(req)))));
liabilitiesRouter.put('/:id', validateBody(liabilityUpdateSchema), asyncHandler(async (req, res) => { const r = await svc.updateLiability(uid(req), req.params.id, req.body); await recompute(uid(req)); res.json(r); }));
/** Pay down the loan; optionally deduct from a real account. */
liabilitiesRouter.post('/:id/pay-down', validateBody(payDownSchema), asyncHandler(async (req, res) => {
  const r = await svc.payDownLiability(uid(req), req.params.id, req.body.amount, req.body.fromAssetId);
  await recompute(uid(req));
  res.json(r);
}));
liabilitiesRouter.delete('/:id', asyncHandler(async (req, res) => { await svc.deleteLiability(uid(req), req.params.id); await recompute(uid(req)); res.json({ ok: true }); }));
liabilitiesRouter.post('/:id/restore', asyncHandler(async (req, res) => { const r = await svc.restoreLiability(uid(req), req.params.id); await recompute(uid(req)); res.json(r); }));

export const incomesRouter = Router();
incomesRouter.use(requireAuth);
incomesRouter.post('/', validateBody(incomeSchema), asyncHandler(async (req, res) => { const r = await svc.createIncome(uid(req), req.body); await recompute(uid(req)); res.status(201).json(r); }));
incomesRouter.get('/', asyncHandler(async (req, res) => res.json(await svc.listIncomes(uid(req)))));
incomesRouter.put('/:id', validateBody(incomeUpdateSchema), asyncHandler(async (req, res) => { const r = await svc.updateIncome(uid(req), req.params.id, req.body); await recompute(uid(req)); res.json(r); }));
incomesRouter.delete('/:id', asyncHandler(async (req, res) => { await svc.deleteIncome(uid(req), req.params.id); await recompute(uid(req)); res.json({ ok: true }); }));
incomesRouter.post('/:id/restore', asyncHandler(async (req, res) => { const r = await svc.restoreIncome(uid(req), req.params.id); await recompute(uid(req)); res.json(r); }));

/** Variable-income actuals: list / log / clear per-period receipts. */
incomesRouter.get('/:id/receipts', asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 12;
  res.json(await svc.listIncomeReceipts(uid(req), req.params.id, Number.isFinite(limit) ? limit : 12));
}));
incomesRouter.post('/:id/receipts', validateBody(receiptSchema), asyncHandler(async (req, res) => {
  const r = await svc.logIncomeReceipt(uid(req), req.params.id, {
    periodKey: req.body.periodKey,
    amount: req.body.amount,
    note: req.body.note,
    receivedAt: req.body.receivedAt ? new Date(req.body.receivedAt) : undefined,
  });
  res.status(201).json(r);
}));
incomesRouter.delete('/:id/receipts/:periodKey', asyncHandler(async (req, res) => {
  await svc.deleteIncomeReceipt(uid(req), req.params.id, req.params.periodKey);
  res.json({ ok: true });
}));

export const mandatoryExpensesRouter = Router();
mandatoryExpensesRouter.use(requireAuth);
mandatoryExpensesRouter.post('/', validateBody(mandatoryExpenseSchema), asyncHandler(async (req, res) => { const r = await svc.createMandatoryExpense(uid(req), req.body); await recompute(uid(req)); res.status(201).json(r); }));
mandatoryExpensesRouter.get('/', asyncHandler(async (req, res) => res.json(await svc.listMandatoryExpenses(uid(req)))));
mandatoryExpensesRouter.put('/:id', validateBody(mandatoryExpenseUpdateSchema), asyncHandler(async (req, res) => { const r = await svc.updateMandatoryExpense(uid(req), req.params.id, req.body); await recompute(uid(req)); res.json(r); }));
mandatoryExpensesRouter.delete('/:id', asyncHandler(async (req, res) => { await svc.deleteMandatoryExpense(uid(req), req.params.id); await recompute(uid(req)); res.json({ ok: true }); }));
mandatoryExpensesRouter.post('/:id/restore', asyncHandler(async (req, res) => { const r = await svc.restoreMandatoryExpense(uid(req), req.params.id); await recompute(uid(req)); res.json(r); }));
