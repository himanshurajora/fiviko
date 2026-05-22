import { UserChallengeStatus, type ChallengeDTO } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';

const STATUS_STYLE: Record<UserChallengeStatus, { chip: string; label: string }> = {
  [UserChallengeStatus.Completed]: { chip: 'bg-success/15 text-success', label: 'Done ✓' },
  [UserChallengeStatus.InProgress]: { chip: 'bg-primary/10 text-primary', label: 'In progress' },
  [UserChallengeStatus.Failed]: { chip: 'bg-danger/10 text-danger', label: 'Missed' },
};

/** A daily/monthly challenge with a progress bar and reward hint. */
export function ChallengeCard({ challenge }: { challenge: ChallengeDTO }) {
  const status = STATUS_STYLE[challenge.status];
  const pct = challenge.target > 0 ? Math.min(100, Math.round((challenge.progress / challenge.target) * 100)) : 0;
  const done = challenge.status === UserChallengeStatus.Completed;

  return (
    <Card padded className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-ink">{challenge.title}</p>
          <p className="text-xs text-ink-soft">{challenge.description}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.chip}`}>{status.label}</span>
      </div>

      {challenge.target > 1 && (
        <div className="mt-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted-border">
            <div className={`h-full rounded-full ${done ? 'bg-success' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-right text-xs text-ink-soft">{challenge.progress}/{challenge.target}</p>
        </div>
      )}

      {challenge.rewardBadge && (
        <p className="text-xs text-ink-soft">
          Reward: <span aria-hidden>{challenge.rewardBadge.icon}</span> {challenge.rewardBadge.name}
        </p>
      )}
    </Card>
  );
}
