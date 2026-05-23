import { useState } from 'react';
import type { AssetDTO, LiabilityDTO, LiabilityType } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LIABILITY_OPTIONS } from '@/lib/financeMeta';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import {
  useLiabilityMutations,
  usePayDownLiability,
  useUpdateLiability,
} from '@/lib/finances';
import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface Props {
  liabilities: LiabilityDTO[];
  assets: AssetDTO[];
  baseCurrency: string;
}

const emojiFor = (t: string) => LIABILITY_OPTIONS.find((o) => o.value === t)?.emoji ?? '💳';
const labelFor = (t: string) => LIABILITY_OPTIONS.find((o) => o.value === t)?.label ?? t;

/** Debts (liabilities) — list with pay-down + edit (outstanding/monthly) + delete + add. */
export function DebtsSection({ liabilities, assets, baseCurrency }: Props) {
  const { create, remove } = useLiabilityMutations();
  const update = useUpdateLiability();
  const payDown = usePayDownLiability();
  const [adding, setAdding] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`Remove "${name}"?`)) return;
    await remove.mutateAsync(id);
    notify.custom('Debt removed', { tone: 'info', icon: '🗑️', sound: 'tap' });
  }

  return (
    <Card padded>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-ink">Debts & loans</h2>
        <button onClick={() => setAdding((v) => !v)} className="focus-ring rounded-full px-3 py-1 text-sm font-semibold text-primary">
          {adding ? 'Close' : '+ Add debt'}
        </button>
      </div>

      {adding && (
        <AddDebtForm
          baseCurrency={baseCurrency}
          onCancel={() => setAdding(false)}
          saving={create.isPending}
          onSubmit={async (payload) => {
            try {
              await create.mutateAsync(payload);
              notify.custom('Debt added', { tone: 'success', icon: '💳', sound: 'save' });
              setAdding(false);
            } catch (err) {
              notify.error(getErrorMessage(err, 'Could not add debt'));
            }
          }}
        />
      )}

      {(!liabilities || liabilities.length === 0) ? (
        <p className="mt-3 text-sm text-ink-soft">No debts. Nice — keep it that way 🎉</p>
      ) : (
        <div className="mt-2">
          {liabilities.map((l) => {
            const sameCurAssets = assets.filter((a) => a.currency === l.currency);
            return (
              <div key={l.id} className="border-b border-muted-border last:border-b-0 py-2">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-danger/10 text-lg" aria-hidden>
                    {emojiFor(l.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{l.name}</p>
                    <p className="text-[11px] text-ink-soft">
                      {labelFor(l.type)} · {formatCurrency(l.monthlyPayment, l.currency)}/mo
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-danger">
                      −{formatCurrency(l.outstandingAmount, l.currency)}
                    </p>
                    {l.currency !== baseCurrency && (
                      <p className="text-[11px] text-ink-soft">
                        ≈ {formatCurrency(l.baseCurrencyOutstandingAmount, baseCurrency)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-end gap-2 pl-13 text-xs">
                  <button
                    onClick={() => { setPayingId(payingId === l.id ? null : l.id); setEditingId(null); }}
                    className="focus-ring rounded-full bg-success/10 px-2.5 py-0.5 font-semibold text-success"
                  >
                    💸 Pay down
                  </button>
                  <button
                    onClick={() => { setEditingId(editingId === l.id ? null : l.id); setPayingId(null); }}
                    className="focus-ring rounded-full px-2 py-0.5 font-medium text-ink-soft hover:text-primary"
                  >
                    ✏️
                  </button>
                  <button onClick={() => onDelete(l.id, l.name)} className="focus-ring rounded-full px-2 py-0.5 font-medium text-ink-soft hover:text-danger">
                    🗑️
                  </button>
                </div>

                {payingId === l.id && (
                  <PayDownInline
                    liability={l}
                    sameCurAssets={sameCurAssets}
                    saving={payDown.isPending}
                    onCancel={() => setPayingId(null)}
                    onSubmit={async (amount, fromAssetId) => {
                      try {
                        await payDown.mutateAsync({ id: l.id, amount, fromAssetId });
                        notify.custom(`Paid ${formatCurrency(amount, l.currency)}`, { tone: 'success', icon: '💸', sound: 'coin' });
                        setPayingId(null);
                      } catch (err) {
                        notify.error(getErrorMessage(err, 'Could not record payment'));
                      }
                    }}
                  />
                )}

                {editingId === l.id && (
                  <EditDebtInline
                    liability={l}
                    saving={update.isPending}
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (patch) => {
                      try {
                        await update.mutateAsync({ id: l.id, ...patch });
                        notify.custom('Debt updated', { tone: 'success', icon: '✅', sound: 'save' });
                        setEditingId(null);
                      } catch (err) {
                        notify.error(getErrorMessage(err, 'Could not update'));
                      }
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function AddDebtForm({ baseCurrency, onCancel, onSubmit, saving }: {
  baseCurrency: string;
  onCancel: () => void;
  onSubmit: (p: { type: LiabilityType; name: string; outstandingAmount: number; monthlyPayment: number; currency: string }) => Promise<void>;
  saving?: boolean;
}) {
  const [type, setType] = useState<LiabilityType>(LIABILITY_OPTIONS[0].value as LiabilityType);
  const [name, setName] = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [monthly, setMonthly] = useState('');
  const [currency, setCurrency] = useState(baseCurrency);

  async function submit() {
    const o = Number(outstanding);
    const m = Number(monthly);
    if (!name.trim() || !Number.isFinite(o) || o <= 0 || !Number.isFinite(m) || m < 0) {
      notify.error('Enter a name, outstanding amount, and monthly payment');
      return;
    }
    await onSubmit({ type, name: name.trim(), outstandingAmount: o, monthlyPayment: m, currency });
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-background p-3">
      <div className="flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as LiabilityType)} className="focus-ring h-11 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
          {LIABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
        </select>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="focus-ring h-11 w-24 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
          {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
        </select>
      </div>
      <input type="text" placeholder="Name (e.g. HDFC Home Loan)" value={name} onChange={(e) => setName(e.target.value)} className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      <div className="flex gap-2">
        <input type="number" inputMode="decimal" placeholder={`Outstanding (${currency})`} value={outstanding} onChange={(e) => setOutstanding(e.target.value)} className="focus-ring h-11 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
        <input type="number" inputMode="decimal" placeholder={`Monthly (${currency})`} value={monthly} onChange={(e) => setMonthly(e.target.value)} className="focus-ring h-11 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      </div>
      <div className="flex gap-2">
        <Button onClick={submit} loading={saving} fullWidth>Add</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function PayDownInline({ liability, sameCurAssets, onCancel, onSubmit, saving }: {
  liability: LiabilityDTO;
  sameCurAssets: AssetDTO[];
  onCancel: () => void;
  onSubmit: (amount: number, fromAssetId: string | null) => Promise<void>;
  saving?: boolean;
}) {
  const [amount, setAmount] = useState(String(liability.monthlyPayment || ''));
  const [fromAssetId, setFromAssetId] = useState<string>('');

  return (
    <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-success/5 p-3">
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          placeholder={`Amount (${liability.currency})`}
          value={amount}
          autoFocus
          onChange={(e) => setAmount(e.target.value)}
          className="focus-ring h-10 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
        />
        {sameCurAssets.length > 0 && (
          <select
            value={fromAssetId}
            onChange={(e) => setFromAssetId(e.target.value)}
            className="focus-ring h-10 flex-1 rounded-2xl border border-muted-border bg-surface px-2 text-xs"
          >
            <option value="">From: external</option>
            {sameCurAssets.map((a) => (
              <option key={a.id} value={a.id}>From: {a.name}</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => { const n = Number(amount); if (n > 0) void onSubmit(n, fromAssetId || null); }}
          loading={saving}
          fullWidth
        >
          💸 Record payment
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>✕</Button>
      </div>
      <p className="text-[11px] text-ink-soft">
        {fromAssetId
          ? 'We’ll also deduct this from the chosen account.'
          : 'This only reduces the debt — pick an account above if it was paid from one.'}
      </p>
    </div>
  );
}

function EditDebtInline({ liability, onCancel, onSubmit, saving }: {
  liability: LiabilityDTO;
  onCancel: () => void;
  onSubmit: (patch: { name?: string; outstandingAmount?: number; monthlyPayment?: number }) => Promise<void>;
  saving?: boolean;
}) {
  const [name, setName] = useState(liability.name);
  const [outstanding, setOutstanding] = useState(String(liability.outstandingAmount));
  const [monthly, setMonthly] = useState(String(liability.monthlyPayment));

  async function submit() {
    const o = Number(outstanding);
    const m = Number(monthly);
    if (!name.trim() || !Number.isFinite(o) || o < 0 || !Number.isFinite(m) || m < 0) {
      notify.error('Enter valid amounts');
      return;
    }
    await onSubmit({ name: name.trim(), outstandingAmount: o, monthlyPayment: m });
  }

  return (
    <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-background p-3">
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="focus-ring h-10 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      <div className="flex gap-2">
        <input type="number" inputMode="decimal" placeholder={`Outstanding (${liability.currency})`} value={outstanding} onChange={(e) => setOutstanding(e.target.value)} className="focus-ring h-10 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
        <input type="number" inputMode="decimal" placeholder={`Monthly (${liability.currency})`} value={monthly} onChange={(e) => setMonthly(e.target.value)} className="focus-ring h-10 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} loading={saving} fullWidth>Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
