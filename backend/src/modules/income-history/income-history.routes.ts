import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { getIncomeHistory, setMonthlyIncome } from './income-history.service.js';
import type { Request } from 'express';

const uid = (req: Request): string => {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
};

const setIncomeSchema = z.object({ amount: z.number().min(0) });

export const incomeHistoryRouter = Router();
incomeHistoryRouter.use(requireAuth);

incomeHistoryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const months = req.query.months ? Number(req.query.months) : 6;
    res.json(await getIncomeHistory(uid(req), Number.isFinite(months) ? months : 6));
  }),
);

incomeHistoryRouter.put(
  '/:month',
  validateBody(setIncomeSchema),
  asyncHandler(async (req, res) => {
    res.json(await setMonthlyIncome(uid(req), req.params.month, req.body.amount));
  }),
);
