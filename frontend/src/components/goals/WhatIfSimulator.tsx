import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GoalDTO } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RecommendationBadge } from './RecommendationBadge';
import { useWhatIf } from '@/lib/goals';
import { formatCurrency } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';

/** "What if I buy this now / at a different price?" simulator (spec §15). */
export function WhatIfSimulator({ goal }: { goal: GoalDTO }) {
  const whatIf = useWhatIf(goal.id);
  const [price, setPrice] = useState<number>(goal.targetAmount);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    try {
      await whatIf.mutateAsync(price !== goal.targetAmount ? price : undefined);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not run simulation'));
    }
  }

  const result = whatIf.data;

  return (
    <Card padded>
      <h3 className="flex items-center gap-2 font-bold text-ink">
        <span aria-hidden>🔮</span> What if I buy this now?
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        Try a different price to see how the recommendation and your other goals change.
      </p>

      <div className="mt-3 flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="whatif-price" className="text-sm font-semibold text-ink">
            Price ({goal.currency})
          </label>
          <input
            id="whatif-price"
            type="number"
            inputMode="decimal"
            value={price || ''}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="focus-ring mt-1 h-12 w-full rounded-2xl border border-muted-border bg-surface px-4 text-base"
          />
        </div>
        <Button onClick={run} loading={whatIf.isPending}>
          Simulate
        </Button>
      </div>

      {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden rounded-2xl bg-background p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-ink-soft">New recommendation</span>
              <RecommendationBadge recommendation={result.recommendation} size="sm" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink">{result.explanation}</p>
            {result.monthlySavingRequired > 0 && (
              <p className="mt-2 text-xs text-ink-soft">
                Suggested saving: <strong>{formatCurrency(result.monthlySavingRequired, goal.currency)}/mo</strong>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
