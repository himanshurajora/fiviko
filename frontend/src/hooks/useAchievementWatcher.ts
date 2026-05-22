import { useEffect, useRef } from 'react';
import { useBadges } from '@/lib/badges';
import { useLevel } from '@/lib/gamification';
import { useCelebration } from '@/store/celebration';

/**
 * Watches badges and level; fires a celebration when a new badge is unlocked or
 * the level increases. The first observation establishes a baseline (so we don't
 * celebrate pre-existing achievements on load). Mount once in the app frame.
 */
export function useAchievementWatcher(): void {
  const { data: badges } = useBadges();
  const { data: level } = useLevel();
  const enqueue = useCelebration((s) => s.enqueue);

  const seenBadgeIds = useRef<Set<string> | null>(null);
  const prevLevel = useRef<number | null>(null);

  useEffect(() => {
    if (!badges) return;
    const unlocked = badges.filter((b) => b.unlocked);
    if (seenBadgeIds.current === null) {
      seenBadgeIds.current = new Set(unlocked.map((b) => b.id));
      return;
    }
    for (const b of unlocked) {
      if (!seenBadgeIds.current.has(b.id)) {
        seenBadgeIds.current.add(b.id);
        enqueue({ kind: 'badge', icon: b.icon, title: b.name, subtitle: b.description });
      }
    }
  }, [badges, enqueue]);

  useEffect(() => {
    if (!level) return;
    if (prevLevel.current === null) {
      prevLevel.current = level.level;
      return;
    }
    if (level.level > prevLevel.current) {
      enqueue({ kind: 'level', icon: '⭐', title: `Level ${level.level}: ${level.name}`, subtitle: 'You leveled up — keep it going!' });
    }
    prevLevel.current = level.level;
  }, [level, enqueue]);
}
