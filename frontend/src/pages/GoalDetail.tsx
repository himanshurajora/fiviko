import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { PurchaseScoreCard } from '@/components/goals/PurchaseScoreCard';
import { WhatIfSimulator } from '@/components/goals/WhatIfSimulator';
import { GoalEditor } from '@/components/goals/GoalEditor';
import { ContributeControl } from '@/components/goals/ContributeControl';
import { useDeleteGoal, useGoal } from '@/lib/goals';
import { GOAL_CATEGORY_META } from '@/lib/goalMeta';
import { formatCurrency } from '@/lib/format';

export function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGoal(id);
  const deleteGoal = useDeleteGoal();

  async function onDelete() {
    if (!id || !window.confirm('Delete this goal? This cannot be undone.')) return;
    await deleteGoal.mutateAsync(id);
    navigate('/app/goals', { replace: true });
  }

  if (isLoading) {
    return <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-3xl bg-black/5" aria-hidden />;
  }
  if (isError || !data) {
    return <p className="text-ink-soft">Couldn’t load this goal.</p>;
  }

  const { goal, recommendation, scoreInput } = data;
  const meta = GOAL_CATEGORY_META[goal.category];
  const progress = goal.baseCurrencyTargetAmount > 0 ? goal.baseCurrencyCurrentSavedAmount / goal.baseCurrencyTargetAmount : 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <header className="flex items-center gap-3">
        <button onClick={() => navigate('/app/goals')} className="focus-ring text-2xl" aria-label="Back to goals">
          ←
        </button>
        <h1 className="flex-1 truncate text-2xl font-extrabold text-ink">{goal.name}</h1>
      </header>

      {/* Goal summary */}
      <Card padded>
        <div className="flex items-center gap-4">
          <ProgressRing value={progress} size={84} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-ink-soft">
              <span className="text-lg" aria-hidden>{meta.emoji}</span>
              <span className="text-sm">{meta.label} · {goal.type === 'SHORT_TERM' ? 'Short-term' : 'Long-term'}</span>
            </div>
            <p className="mt-1 text-xl font-extrabold text-ink">
              {formatCurrency(goal.currentSavedAmount, goal.currency)}
              <span className="text-base font-medium text-ink-soft"> / {formatCurrency(goal.targetAmount, goal.currency)}</span>
            </p>
            {goal.recommendedMonthlySaving != null && goal.recommendedMonthlySaving > 0 && (
              <p className="mt-1 text-sm text-ink-soft">
                Auto-allocated {formatCurrency(goal.recommendedMonthlySaving, goal.currency)}/mo
                {goal.estimatedCompletionDate && ` · done by ${new Date(goal.estimatedCompletionDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Log real savings toward this goal */}
      <ContributeControl goal={goal} />

      {/* Recommendation */}
      {recommendation ? (
        <PurchaseScoreCard result={recommendation} currency={goal.currency} />
      ) : (
        <Card padded className="text-center">
          <p className="text-ink-soft">Answer the value questions to get a recommendation.</p>
        </Card>
      )}

      {/* What-if */}
      <WhatIfSimulator goal={goal} />

      {/* Edit fields & adjust scores */}
      <GoalEditor goal={goal} scoreInput={scoreInput} />

      <Button variant="ghost" fullWidth onClick={onDelete} className="text-danger">
        Delete goal
      </Button>
    </div>
  );
}
