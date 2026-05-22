import { Prisma } from '@prisma/client';
import { CATEGORY_SCORE_PRESETS, computeHealthScore, type BadgeDTO, type OnboardingResult } from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/http.js';
import { getFinancialSummary } from '../profile/profile.service.js';
import { awardBadge } from '../badges/badges.service.js';
import { recalculateRecommendation } from '../goals/goals.service.js';
import type { OnboardingInput } from './onboarding.schema.js';

const D = (n: number) => new Prisma.Decimal(n);

/**
 * Persists the entire onboarding payload in one transaction, then awards badges
 * and returns the user's first financial summary + health score (spec §8.2).
 * Amounts are already in base currency, so baseCurrencyAmount mirrors amount.
 */
export async function completeOnboarding(userId: string, input: OnboardingInput): Promise<OnboardingResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');
  const cur = input.baseCurrency;

  const goalId = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { baseCurrency: cur, financialPersonality: input.financialPersonality, onboardingCompleted: true },
    });

    if (input.incomes.length) {
      await tx.income.createMany({
        data: input.incomes.map((i) => ({ userId, type: i.type, amount: D(i.amount), currency: cur, baseCurrencyAmount: D(i.amount), frequency: i.frequency })),
      });
    }
    if (input.mandatoryExpenses.length) {
      await tx.mandatoryExpense.createMany({
        data: input.mandatoryExpenses.map((m) => ({ userId, category: m.category, amount: D(m.amount), currency: cur, baseCurrencyAmount: D(m.amount), frequency: m.frequency })),
      });
    }
    if (input.assets.length) {
      await tx.asset.createMany({
        data: input.assets.map((a) => ({ userId, type: a.type, name: a.name, amount: D(a.amount), currency: cur, baseCurrencyAmount: D(a.amount), liquidityType: a.liquidityType })),
      });
    }
    if (input.liabilities.length) {
      await tx.liability.createMany({
        data: input.liabilities.map((l) => ({
          userId, type: l.type, name: l.name,
          outstandingAmount: D(l.outstandingAmount), monthlyPayment: D(l.monthlyPayment), currency: cur,
          baseCurrencyOutstandingAmount: D(l.outstandingAmount), baseCurrencyMonthlyPayment: D(l.monthlyPayment),
        })),
      });
    }

    if (input.firstGoal) {
      const g = input.firstGoal;
      const goal = await tx.goal.create({
        data: {
          userId, name: g.name, type: g.type, category: g.category,
          targetAmount: D(g.targetAmount), currency: cur, baseCurrencyTargetAmount: D(g.targetAmount),
          priority: g.priority,
        },
      });
      // Seed smart preset scores so the goal has a recommendation immediately.
      const preset = CATEGORY_SCORE_PRESETS[g.category] ?? CATEGORY_SCORE_PRESETS.OTHER;
      await tx.goalScoreInput.create({ data: { goalId: goal.id, ...preset } });
      return goal.id;
    }
    return null;
  });

  // Award badges (idempotent) outside the transaction.
  const unlockedBadges: BadgeDTO[] = [];
  const onboardBadge = await awardBadge(userId, 'ONBOARDING_COMPLETED');
  if (onboardBadge) unlockedBadges.push(onboardBadge);
  if (goalId) {
    const goalBadge = await awardBadge(userId, 'FIRST_GOAL');
    if (goalBadge) unlockedBadges.push(goalBadge);
    // Compute the goal's recommendation now that scores + finances exist.
    try {
      await recalculateRecommendation(userId, goalId);
    } catch {
      /* non-fatal: recommendation can be computed lazily on first view */
    }
  }

  const summary = await getFinancialSummary(userId);
  return { summary, healthScore: computeHealthScore(summary), unlockedBadges, goalId };
}
