import { Router } from 'express';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { onboardingSchema } from './onboarding.schema.js';
import { completeOnboarding } from './onboarding.service.js';

export const onboardingRouter = Router();
onboardingRouter.use(requireAuth);

onboardingRouter.post(
  '/',
  validateBody(onboardingSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    res.status(201).json(await completeOnboarding(req.user.id, req.body));
  }),
);
