import { Router } from 'express';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { listBadges, listUserBadges } from './badges.service.js';
import type { Request } from 'express';

const uid = (req: Request): string => {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
};

export const badgesRouter = Router();
badgesRouter.use(requireAuth);
badgesRouter.get('/', asyncHandler(async (req, res) => res.json(await listBadges(uid(req)))));

export const userBadgesRouter = Router();
userBadgesRouter.use(requireAuth);
userBadgesRouter.get('/', asyncHandler(async (req, res) => res.json(await listUserBadges(uid(req)))));
