import { useState } from 'react';
import type { MandatoryExpenseCategory, MandatoryExpenseDTO } from '@fiviko/shared';
import { Frequency } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MANDATORY_OPTIONS } from '@/lib/financeMeta';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { useMandatoryMutations, useUpdateMandatory } from '@/lib/finances';
import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface Props {
  bills: MandatoryExpenseDTO[];
  baseCurrency: string;
}

const emojiFor = (t: string) => MANDATORY_OPTIONS.find((o) => o.value === t)?.emoji ?? '📦';
const labelFor = (t: string) => MANDATORY_OPTIONS.find((o) => o.value === t)?.label ?? t;

/** Bills (mandatory expenses) — list with edit + delete + add. */
export function BillsSection({ bills, baseCurrency }: Props) {
  const { create, remove } = useMandatoryMutations();
  const update = useUpdateMandatory();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Remove "${label}"?`)) return;
    await remove.mutateAsync(id);
    notify.custom('Bill removed', { tone: 'info', icon: '🗑️', sound: 'tap' });
  }

  return (
    <Card padded>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-ink">Monthly bills</h2>
        <button onClick={() => setAdding((v) => !v)} className="focus-ring rounded-full px-3 py-1 text-sm font-semibold text-primary">
          {adding ? 'Close' : '+ Add bill'}
        </button>
      </div>

      {adding && (
        <AddBillForm
          baseCurrency={baseCurrency}
          onCancel={() => setAdding(false)}
          saving={create.isPending}
          onSubmit={async (payload) => {
            try {
              await create.mutateAsync(payload);
              notify.custom('Bill added', { tone: 'success', icon: '🏠', sound: 'save' });
              setAdding(false);
            } catch (err) {
              notify.error(getErrorMessage(err, 'Could not add bill'));
            }
          }}
        />
      )}

      {(!bills || bills.length === 0) ? (
        <p className="mt-3 text-sm text-ink-soft">No bills yet — rent, utilities, subscriptions.</p>
      ) : (
        <div className="mt-2">
          {bills.map((b) => (
            <div key={b.id} className="border-b border-muted-border last:border-b-0 py-2">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-warning/10 text-lg" aria-hidden>
                  {emojiFor(b.category)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{labelFor(b.category)}</p>
                  <p className="text-[11px] text-ink-soft">{b.frequency.toLowerCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink">
                    {formatCurrency(b.amount, b.currency)}
                  </p>
                  {b.currency !== baseCurrency && (
                    <p className="text-[11px] text-ink-soft">
                      ≈ {formatCurrency(b.baseCurrencyAmount, baseCurrency)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-1 flex items-center justify-end gap-2 pl-13 text-xs">
                <button onClick={() => setEditingId(editingId === b.id ? null : b.id)} className="focus-ring rounded-full px-2 py-0.5 font-medium text-ink-soft hover:text-primary">
                  ✏️
                </button>
                <button onClick={() => onDelete(b.id, labelFor(b.category))} className="focus-ring rounded-full px-2 py-0.5 font-medium text-ink-soft hover:text-danger">
                  🗑️
                </button>
              </div>
              {editingId === b.id && (
                <EditBillInline
                  bill={b}
                  saving={update.isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (patch) => {
                    try {
                      await update.mutateAsync({ id: b.id, ...patch });
                      notify.custom('Bill updated', { tone: 'success', icon: '✅', sound: 'save' });
                      setEditingId(null);
                    } catch (err) {
                      notify.error(getErrorMessage(err, 'Could not update'));
                    }
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AddBillForm({ baseCurrency, onCancel, onSubmit, saving }: {
  baseCurrency: string;
  onCancel: () => void;
  onSubmit: (p: { category: MandatoryExpenseCategory; amount: number; currency: string; frequency: Frequency }) => Promise<void>;
  saving?: boolean;
}) {
  const [category, setCategory] = useState<MandatoryExpenseCategory>(MANDATORY_OPTIONS[0].value as MandatoryExpenseCategory);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(baseCurrency);

  async function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      notify.error('Enter a positive amount');
      return;
    }
    await onSubmit({ category, amount: n, currency, frequency: Frequency.Monthly });
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-background p-3">
      <div className="flex gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value as MandatoryExpenseCategory)} className="focus-ring h-11 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
          {MANDATORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
        </select>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="focus-ring h-11 w-24 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
          {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
        </select>
      </div>
      <input type="number" inputMode="decimal" placeholder={`Monthly amount (${currency})`} value={amount} onChange={(e) => setAmount(e.target.value)} className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      <div className="flex gap-2">
        <Button onClick={submit} loading={saving} fullWidth>Add</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function EditBillInline({ bill, onCancel, onSubmit, saving }: {
  bill: MandatoryExpenseDTO;
  onCancel: () => void;
  onSubmit: (patch: { category?: MandatoryExpenseCategory; amount?: number }) => Promise<void>;
  saving?: boolean;
}) {
  const [category, setCategory] = useState<MandatoryExpenseCategory>(bill.category);
  const [amount, setAmount] = useState(String(bill.amount));

  async function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      notify.error('Enter a positive amount');
      return;
    }
    await onSubmit({ category, amount: n });
  }

  return (
    <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-background p-3">
      <div className="flex gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value as MandatoryExpenseCategory)} className="focus-ring h-10 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
          {MANDATORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
        </select>
        <input type="number" inputMode="decimal" placeholder={`Amount (${bill.currency})`} value={amount} onChange={(e) => setAmount(e.target.value)} className="focus-ring h-10 w-32 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} loading={saving} fullWidth>Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
