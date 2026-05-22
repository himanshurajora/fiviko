import type { BadgeDTO } from '@fiviko/shared';
import { prisma } from '../../lib/prisma.js';

/** All badges, each flagged with whether this user has unlocked it. */
export async function listBadges(userId: string): Promise<BadgeDTO[]> {
  const [badges, userBadges] = await Promise.all([
    prisma.badge.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.userBadge.findMany({ where: { userId } }),
  ]);
  const unlocked = new Map(userBadges.map((ub) => [ub.badgeId, ub.unlockedAt]));
  return badges.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    unlocked: unlocked.has(b.id),
    unlockedAt: unlocked.get(b.id)?.toISOString() ?? null,
  }));
}

/** Only the badges this user has earned. */
export async function listUserBadges(userId: string): Promise<BadgeDTO[]> {
  return (await listBadges(userId)).filter((b) => b.unlocked);
}

/**
 * Awards a badge by its stable `code` if the user doesn't already have it.
 * Returns the newly-unlocked BadgeDTO, or null if it was already unlocked
 * (or the code is unknown). Safe to call repeatedly.
 */
export async function awardBadge(userId: string, code: string): Promise<BadgeDTO | null> {
  const badge = await prisma.badge.findUnique({ where: { code } });
  if (!badge) return null;

  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (existing) return null;

  const created = await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
  return {
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    unlocked: true,
    unlockedAt: created.unlockedAt.toISOString(),
  };
}
