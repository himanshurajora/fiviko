import { Router } from 'express';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { getChallenge, listChallenges } from './challenges.service.js';
import type { Request } from 'express';

const uid = (req: Request): string => {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
};

export const challengesRouter = Router();
challengesRouter.use(requireAuth);

challengesRouter.get('/', asyncHandler(async (req, res) => res.json(await listChallenges(uid(req)))));
// Progress is computed live; this simply returns the freshly-evaluated challenge.
challengesRouter.post('/:id/progress', asyncHandler(async (req, res) => res.json(await getChallenge(uid(req), req.params.id))));
