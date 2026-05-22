import type { StreakDTO } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { STREAK_META } from '@/lib/gamification';

/** Shows the user's expense-logging streak as a friendly flame counter. */
export function StreakCard({ streak }: { streak: StreakDTO }) {
  const meta = STREAK_META[streak.type];
  const active = streak.currentCount > 0;

  return (
    <Card padded className={active ? 'bg-gradient-sun text-ink' : ''}>
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {active ? meta.emoji : '🌱'}
        </span>
        <div className="min-w-0 flex-1">
          {active ? (
            <>
              <p className="text-2xl font-extrabold leading-none text-ink">
                {streak.currentCount} day{streak.currentCount > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-ink/80">{meta.label} · keep it going!</p>
            </>
          ) : (
            <>
              <p className="font-bold text-ink">Start your first streak!</p>
              <p className="text-sm text-ink-soft">Log an expense today to get going.</p>
            </>
          )}
        </div>
        {streak.longestCount > 0 && (
          <span className="shrink-0 rounded-full bg-black/10 px-2.5 py-1 text-xs font-semibold text-ink">
            Best {streak.longestCount}
          </span>
        )}
      </div>
    </Card>
  );
}
