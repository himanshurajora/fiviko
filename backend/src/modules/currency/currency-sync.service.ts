import { prisma } from '../../lib/prisma.js';

const CURRENCY_SYNC_KEY = 'currency';

export interface RateInput {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
}

/**
 * Whether a currency sync is due. The task executor calls this before hitting
 * the (rate-limited) currencylayer API, so we never fetch more than once per
 * `minIntervalHours`. The lastRunAt guard lives here (single source of truth),
 * not in the executor.
 */
export async function shouldSyncCurrency(minIntervalHours = 24): Promise<{ shouldSync: boolean; lastRunAt: string | null }> {
  const state = await prisma.syncState.findUnique({ where: { key: CURRENCY_SYNC_KEY } });
  if (!state) return { shouldSync: true, lastRunAt: null };
  const elapsedHours = (Date.now() - state.lastRunAt.getTime()) / 3_600_000;
  return { shouldSync: elapsedHours >= minIntervalHours, lastRunAt: state.lastRunAt.toISOString() };
}

/** Upserts fetched rates and records the sync time. Called by the executor. */
export async function applyCurrencyRates(rates: RateInput[], source = 'currencylayer'): Promise<number> {
  let applied = 0;
  for (const r of rates) {
    if (!Number.isFinite(r.rate) || r.rate <= 0) continue;
    await prisma.currencyRate.upsert({
      where: { fromCurrency_toCurrency: { fromCurrency: r.fromCurrency, toCurrency: r.toCurrency } },
      update: { rate: r.rate, source },
      create: { fromCurrency: r.fromCurrency, toCurrency: r.toCurrency, rate: r.rate, source },
    });
    applied += 1;
  }
  await prisma.syncState.upsert({
    where: { key: CURRENCY_SYNC_KEY },
    update: { lastRunAt: new Date(), meta: `${applied} rates from ${source}` },
    create: { key: CURRENCY_SYNC_KEY, lastRunAt: new Date(), meta: `${applied} rates from ${source}` },
  });
  return applied;
}
