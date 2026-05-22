import type { LevelDTO } from '@fiviko/shared';

/**
 * Compact level chip with a progress ring toward the next level.
 * `variant="light"` is for placement on dark/gradient surfaces.
 */
export function LevelBadge({ level, variant = 'dark' }: { level: LevelDTO; variant?: 'dark' | 'light' }) {
  const pct = Math.round(level.progress * 100);
  const ringColor = variant === 'light' ? '#FFFFFF' : '#6C63FF';
  const track = variant === 'light' ? 'rgba(255,255,255,0.3)' : '#E5E7EB';
  // Conic-gradient progress ring around the level number.
  const ring = `conic-gradient(${ringColor} ${pct * 3.6}deg, ${track} 0deg)`;
  const textTone = variant === 'light' ? 'text-white' : 'text-ink';
  const subTone = variant === 'light' ? 'text-white/80' : 'text-ink-soft';

  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-11 w-11 place-items-center rounded-full" style={{ background: ring }}>
        <div className={`grid h-8 w-8 place-items-center rounded-full text-sm font-extrabold ${variant === 'light' ? 'bg-primary text-white' : 'bg-surface text-primary'}`}>
          {level.level}
        </div>
      </div>
      <div className="leading-tight">
        <p className={`text-sm font-bold ${textTone}`}>{level.name}</p>
        <p className={`text-xs ${subTone}`}>
          {level.xpForNext != null ? `${level.xp}/${level.xpForNext} XP` : `Max level · ${level.xp} XP`}
        </p>
      </div>
    </div>
  );
}
