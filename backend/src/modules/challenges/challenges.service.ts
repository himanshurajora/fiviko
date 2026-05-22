import {
  ChallengeType,
  UserChallengeStatus,
  type ChallengeDTO,
} from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/http.js';
import { monthlySummary } from '../expenses/expenses.service.js';
import { expenseLoggingStreak } from '../streaks/streaks.service.js';
import { awardBadge } from '../badges/badges.service.js';

/**
 * Returns the active daily + monthly challenges with progress computed live
 * from the user's data — no persisted counters, no nightly reset job. Each
 * challenge derives its progress from expenses/streaks/budget on read, so a new
 * day automatically presents a fresh daily challenge.
 */
export async function listChallenges(userId: string): Promise<ChallengeDTO[]> {
  const challenges = await prisma.challenge.findMany({ include: { rewardBadge: true }, orderBy: { type: 'asc' } });

  const [summary, streak, todayStats] = await Promise.all([
    monthlySummary(userId),
    expenseLoggingStreak(userId),
    todaysExpenseStats(userId),
  ]);

  const results: ChallengeDTO[] = [];
  for (const c of challenges) {
    const { progress, status } = evaluate(c.code, c.targetValue, { summary, streak, todayStats });
    // Award the reward badge once genuinely completed (idempotent).
    if (status === UserChallengeStatus.Completed && c.rewardBadge) {
      await awardBadge(userId, c.rewardBadge.code);
    }
    // Keep a lightweight record of status for the user (optional, non-authoritative).
    await prisma.userChallenge.upsert({
      where: { userId_challengeId: { userId, challengeId: c.id } },
      update: { progress, status },
      create: { userId, challengeId: c.id, progress, status },
    });

    results.push({
      id: c.id,
      code: c.code,
      title: c.title,
      description: c.description,
      type: c.type as ChallengeType,
      target: c.targetValue,
      progress,
      status,
      rewardBadge: c.rewardBadge ? { name: c.rewardBadge.name, icon: c.rewardBadge.icon } : null,
    });
  }
  return results;
}

export async function getChallenge(userId: string, challengeId: string): Promise<ChallengeDTO> {
  const all = await listChallenges(userId);
  const found = all.find((c) => c.id === challengeId);
  if (!found) throw AppError.notFound('Challenge not found');
  return found;
}

interface EvalContext {
  summary: Awaited<ReturnType<typeof monthlySummary>>;
  streak: number;
  todayStats: { count: number; wantCount: number };
}

function evaluate(code: string, target: number, ctx: EvalContext): { progress: number; status: UserChallengeStatus } {
  const done = (p: number) => ({ progress: p, status: UserChallengeStatus.Completed });
  const going = (p: number) => ({ progress: p, status: UserChallengeStatus.InProgress });
  const failed = (p: number) => ({ progress: p, status: UserChallengeStatus.Failed });

  switch (code) {
    case 'DAILY_LOG':
      return ctx.todayStats.count >= 1 ? done(1) : going(0);
    case 'DAILY_NO_IMPULSE':
      // Stay impulse-free today; logging a "want" breaks it.
      return ctx.todayStats.wantCount > 0 ? failed(0) : done(1);
    case 'MONTHLY_UNDER_BUDGET':
      if (ctx.summary.overBudget) return failed(0);
      // Counts as "completed" only after a meaningful stretch of staying under.
      return ctx.summary.daysElapsed >= 7 && ctx.summary.total > 0 ? done(1) : going(ctx.summary.overBudget ? 0 : 1);
    case 'MONTHLY_SAVE_STREAK':
      return ctx.streak >= target ? done(target) : going(ctx.streak);
    default:
      return going(0);
  }
}

async function todaysExpenseStats(userId: string): Promise<{ count: number; wantCount: number }> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: start } },
    select: { needOrWant: true },
  });
  return { count: expenses.length, wantCount: expenses.filter((e) => e.needOrWant === 'WANT').length };
}
