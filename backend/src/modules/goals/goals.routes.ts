import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { contributeSchema, createGoalSchema, scoreInputSchema, updateGoalSchema, whatIfSchema } from './goals.schema.js';
import {
  getGoalById,
  getGoals,
  getRecommendation,
  postComplete,
  postContribute,
  postGoal,
  postRecalculate,
  postReopen,
  postScoreInput,
  postWhatIf,
  putGoal,
  removeGoal,
} from './goals.controller.js';

export const goalsRouter = Router();

goalsRouter.use(requireAuth);

goalsRouter.post('/', validateBody(createGoalSchema), asyncHandler(postGoal));
goalsRouter.get('/', asyncHandler(getGoals));
goalsRouter.get('/:id', asyncHandler(getGoalById));
goalsRouter.put('/:id', validateBody(updateGoalSchema), asyncHandler(putGoal));
goalsRouter.delete('/:id', asyncHandler(removeGoal));

goalsRouter.post('/:id/score-inputs', validateBody(scoreInputSchema), asyncHandler(postScoreInput));
goalsRouter.get('/:id/recommendation', asyncHandler(getRecommendation));
goalsRouter.post('/:id/recalculate', asyncHandler(postRecalculate));
goalsRouter.post('/:id/what-if', validateBody(whatIfSchema), asyncHandler(postWhatIf));
goalsRouter.post('/:id/contribute', validateBody(contributeSchema), asyncHandler(postContribute));
goalsRouter.post('/:id/complete', asyncHandler(postComplete));
goalsRouter.post('/:id/reopen', asyncHandler(postReopen));
