import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useBudgets, useSetBudget } from '@/lib/expenses';
import { EXPENSE_CATEGORY_META, EXPENSE_CATEGORY_OPTIONS } from '@/lib/expenseMeta';
import { formatCurrency } from '@/lib/format';
import { notify } from '@/store/toast';
import type { ExpenseCategory } from '@fiviko/shared';

/** Per-category monthly budgets with spent-vs-cap bars and inline editing. */
export function BudgetsCard({ currency }: { currency: string }) {
  const { data: budgets } = useBudgets();
  const setBudget = useSetBudget();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState<ExpenseCategory>('FOOD' as ExpenseCategory);

  if (!budgets) return null;
  const withCaps = budgets.filter((b) => b.monthlyLimit != null);

  async function save(category: string) {
    const amount = Number(draft);
    if (!Number.isFinite(amount) || amount < 0) return notify.error('Enter a valid amount');
    await setBudget.mutateAsync({ category: category as ExpenseCategory, amount });
    notify.custom(amount > 0 ? 'Budget set' : 'Budget removed', { tone: 'success', icon: '🎯', sound: 'save' });
    setEditing(null);
  }

  return (
    <Card padded>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-ink">Category budgets</h3>
        <button onClick={() => setAdding((v) => !v)} className="focus-ring rounded-full px-3 py-1 text-sm font-semibold text-primary">
          {adding ? 'Close' : '+ Set a budget'}
        </button>
      </div>

      {adding && (
        <div className="mt-3 flex items-end gap-2 rounded-2xl bg-background p-3">
          <select value={newCat} onChange={(e) => setNewCat(e.target.value as ExpenseCategory)} className="focus-ring h-11 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
            {EXPENSE_CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
          </select>
          <input type="number" inputMode="decimal" placeholder={`Cap (${currency})`} value={draft} onChange={(e) => setDraft(e.target.value)} className="focus-ring h-11 w-28 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
          <button onClick={() => { save(newCat); setAdding(false); }} className="focus-ring rounded-2xl bg-primary px-3 py-2 text-sm font-bold text-white">Set</button>
        </div>
      )}

      {withCaps.length === 0 && !adding && (
        <p className="mt-2 text-sm text-ink-soft">No category budgets yet. Set caps to track spending per category.</p>
      )}

      <ul className="mt-3 space-y-3">
        {withCaps.map((b) => {
          const meta = EXPENSE_CATEGORY_META[b.category];
          const limit = b.monthlyLimit ?? 0;
          const pct = limit > 0 ? Math.min(100, Math.round((b.spent / limit) * 100)) : 0;
          const over = b.spent > limit;
          return (
            <li key={b.category}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-ink">
                  <span aria-hidden>{meta.emoji}</span> {meta.label}
                </span>
                {editing === b.category ? (
                  <span className="flex items-center gap-1">
                    <input type="number" inputMode="decimal" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="focus-ring h-8 w-24 rounded-lg border border-muted-border bg-surface px-2 text-right text-sm" />
                    <button onClick={() => save(b.category)} className="focus-ring rounded px-1.5 text-sm font-semibold text-primary">Save</button>
                    <button onClick={() => setEditing(null)} className="focus-ring px-1 text-sm text-ink-soft">✕</button>
                  </span>
                ) : (
                  <button onClick={() => { setEditing(b.category); setDraft(String(limit)); }} className={`focus-ring rounded px-1 text-sm font-medium ${over ? 'text-danger' : 'text-ink-soft'}`}>
                    {formatCurrency(b.spent, currency)} / {formatCurrency(limit, currency)}
                  </button>
                )}
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted-border">
                <div className={`h-full rounded-full ${over ? 'bg-danger' : pct > 80 ? 'bg-warning' : 'bg-secondary'}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
