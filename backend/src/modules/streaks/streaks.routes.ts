import { Router } from 'express';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { getStreaks } from './streaks.service.js';

export const streaksRouter = Router();
streaksRouter.use(requireAuth);

streaksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    res.json(await getStreaks(req.user.id));
  }),
);
