import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { isAiEnabled } from '../../lib/openai.js';
import {
  coachAsk,
  configureGoalFromText,
  explainDecision,
  parseExpenseText,
  savingsTips,
} from './ai.service.js';
import type { Request } from 'express';

const uid = (req: Request): string => {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
};

const askSchema = z.object({ question: z.string().min(1).max(500) });
const textSchema = z.object({ text: z.string().min(1).max(400) });

export const aiRouter = Router();
aiRouter.use(requireAuth);

/** Lets the frontend hide AI surfaces when the server has no key. */
aiRouter.get('/status', asyncHandler(async (_req, res) => res.json({ enabled: isAiEnabled() })));

aiRouter.get(
  '/tips',
  asyncHandler(async (req, res) => res.json(await savingsTips(uid(req), req.query.regenerate === 'true'))),
);

aiRouter.post(
  '/coach',
  validateBody(askSchema),
  asyncHandler(async (req, res) => res.json(await coachAsk(uid(req), req.body.question))),
);

aiRouter.get(
  '/explain/:goalId',
  asyncHandler(async (req, res) => res.json(await explainDecision(uid(req), req.params.goalId))),
);

aiRouter.post(
  '/parse-expense',
  validateBody(textSchema),
  asyncHandler(async (req, res) => res.json(await parseExpenseText(uid(req), req.body.text))),
);

aiRouter.post(
  '/configure-goal',
  validateBody(textSchema),
  asyncHandler(async (req, res) => res.json(await configureGoalFromText(uid(req), req.body.text))),
);
