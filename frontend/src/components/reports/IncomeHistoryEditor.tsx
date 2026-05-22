import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useIncomeHistory, useSetMonthlyIncome } from '@/lib/finances';
import { formatCurrency } from '@/lib/format';
import { notify } from '@/store/toast';

/** Lists recent months' income with inline editing for variable-income months. */
export function IncomeHistoryEditor({ currency, months = 6 }: { currency: string; months?: number }) {
  const { data: history } = useIncomeHistory(months);
  const setIncome = useSetMonthlyIncome();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  if (!history) return null;

  async function save(month: string) {
    const amount = Number(draft);
    if (!Number.isFinite(amount) || amount < 0) {
      notify.error('Enter a valid amount');
      return;
    }
    await setIncome.mutateAsync({ month, amount });
    notify.custom('Income updated', { tone: 'success', icon: '💰', sound: 'save' });
    setEditing(null);
  }

  return (
    <Card padded>
      <h3 className="font-bold text-ink">Income history</h3>
      <p className="text-sm text-ink-soft">Auto-filled from your recurring income. Tap a month to adjust (bonus, lean month…).</p>
      <ul className="mt-3 divide-y divide-muted-border">
        {[...history].reverse().map((h) => {
          const label = new Date(`${h.month}-01`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
          const isEditing = editing === h.month;
          return (
            <li key={h.month} className="flex items-center gap-3 py-2.5">
              <span className="flex-1 text-sm text-ink">{label}</span>
              {h.source === 'manual' && (
                <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] font-semibold text-secondary">edited</span>
              )}
              {isEditing ? (
                <>
                  <input
                    type="number"
                    inputMode="decimal"
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="focus-ring h-9 w-28 rounded-xl border border-muted-border bg-surface px-2 text-right text-sm"
                  />
                  <button onClick={() => save(h.month)} className="focus-ring rounded-lg px-2 py-1 text-sm font-semibold text-primary">Save</button>
                  <button onClick={() => setEditing(null)} className="focus-ring rounded-lg px-1 text-sm text-ink-soft">✕</button>
                </>
              ) : (
                <button
                  onClick={() => { setEditing(h.month); setDraft(String(h.amount)); }}
                  className="focus-ring rounded-lg px-2 py-1 text-sm font-bold text-ink hover:bg-black/5"
                >
                  {formatCurrency(h.amount, currency)}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
