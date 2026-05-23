import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { getAssetBalanceHistory, getNetWorthHistory, snapshotDate, type Granularity } from './networth-history.service.js';

export const netWorthHistoryRouter = Router();
netWorthHistoryRouter.use(requireAuth);

const granularitySchema = z.enum(['D', 'W', 'M', 'Y', 'ALL']);

netWorthHistoryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const g = granularitySchema.safeParse(req.query.granularity);
    res.json(await getNetWorthHistory(req.user.id, (g.success ? g.data : 'M') as Granularity));
  }),
);

/** Manual "snapshot today's net worth" trigger (used by the tracker's button). */
netWorthHistoryRouter.post(
  '/snapshot',
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    await snapshotDate(req.user.id);
    res.json({ ok: true });
  }),
);

/** Per-asset balance history for the tracker's mini chart. */
netWorthHistoryRouter.get(
  '/assets/:id',
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const days = req.query.days ? Number(req.query.days) : 180;
    res.json(await getAssetBalanceHistory(req.user.id, req.params.id, Number.isFinite(days) ? days : 180));
  }),
);
