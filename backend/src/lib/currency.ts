import { prisma } from './prisma.js';

/**
 * Currency conversion abstraction (spec §5). For the MVP, rates live in the
 * CurrencyRate table and are managed manually / by seed. The interface is
 * deliberately small so a real exchange-rate API can replace the lookup later
 * without touching callers.
 */

/** Convert `amount` from one currency to another using stored rates. */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
): Promise<number> {
  if (from === to) return round2(amount);

  const direct = await prisma.currencyRate.findUnique({
    where: { fromCurrency_toCurrency: { fromCurrency: from, toCurrency: to } },
  });
  if (direct) return round2(amount * direct.rate);

  // Try the inverse pair (e.g. only USD->EUR stored, need EUR->USD).
  const inverse = await prisma.currencyRate.findUnique({
    where: { fromCurrency_toCurrency: { fromCurrency: to, toCurrency: from } },
  });
  if (inverse && inverse.rate !== 0) return round2(amount / inverse.rate);

  // Triangulate through USD as a common base if both legs exist.
  if (from !== 'USD' && to !== 'USD') {
    const toUsd = await getRate(from, 'USD');
    const fromUsd = await getRate('USD', to);
    if (toUsd != null && fromUsd != null) return round2(amount * toUsd * fromUsd);
  }

  // No rate available — fall back to 1:1 so data is never lost, and surface it.
  console.warn(`⚠️  No exchange rate for ${from}->${to}; using 1:1 fallback.`);
  return round2(amount);
}

async function getRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;
  const rate = await prisma.currencyRate.findUnique({
    where: { fromCurrency_toCurrency: { fromCurrency: from, toCurrency: to } },
  });
  return rate?.rate ?? null;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Loads all stored currency rates and returns a synchronous converter:
 *   convert(amount, fromCurrency) → amount in `base`
 * Use this when summing many rows (net worth) to avoid per-row DB lookups; the
 * map reflects the latest rates the executor has synced.
 */
export async function getRateConverter(base: string): Promise<(amount: number, from: string) => number> {
  const rows = await prisma.currencyRate.findMany();
  // Build a tiny graph: rate from any source to any destination.
  const rate = new Map<string, number>();
  for (const r of rows) rate.set(`${r.fromCurrency}>${r.toCurrency}`, r.rate);

  const lookup = (from: string, to: string): number | null => {
    if (from === to) return 1;
    const direct = rate.get(`${from}>${to}`);
    if (direct) return direct;
    const inverse = rate.get(`${to}>${from}`);
    if (inverse && inverse !== 0) return 1 / inverse;
    if (from !== 'USD' && to !== 'USD') {
      const a = lookup(from, 'USD');
      const b = lookup('USD', to);
      if (a != null && b != null) return a * b;
    }
    return null;
  };

  return (amount: number, from: string): number => {
    const r = lookup(from, base);
    if (r == null) return round2(amount); // safe 1:1 fallback
    return round2(amount * r);
  };
}
