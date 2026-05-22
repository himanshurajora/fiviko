import {
  GoalStatus,
  StreakType,
  computeHealthScore,
  computeXp,
  levelFromXp,
  type LevelDTO,
} from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/http.js';
import { getFinancialSummary } from '../profile/profile.service.js';

/**
 * Computes the user's level from their activity (badges, goals, best streak,
 * health score, onboarding). Pure derivation — nothing is persisted, so it
 * always reflects current state.
 */
export async function getLevel(userId: string): Promise<LevelDTO> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');

  const [badgeCount, activeGoals, achievedGoals, loggingStreak, summary] = await Promise.all([
    prisma.userBadge.count({ where: { userId } }),
    prisma.goal.count({ where: { userId, status: GoalStatus.Active } }),
    prisma.goal.count({ where: { userId, status: GoalStatus.Achieved } }),
    prisma.streak.findUnique({ where: { userId_type: { userId, type: StreakType.ExpenseLogging } } }),
    getFinancialSummary(userId),
  ]);

  const xp = computeXp({
    badgeCount,
    activeGoals,
    achievedGoals,
    bestLoggingStreak: loggingStreak?.longestCount ?? 0,
    healthScore: computeHealthScore(summary),
    onboardingCompleted: user.onboardingCompleted,
  });

  return levelFromXp(xp);
}
