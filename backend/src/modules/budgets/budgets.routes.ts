import { Router } from 'express';
import { z } from 'zod';
import { ExpenseCategory } from '@fiviko/shared';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { getBudgetStatus, setCategoryBudget } from './budgets.service.js';
import type { Request } from 'express';

const uid = (req: Request): string => {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
};

const enumValues = <T extends string>(obj: Record<string, T>) => Object.values(obj) as [T, ...T[]];
const setBudgetSchema = z.object({ amount: z.number().min(0) });

export const budgetsRouter = Router();
budgetsRouter.use(requireAuth);

budgetsRouter.get('/', asyncHandler(async (req, res) => res.json(await getBudgetStatus(uid(req)))));

budgetsRouter.put(
  '/:category',
  validateBody(setBudgetSchema),
  asyncHandler(async (req, res) => {
    const category = z.enum(enumValues(ExpenseCategory)).parse(req.params.category);
    await setCategoryBudget(uid(req), category, req.body.amount);
    res.json(await getBudgetStatus(uid(req)));
  }),
);
