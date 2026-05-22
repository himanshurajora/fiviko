import { Router } from 'express';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import {
  assetSchema,
  assetUpdateSchema,
  incomeSchema,
  liabilitySchema,
  liabilityUpdateSchema,
  mandatoryExpenseSchema,
} from './finances.schema.js';
import * as svc from './finances.service.js';
import type { Request } from 'express';

const uid = (req: Request): string => {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
};

export const assetsRouter = Router();
assetsRouter.use(requireAuth);
assetsRouter.post('/', validateBody(assetSchema), asyncHandler(async (req, res) => res.status(201).json(await svc.createAsset(uid(req), req.body))));
assetsRouter.get('/', asyncHandler(async (req, res) => res.json(await svc.listAssets(uid(req)))));
assetsRouter.put('/:id', validateBody(assetUpdateSchema), asyncHandler(async (req, res) => res.json(await svc.updateAsset(uid(req), req.params.id, req.body))));
assetsRouter.delete('/:id', asyncHandler(async (req, res) => { await svc.deleteAsset(uid(req), req.params.id); res.json({ ok: true }); }));

export const liabilitiesRouter = Router();
liabilitiesRouter.use(requireAuth);
liabilitiesRouter.post('/', validateBody(liabilitySchema), asyncHandler(async (req, res) => res.status(201).json(await svc.createLiability(uid(req), req.body))));
liabilitiesRouter.get('/', asyncHandler(async (req, res) => res.json(await svc.listLiabilities(uid(req)))));
liabilitiesRouter.put('/:id', validateBody(liabilityUpdateSchema), asyncHandler(async (req, res) => res.json(await svc.updateLiability(uid(req), req.params.id, req.body))));
liabilitiesRouter.delete('/:id', asyncHandler(async (req, res) => { await svc.deleteLiability(uid(req), req.params.id); res.json({ ok: true }); }));

export const incomesRouter = Router();
incomesRouter.use(requireAuth);
incomesRouter.post('/', validateBody(incomeSchema), asyncHandler(async (req, res) => res.status(201).json(await svc.createIncome(uid(req), req.body))));
incomesRouter.get('/', asyncHandler(async (req, res) => res.json(await svc.listIncomes(uid(req)))));

export const mandatoryExpensesRouter = Router();
mandatoryExpensesRouter.use(requireAuth);
mandatoryExpensesRouter.post('/', validateBody(mandatoryExpenseSchema), asyncHandler(async (req, res) => res.status(201).json(await svc.createMandatoryExpense(uid(req), req.body))));
mandatoryExpensesRouter.get('/', asyncHandler(async (req, res) => res.json(await svc.listMandatoryExpenses(uid(req)))));
