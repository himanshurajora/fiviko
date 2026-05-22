import { Router } from 'express';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { getNetWorthHistory } from './networth-history.service.js';

export const netWorthHistoryRouter = Router();
netWorthHistoryRouter.use(requireAuth);

netWorthHistoryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const months = req.query.months ? Number(req.query.months) : 6;
    res.json(await getNetWorthHistory(req.user.id, Number.isFinite(months) ? months : 6));
  }),
);
