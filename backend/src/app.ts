import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { profileRouter } from './modules/profile/profile.routes.js';
import { goalsRouter } from './modules/goals/goals.routes.js';
import { expensesRouter } from './modules/expenses/expenses.routes.js';
import {
  assetsRouter,
  incomesRouter,
  liabilitiesRouter,
  mandatoryExpensesRouter,
} from './modules/finances/finances.routes.js';
import { badgesRouter, userBadgesRouter } from './modules/badges/badges.routes.js';
import { onboardingRouter } from './modules/onboarding/onboarding.routes.js';
import { streaksRouter } from './modules/streaks/streaks.routes.js';
import { challengesRouter } from './modules/challenges/challenges.routes.js';
import { levelRouter } from './modules/level/level.routes.js';
import { incomeHistoryRouter } from './modules/income-history/income-history.routes.js';
import { netWorthHistoryRouter } from './modules/networth-history/networth-history.routes.js';
import { budgetsRouter } from './modules/budgets/budgets.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { internalRouter } from './modules/internal/internal.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  if (!env.isProduction) app.use(morgan('dev'));

  // Liveness probe.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'fiviko-api', time: new Date().toISOString() });
  });

  // Feature routers.
  app.use('/api/auth', authRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/goals', goalsRouter);
  app.use('/api/expenses', expensesRouter);
  app.use('/api/assets', assetsRouter);
  app.use('/api/liabilities', liabilitiesRouter);
  app.use('/api/incomes', incomesRouter);
  app.use('/api/mandatory-expenses', mandatoryExpensesRouter);
  app.use('/api/badges', badgesRouter);
  app.use('/api/user-badges', userBadgesRouter);
  app.use('/api/onboarding', onboardingRouter);
  app.use('/api/streaks', streaksRouter);
  app.use('/api/challenges', challengesRouter);
  app.use('/api/level', levelRouter);
  app.use('/api/income-history', incomeHistoryRouter);
  app.use('/api/networth-history', netWorthHistoryRouter);
  app.use('/api/budgets', budgetsRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/internal', internalRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
