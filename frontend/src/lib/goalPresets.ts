import { CATEGORY_SCORE_PRESETS, type GoalCategory, type GoalScoreInputValues } from '@fiviko/shared';

/**
 * Smart 1–100 score defaults per goal category (sourced from @fiviko/shared so
 * the backend onboarding seed and the frontend create flow stay in sync). Lets a
 * goal be created with no slider work; users can optionally fine-tune.
 */
export const GOAL_SCORE_PRESETS: Record<GoalCategory, GoalScoreInputValues> = CATEGORY_SCORE_PRESETS as Record<
  GoalCategory,
  GoalScoreInputValues
>;
