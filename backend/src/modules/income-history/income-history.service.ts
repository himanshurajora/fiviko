import { Prisma } from '@prisma/client';
import type { IncomeHistoryEntry } from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/http.js';
import { getFinancialSummary } from '../profile/profile.service.js';

const dec = (d: Prisma.Decimal | number): number => Number(d);
const D = (n: number) => new Prisma.Decimal(n);

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** The last `count` month keys ending at the current month (oldest first). */
function recentMonthKeys(count: number, now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  }
  return keys;
}

/**
 * Ensures a snapshot row exists for `month`, seeded from the user's current
 * recurring monthly income. Won't overwrite a manual edit. Idempotent.
 */
export async function ensureMonthSnapshot(userId: string, month: string, recurringMonthlyIncome: number): Promise<void> {
  const existing = await prisma.incomeHistory.findUnique({ where: { userId_month: { userId, month } } });
  if (existing) return;
  await prisma.incomeHistory.create({
    data: { userId, month, baseCurrencyAmount: D(recurringMonthlyIncome), source: 'auto' },
  });
}

/** Returns the recent income history (auto-seeding the current month if needed). */
export async function getIncomeHistory(userId: string, months = 6): Promise<IncomeHistoryEntry[]> {
  const summary = await getFinancialSummary(userId);
  const keys = recentMonthKeys(Math.min(24, Math.max(1, months)));
  await ensureMonthSnapshot(userId, monthKey(new Date()), summary.monthlyIncome);

  const rows = await prisma.incomeHistory.findMany({ where: { userId, month: { in: keys } } });
  const byMonth = new Map(rows.map((r) => [r.month, r]));

  // For months without a stored snapshot (before tracking began), fall back to
  // the current recurring income as the best estimate.
  return keys.map((month) => {
    const row = byMonth.get(month);
    return {
      month,
      amount: row ? dec(row.baseCurrencyAmount) : summary.monthlyIncome,
      source: (row?.source as 'auto' | 'manual') ?? 'auto',
    };
  });
}

/** A month -> income map for the trend endpoint (real history, recurring fallback). */
export async function incomeByMonth(userId: string, monthKeys: string[]): Promise<Map<string, number>> {
  const summary = await getFinancialSummary(userId);
  await ensureMonthSnapshot(userId, monthKey(new Date()), summary.monthlyIncome);
  const rows = await prisma.incomeHistory.findMany({ where: { userId, month: { in: monthKeys } } });
  const map = new Map<string, number>();
  for (const k of monthKeys) map.set(k, summary.monthlyIncome); // fallback
  for (const r of rows) map.set(r.month, dec(r.baseCurrencyAmount));
  return map;
}

/** Manually set a month's income (e.g. a bonus or a lean freelance month). */
export async function setMonthlyIncome(userId: string, month: string, amount: number): Promise<IncomeHistoryEntry> {
  if (!/^\d{4}-\d{2}$/.test(month)) throw AppError.badRequest('Month must be in YYYY-MM format');
  if (amount < 0) throw AppError.badRequest('Income cannot be negative');
  const row = await prisma.incomeHistory.upsert({
    where: { userId_month: { userId, month } },
    update: { baseCurrencyAmount: D(amount), source: 'manual' },
    create: { userId, month, baseCurrencyAmount: D(amount), source: 'manual' },
  });
  return { month: row.month, amount: dec(row.baseCurrencyAmount), source: 'manual' };
}

/** Scheduler hook: snapshot the given month's recurring income for every user. */
export async function snapshotMonthForAllUsers(month: string): Promise<number> {
  const users = await prisma.user.findMany({ select: { id: true } });
  let created = 0;
  for (const u of users) {
    const existing = await prisma.incomeHistory.findUnique({ where: { userId_month: { userId: u.id, month } } });
    if (existing) continue;
    const summary = await getFinancialSummary(u.id);
    await prisma.incomeHistory.create({
      data: { userId: u.id, month, baseCurrencyAmount: D(summary.monthlyIncome), source: 'auto' },
    });
    created += 1;
  }
  return created;
}
