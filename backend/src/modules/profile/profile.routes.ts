import { Router } from 'express';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { getFinancialSummary } from './profile.service.js';

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const summary = await getFinancialSummary(req.user.id);
    res.json(summary);
  }),
);
