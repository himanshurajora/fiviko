import { Router } from 'express';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { getLevel } from './level.service.js';

export const levelRouter = Router();
levelRouter.use(requireAuth);

levelRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    res.json(await getLevel(req.user.id));
  }),
);
