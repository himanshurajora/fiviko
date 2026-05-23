import { Prisma } from '@prisma/client';
import type { NetWorthHistoryEntry } from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { getFinancialSummary } from '../profile/profile.service.js';

export type Granularity = 'D' | 'W' | 'M' | 'Y' | 'ALL';

const dec = (d: Prisma.Decimal | number): number => Number(d);
const D = (n: number) => new Prisma.Decimal(n);

/** YYYY-MM-DD in UTC. */
export function dateKey(d: Date = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Upserts a date-keyed snapshot computed live from the user's current finances. */
export async function snapshotDate(userId: string, date: string = dateKey()): Promise<void> {
  const s = await getFinancialSummary(userId);
  const data = {
    netWorth: D(s.netWorth),
    liquidNetWorth: D(s.liquidNetWorth),
    totalAssets: D(s.totalAssets),
    totalLiabilities: D(s.totalLiabilities),
  };
  await prisma.netWorthHistory.upsert({
    where: { userId_date: { userId, date } },
    update: data,
    create: { userId, date, ...data },
  });
}

/** Scheduler hook: snapshot today's net worth for every user. */
export async function snapshotAllUsersToday(): Promise<number> {
  const users = await prisma.user.findMany({ select: { id: true } });
  const today = dateKey();
  for (const u of users) await snapshotDate(u.id, today);
  return users.length;
}

/**
 * Returns net-worth history aggregated at the requested granularity:
 *   D - last 30 daily points
 *   W - last 26 weeks (last snapshot per ISO week)
 *   M - last 24 months (last snapshot per month)
 *   Y - last 10 years (last snapshot per year)
 *   ALL - every stored snapshot
 * Always ensures today's snapshot is fresh first.
 */
export async function getNetWorthHistory(userId: string, granularity: Granularity = 'M'): Promise<NetWorthHistoryEntry[]> {
  await snapshotDate(userId, dateKey());

  const all = await prisma.netWorthHistory.findMany({ where: { userId }, orderBy: { date: 'asc' } });
  if (all.length === 0) return [];

  const limit = granularity === 'D' ? 30 : granularity === 'W' ? 26 : granularity === 'M' ? 24 : granularity === 'Y' ? 10 : Number.POSITIVE_INFINITY;
  const bucket = (date: string): string => {
    if (granularity === 'D' || granularity === 'ALL') return date;
    if (granularity === 'M') return date.slice(0, 7);
    if (granularity === 'Y') return date.slice(0, 4);
    // ISO-week bucket
    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const day = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((dt.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
    return `${dt.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  };

  // Keep the LAST snapshot in each bucket (end-of-period values).
  const lastPerBucket = new Map<string, (typeof all)[number]>();
  for (const row of all) lastPerBucket.set(bucket(row.date), row);

  const buckets = [...lastPerBucket.values()].slice(-limit);
  return buckets.map((r) => ({
    date: r.date,
    netWorth: dec(r.netWorth),
    liquidNetWorth: dec(r.liquidNetWorth),
  }));
}

/**
 * Balance history for a single asset (native currency) — feeds the per-asset
 * mini chart on the tracker. Includes every entry within the last `days`.
 */
export async function getAssetBalanceHistory(userId: string, assetId: string, days = 180): Promise<{ date: string; amount: number }[]> {
  const since = new Date(Date.now() - days * 86_400_000);
  const entries = await prisma.assetBalanceEntry.findMany({
    where: { userId, assetId, recordedAt: { gte: since } },
    orderBy: { recordedAt: 'asc' },
  });
  return entries.map((e) => ({ date: dateKey(e.recordedAt), amount: dec(e.amount) }));
}
