import { StreakType, type StreakDTO } from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { awardBadge } from '../badges/badges.service.js';

/** Normalise a date to UTC midnight so streaks compare whole days. */
function dayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
/** Whole-day difference b − a (can be negative). */
function dayDiff(a: Date, b: Date): number {
  return Math.round((dayStart(b).getTime() - dayStart(a).getTime()) / 86_400_000);
}

/**
 * Records that the user logged an expense on `when`, advancing the
 * EXPENSE_LOGGING streak. Event-driven (called on every expense create/sync):
 *  - same day  -> unchanged
 *  - next day  -> +1
 *  - gap > 1d  -> reset to 1
 * No cron needed; missed days are handled here and at read time.
 */
export async function recordExpenseLogged(userId: string, when: Date): Promise<void> {
  await bumpStreak(userId, StreakType.ExpenseLogging, when);
  await awardBadge(userId, 'FIRST_EXPENSE');
}

async function bumpStreak(userId: string, type: StreakType, when: Date): Promise<void> {
  const existing = await prisma.streak.findUnique({ where: { userId_type: { userId, type } } });

  if (!existing) {
    await prisma.streak.create({
      data: { userId, type, currentCount: 1, longestCount: 1, lastUpdatedAt: dayStart(when) },
    });
    return;
  }

  const diff = existing.lastUpdatedAt ? dayDiff(existing.lastUpdatedAt, when) : 999;
  if (diff < 0) return; // backdated entry older than the streak anchor — ignore
  const current = diff === 0 ? existing.currentCount : diff === 1 ? existing.currentCount + 1 : 1;
  const longest = Math.max(existing.longestCount, current);

  await prisma.streak.update({
    where: { userId_type: { userId, type } },
    data: { currentCount: current, longestCount: longest, lastUpdatedAt: dayStart(when) },
  });

  if (type === StreakType.ExpenseLogging && current >= 7) {
    await awardBadge(userId, 'SEVEN_DAY_SAVER');
  }
}

/**
 * Returns all streak types with their *effective* current count: a stored
 * streak is only "alive" if its last update was today or yesterday, otherwise
 * it has lapsed and reads as 0 (lazy reset, no scheduled job).
 */
export async function getStreaks(userId: string): Promise<StreakDTO[]> {
  const rows = await prisma.streak.findMany({ where: { userId } });
  const byType = new Map(rows.map((r) => [r.type, r]));
  const now = new Date();

  return Object.values(StreakType).map((type) => {
    const row = byType.get(type);
    if (!row || !row.lastUpdatedAt) {
      return { type, currentCount: 0, longestCount: row?.longestCount ?? 0, lastUpdatedAt: null };
    }
    const stale = dayDiff(row.lastUpdatedAt, now) > 1;
    return {
      type,
      currentCount: stale ? 0 : row.currentCount,
      longestCount: row.longestCount,
      lastUpdatedAt: row.lastUpdatedAt.toISOString(),
    };
  });
}

/** The live expense-logging streak count, used by challenges. */
export async function expenseLoggingStreak(userId: string): Promise<number> {
  const streaks = await getStreaks(userId);
  return streaks.find((s) => s.type === StreakType.ExpenseLogging)?.currentCount ?? 0;
}
