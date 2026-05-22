import { Link } from 'react-router-dom';
import type { GoalDTO } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { RecommendationBadge } from './RecommendationBadge';
import { GOAL_CATEGORY_META } from '@/lib/goalMeta';
import { formatCurrency } from '@/lib/format';
import { playSound } from '@/lib/sound';

/** Summary card for one goal: progress ring, recommendation, and saving plan. */
export function GoalCard({ goal }: { goal: GoalDTO }) {
  const meta = GOAL_CATEGORY_META[goal.category];
  const progress = goal.baseCurrencyTargetAmount > 0
    ? goal.baseCurrencyCurrentSavedAmount / goal.baseCurrencyTargetAmount
    : 0;

  return (
    <Link to={`/app/goals/${goal.id}`} onClick={() => playSound('pop')} className="focus-ring block rounded-3xl">
      <Card className="transition hover:shadow-soft" padded>
        <div className="flex items-center gap-4">
          <ProgressRing value={progress} size={72} strokeWidth={8} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                {meta.emoji}
              </span>
              <h3 className="truncate font-bold text-ink">{goal.name}</h3>
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">
              {formatCurrency(goal.currentSavedAmount, goal.currency)} of{' '}
              {formatCurrency(goal.targetAmount, goal.currency)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {goal.recommendation && <RecommendationBadge recommendation={goal.recommendation} size="sm" />}
              {goal.recommendedMonthlySaving != null && goal.recommendedMonthlySaving > 0 && (
                <span className="text-xs text-ink-soft">
                  Save {formatCurrency(goal.recommendedMonthlySaving, goal.currency)}/mo
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
