import type { QuickAddSuggestion } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { useAddExpense, useQuickAddSuggestions } from '@/lib/expenses';
import { EXPENSE_CATEGORY_META } from '@/lib/expenseMeta';
import { formatCurrency } from '@/lib/format';
import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';

/**
 * One-tap chips for the user's top recurring spend patterns over the last 30
 * days. Each tap logs an expense with the exact values that pattern uses.
 *
 * Hidden when there aren't enough recurring patterns to bother (the backend
 * filters out single-occurrence entries).
 */
export function QuickAddChips() {
  const { data, isLoading } = useQuickAddSuggestions();
  const add = useAddExpense();

  if (isLoading || !data || data.length === 0) return null;

  async function logOne(s: QuickAddSuggestion) {
    try {
      await add.mutateAsync({
        amount: s.amount,
        currency: s.currency,
        category: s.category,
        note: s.note,
        paymentMethod: s.paymentMethod,
        needOrWant: s.needOrWant,
      });
      notify.custom(
        `Logged ${formatCurrency(s.amount, s.currency)}${s.note ? ` · ${s.note}` : ''}`,
        { tone: 'success', icon: '⚡', sound: 'coin' },
      );
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not log'));
    }
  }

  return (
    <Card padded>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-ink">Quick log ⚡</h3>
        <span className="text-[11px] text-ink-soft">Your top 30-day patterns</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {data.map((s, idx) => {
          const meta = EXPENSE_CATEGORY_META[s.category];
          return (
            <button
              key={`${idx}-${s.category}-${s.amount}-${s.note ?? ''}`}
              onClick={() => logOne(s)}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              <span aria-hidden>{meta.emoji}</span>
              {s.note ? <span className="max-w-[120px] truncate">{s.note}</span> : <span>{meta.label}</span>}
              <span className="font-bold">{formatCurrency(s.amount, s.currency)}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
