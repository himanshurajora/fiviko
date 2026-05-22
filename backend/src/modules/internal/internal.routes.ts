import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/http.js';
import { requireInternalToken } from '../../middleware/internalAuth.js';
import { validateBody } from '../../middleware/validate.js';
import { applyCurrencyRates, shouldSyncCurrency } from '../currency/currency-sync.service.js';
import { generateRecurringForAllUsers } from '../expenses/recurring.service.js';
import { snapshotMonthForAllUsers as snapshotIncomeForAll, monthKey } from '../income-history/income-history.service.js';
import { snapshotMonthForAllUsers as snapshotNetWorthForAll } from '../networth-history/networth-history.service.js';

const ratesSchema = z.object({
  rates: z
    .array(z.object({ fromCurrency: z.string().length(3), toCurrency: z.string().length(3), rate: z.number().positive() }))
    .max(500),
  source: z.string().max(40).optional(),
});

/**
 * Endpoints used exclusively by the task executor (guarded by a shared token).
 * The executor reads sync status and posts results / triggers jobs here — it
 * never connects to the database itself.
 */
export const internalRouter = Router();
internalRouter.use(requireInternalToken);

// --- Currency sync --------------------------------------------------------
internalRouter.get(
  '/currency/should-sync',
  asyncHandler(async (req, res) => {
    const hours = req.query.minIntervalHours ? Number(req.query.minIntervalHours) : 24;
    res.json(await shouldSyncCurrency(Number.isFinite(hours) ? hours : 24));
  }),
);

internalRouter.post(
  '/currency/rates',
  validateBody(ratesSchema),
  asyncHandler(async (req, res) => {
    const applied = await applyCurrencyRates(req.body.rates, req.body.source);
    res.json({ applied });
  }),
);

// --- Periodic jobs (triggered by the executor's cron) ---------------------
internalRouter.post(
  '/jobs/recurring-expenses',
  asyncHandler(async (_req, res) => {
    res.json({ created: await generateRecurringForAllUsers() });
  }),
);

internalRouter.post(
  '/jobs/income-snapshot',
  asyncHandler(async (_req, res) => {
    res.json({ created: await snapshotIncomeForAll(monthKey(new Date())) });
  }),
);

internalRouter.post(
  '/jobs/networth-snapshot',
  asyncHandler(async (_req, res) => {
    res.json({ snapshotted: await snapshotNetWorthForAll(monthKey(new Date())) });
  }),
);
