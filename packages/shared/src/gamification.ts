/** The six progression levels (spec §14), ordered by the XP needed to reach them. */
export const LEVELS = [
  { level: 1, name: 'Beginner Saver', minXp: 0 },
  { level: 2, name: 'Careful Planner', minXp: 150 },
  { level: 3, name: 'Budget Defender', minXp: 350 },
  { level: 4, name: 'Smart Buyer', minXp: 600 },
  { level: 5, name: 'Wealth Builder', minXp: 1000 },
  { level: 6, name: 'Goal Master', minXp: 1500 },
] as const;

export interface LevelDTO {
  level: number;
  name: string;
  xp: number;
  /** XP threshold for the current level. */
  xpForCurrent: number;
  /** XP threshold for the next level, or null at max level. */
  xpForNext: number | null;
  /** Progress toward the next level, 0–1 (1 at max level). */
  progress: number;
}

/** The raw activity counters that feed the XP formula. */
export interface LevelInputs {
  badgeCount: number;
  activeGoals: number;
  achievedGoals: number;
  bestLoggingStreak: number;
  healthScore: number;
  onboardingCompleted: boolean;
}

/** Configurable XP weights, kept here so progression can be tuned in one place. */
export const XP_WEIGHTS = {
  perBadge: 100,
  perActiveGoal: 40,
  perAchievedGoal: 100,
  perStreakDay: 8,
  healthScore: 1, // multiplied by the 0–100 score
  onboarding: 50,
} as const;

export function computeXp(i: LevelInputs): number {
  return Math.round(
    i.badgeCount * XP_WEIGHTS.perBadge +
      i.activeGoals * XP_WEIGHTS.perActiveGoal +
      i.achievedGoals * XP_WEIGHTS.perAchievedGoal +
      i.bestLoggingStreak * XP_WEIGHTS.perStreakDay +
      i.healthScore * XP_WEIGHTS.healthScore +
      (i.onboardingCompleted ? XP_WEIGHTS.onboarding : 0),
  );
}

/** Maps an XP total to the user's level, with progress toward the next one. */
export function levelFromXp(xp: number): LevelDTO {
  let current: { level: number; name: string; minXp: number } = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.minXp) current = l;

  const next = LEVELS.find((l) => l.level === current.level + 1) ?? null;
  const progress = next
    ? Math.max(0, Math.min(1, (xp - current.minXp) / (next.minXp - current.minXp)))
    : 1;

  return {
    level: current.level,
    name: current.name,
    xp,
    xpForCurrent: current.minXp,
    xpForNext: next?.minXp ?? null,
    progress,
  };
}
