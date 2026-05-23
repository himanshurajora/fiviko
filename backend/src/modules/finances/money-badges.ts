import { prisma } from '../../lib/prisma.js';
import { awardBadge } from '../badges/badges.service.js';

/**
 * Re-evaluates the money-flow badges introduced with the Money hub. Safe to
 * call on every relevant mutation; `awardBadge` is idempotent.
 *
 * Codes:
 *  - INCOME_DIVERSIFIER:   3+ active income sources
 *  - INTERNATIONAL_INCOME: income in 2+ distinct currencies
 *  - DEBT_CRUSHER_HALF:    any liability paid down ≥ 50% of its original
 *  - DEBT_CRUSHER_FULL:    any liability paid down 100% (outstanding hit 0)
 *  - MULTI_ACCOUNT:        3+ active accounts across 2+ types
 */
export async function evaluateMoneyBadges(userId: string): Promise<void> {
  const [incomes, liabilities, assets] = await Promise.all([
    prisma.income.findMany({ where: { userId, deletedAt: null }, select: { currency: true } }),
    prisma.liability.findMany({
      where: { userId, deletedAt: null },
      select: { outstandingAmount: true, originalOutstandingAmount: true },
    }),
    prisma.asset.findMany({ where: { userId, deletedAt: null }, select: { type: true } }),
  ]);

  // Income Diversifier — 3+ active sources, any type.
  if (incomes.length >= 3) await awardBadge(userId, 'INCOME_DIVERSIFIER');

  // International Income — 2+ distinct currencies on the income side.
  const incomeCurrencies = new Set(incomes.map((i) => i.currency));
  if (incomeCurrencies.size >= 2) await awardBadge(userId, 'INTERNATIONAL_INCOME');

  // Debt Crusher (50% or 100%). Original is null for pre-migration rows;
  // treat that as "we can't tell" and skip rather than false-award.
  for (const l of liabilities) {
    const orig = l.originalOutstandingAmount == null ? null : Number(l.originalOutstandingAmount);
    if (orig == null || orig <= 0) continue;
    const out = Number(l.outstandingAmount);
    const paidPct = (orig - out) / orig;
    if (paidPct >= 1) {
      await awardBadge(userId, 'DEBT_CRUSHER_FULL');
      await awardBadge(userId, 'DEBT_CRUSHER_HALF');
    } else if (paidPct >= 0.5) {
      await awardBadge(userId, 'DEBT_CRUSHER_HALF');
    }
  }

  // Multi-Account — 3+ assets across 2+ distinct types.
  const types = new Set(assets.map((a) => a.type));
  if (assets.length >= 3 && types.size >= 2) await awardBadge(userId, 'MULTI_ACCOUNT');
}
