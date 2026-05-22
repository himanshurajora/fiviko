import { Link } from 'react-router-dom';
import type { BadgeDTO } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';

/** Compact badge-progress widget for the dashboard (spec §13). */
export function BadgeProgressCard({ badges }: { badges: BadgeDTO[] }) {
  const unlocked = badges.filter((b) => b.unlocked);
  const pct = badges.length > 0 ? Math.round((unlocked.length / badges.length) * 100) : 0;
  // Show a few recent unlocks, else a few locked ones as "coming up".
  const preview = (unlocked.length > 0 ? unlocked : badges).slice(0, 5);

  return (
    <Link to="/app/badges" className="focus-ring block">
      <Card padded animate={false}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">🏅 Badges</h2>
          <span className="text-sm font-semibold text-ink-soft">{unlocked.length}/{badges.length}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted-border">
          <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex gap-2">
          {preview.map((b) => (
            <span key={b.id} className={`text-2xl ${b.unlocked ? '' : 'opacity-40 grayscale'}`} title={b.name} aria-hidden>
              {b.unlocked ? b.icon : '🔒'}
            </span>
          ))}
        </div>
      </Card>
    </Link>
  );
}
