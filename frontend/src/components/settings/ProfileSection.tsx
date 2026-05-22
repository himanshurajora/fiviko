import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { notify } from '@/store/toast';

export interface ProfileItem {
  id: string;
  title: string;
  subtitle?: string;
  amount: number;
  currency: string;
}

export interface AddFormValue {
  key: string;
  name: string;
  amount: number;
  amount2: number;
}

interface ProfileSectionProps {
  title: string;
  emoji: string;
  items: ProfileItem[];
  options: { value: string; label: string; emoji?: string }[];
  hasName?: boolean;
  amountLabel: string;
  secondAmountLabel?: string;
  baseCurrency: string;
  onAdd: (value: AddFormValue) => Promise<void> | void;
  onDelete: (id: string) => void;
  adding?: boolean;
}

/** A settings card listing financial-profile items with an inline add form. */
export function ProfileSection({
  title, emoji, items, options, hasName, amountLabel, secondAmountLabel, baseCurrency, onAdd, onDelete, adding,
}: ProfileSectionProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AddFormValue>({ key: options[0].value, name: '', amount: 0, amount2: 0 });

  async function submit() {
    if (form.amount <= 0 && form.amount2 <= 0) return;
    await onAdd(form);
    notify.custom(`${title} saved`, { tone: 'success', icon: '✅', sound: 'save' });
    setForm({ key: options[0].value, name: '', amount: 0, amount2: 0 });
    setOpen(false);
  }

  function remove(id: string) {
    onDelete(id);
    notify.custom('Removed', { tone: 'info', icon: '🗑️', sound: 'tap' });
  }

  return (
    <Card padded animate={false}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold text-ink">
          <span aria-hidden>{emoji}</span> {title}
        </h2>
        <button onClick={() => setOpen((o) => !o)} className="focus-ring rounded-full px-3 py-1 text-sm font-semibold text-primary">
          {open ? 'Close' : '+ Add'}
        </button>
      </div>

      {items.length === 0 && !open && <p className="mt-2 text-sm text-ink-soft">Nothing added yet.</p>}

      {items.length > 0 && (
        <ul className="mt-3 divide-y divide-muted-border">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{it.title}</p>
                {it.subtitle && <p className="text-xs text-ink-soft">{it.subtitle}</p>}
              </div>
              <span className="shrink-0 font-bold text-ink">{formatCurrency(it.amount, it.currency)}</span>
              <button onClick={() => remove(it.id)} className="focus-ring shrink-0 rounded-full p-1 text-ink-soft hover:text-danger" aria-label={`Delete ${it.title}`}>
                🗑️
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-background p-3">
          <select value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
            className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
            {options.map((o) => <option key={o.value} value={o.value}>{o.emoji ? `${o.emoji} ` : ''}{o.label}</option>)}
          </select>
          {hasName && (
            <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
          )}
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="mb-1 block text-xs text-ink-soft">{amountLabel} ({baseCurrency})</span>
              <input type="number" inputMode="decimal" value={form.amount || ''} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                className="focus-ring h-11 w-full rounded-2xl border border-muted-border bg-surface px-3 text-base font-semibold" />
            </label>
            {secondAmountLabel && (
              <label className="flex-1">
                <span className="mb-1 block text-xs text-ink-soft">{secondAmountLabel} ({baseCurrency})</span>
                <input type="number" inputMode="decimal" value={form.amount2 || ''} onChange={(e) => setForm((f) => ({ ...f, amount2: Number(e.target.value) }))}
                  className="focus-ring h-11 w-full rounded-2xl border border-muted-border bg-surface px-3 text-base font-semibold" />
              </label>
            )}
          </div>
          <Button size="sm" onClick={submit} loading={adding}>Add</Button>
        </div>
      )}
    </Card>
  );
}
