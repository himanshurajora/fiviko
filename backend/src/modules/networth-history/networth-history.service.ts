import { Prisma } from '@prisma/client';
import type { NetWorthHistoryEntry } from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { getFinancialSummary } from '../profile/profile.service.js';

const dec = (d: Prisma.Decimal | number): number => Number(d);
const D = (n: number) => new Prisma.Decimal(n);

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function recentMonthKeys(count: number, now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  }
  return keys;
}

/** Upserts the given month's net-worth snapshot for a user from their summary. */
export async function snapshotMonthForUser(userId: string, month: string): Promise<void> {
  const s = await getFinancialSummary(userId);
  const data = {
    netWorth: D(s.netWorth),
    liquidNetWorth: D(s.liquidNetWorth),
    totalAssets: D(s.totalAssets),
    totalLiabilities: D(s.totalLiabilities),
  };
  await prisma.netWorthHistory.upsert({
    where: { userId_month: { userId, month } },
    update: data,
    create: { userId, month, ...data },
  });
}

/** Scheduler hook: snapshot the given month's net worth for every user. */
export async function snapshotMonthForAllUsers(month: string): Promise<number> {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) await snapshotMonthForUser(u.id, month);
  return users.length;
}

/** Recent net-worth history; always reflects the live current month. */
export async function getNetWorthHistory(userId: string, months = 6): Promise<NetWorthHistoryEntry[]> {
  // Keep the current month fresh so the chart's last point matches the dashboard.
  await snapshotMonthForUser(userId, monthKey(new Date()));

  const keys = recentMonthKeys(Math.min(24, Math.max(1, months)));
  const rows = await prisma.netWorthHistory.findMany({ where: { userId, month: { in: keys } } });
  const byMonth = new Map(rows.map((r) => [r.month, r]));

  // Carry the earliest known snapshot backward for months before tracking began,
  // so the line doesn't drop to zero.
  const earliest = rows.length ? rows.reduce((a, b) => (a.month < b.month ? a : b)) : null;
  return keys.map((month) => {
    const row = byMonth.get(month) ?? (earliest && month < earliest.month ? earliest : undefined);
    return {
      month,
      netWorth: row ? dec(row.netWorth) : 0,
      liquidNetWorth: row ? dec(row.liquidNetWorth) : 0,
    };
  });
}
