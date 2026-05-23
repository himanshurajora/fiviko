import { useState } from 'react';
import type { AssetDTO, IncomeDTO, IncomeType } from '@fiviko/shared';
import { Frequency } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { INCOME_OPTIONS } from '@/lib/financeMeta';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { useIncomeMutations, useUpdateIncome } from '@/lib/finances';
import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface Props {
  incomes: IncomeDTO[];
  assets: AssetDTO[];
  baseCurrency: string;
}

const emojiFor = (t: string) => INCOME_OPTIONS.find((o) => o.value === t)?.emoji ?? '💰';
const labelFor = (t: string) => INCOME_OPTIONS.find((o) => o.value === t)?.label ?? t;

/** Income — list with edit + monthly auto-deposit-into-account selector + delete + add. */
export function IncomeSection({ incomes, assets, baseCurrency }: Props) {
  const { create, remove } = useIncomeMutations();
  const update = useUpdateIncome();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function onDelete(id: string, label: string) {
    if (!window.confirm(`Remove "${label}"?`)) return;
    await remove.mutateAsync(id);
    notify.custom('Income removed', { tone: 'info', icon: '🗑️', sound: 'tap' });
  }

  /** Toggle auto-deposit target without opening the editor — one-tap from the row. */
  async function setDepositTarget(income: IncomeDTO, assetId: string | null) {
    try {
      await update.mutateAsync({ id: income.id, depositToAssetId: assetId });
      notify.custom(
        assetId ? 'Auto-deposit set 🏦' : 'Auto-deposit off',
        { tone: 'success', icon: assetId ? '🏦' : '✅', sound: 'save' },
      );
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not save'));
    }
  }

  return (
    <Card padded>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-ink">Income</h2>
        <button onClick={() => setAdding((v) => !v)} className="focus-ring rounded-full px-3 py-1 text-sm font-semibold text-primary">
          {adding ? 'Close' : '+ Add income'}
        </button>
      </div>

      {adding && (
        <AddIncomeForm
          baseCurrency={baseCurrency}
          assets={assets}
          onCancel={() => setAdding(false)}
          saving={create.isPending}
          onSubmit={async ({ depositToAssetId, ...payload }) => {
            try {
              const created = await create.mutateAsync(payload);
              if (depositToAssetId) {
                // Two-step because POST /incomes doesn't accept depositToAssetId.
                await update.mutateAsync({ id: created.id, depositToAssetId });
              }
              notify.custom('Income added', { tone: 'success', icon: '💼', sound: 'save' });
              setAdding(false);
            } catch (err) {
              notify.error(getErrorMessage(err, 'Could not add income'));
            }
          }}
        />
      )}

      {(!incomes || incomes.length === 0) ? (
        <p className="mt-3 text-sm text-ink-soft">No income sources yet — add your salary or side gigs.</p>
      ) : (
        <div className="mt-2">
          {incomes.map((i) => {
            const target = assets.find((a) => a.id === i.depositToAssetId);
            // Only same-currency accounts make sense as auto-deposit targets — FX on
            // each cron run would cost a conversion the user didn't see.
            const sameCurAssets = assets.filter((a) => a.currency === i.currency);
            return (
              <div key={i.id} className="border-b border-muted-border last:border-b-0 py-2">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-success/10 text-lg" aria-hidden>
                    {emojiFor(i.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{labelFor(i.type)}</p>
                    <p className="text-[11px] text-ink-soft">
                      {i.frequency.toLowerCase()}
                      {target && ` · auto-deposits into ${target.name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">
                      +{formatCurrency(i.amount, i.currency)}
                    </p>
                    {i.currency !== baseCurrency && (
                      <p className="text-[11px] text-ink-soft">
                        ≈ {formatCurrency(i.baseCurrencyAmount, baseCurrency)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 pl-13 text-xs">
                  {sameCurAssets.length > 0 ? (
                    <label className="inline-flex items-center gap-1.5 text-ink-soft">
                      <span>🏦 Deposit into</span>
                      <select
                        value={i.depositToAssetId ?? ''}
                        onChange={(e) => void setDepositTarget(i, e.target.value || null)}
                        className="focus-ring h-7 max-w-[140px] rounded-full border border-muted-border bg-surface px-2 text-xs font-semibold text-ink"
                      >
                        <option value="">— off —</option>
                        {sameCurAssets.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <span className="text-[11px] text-ink-soft">
                      Add a {i.currency} account to enable auto-deposit
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(editingId === i.id ? null : i.id)}
                      className="focus-ring rounded-full px-2 py-0.5 font-medium text-ink-soft hover:text-primary"
                    >
                      ✏️
                    </button>
                    <button onClick={() => onDelete(i.id, labelFor(i.type))} className="focus-ring rounded-full px-2 py-0.5 font-medium text-ink-soft hover:text-danger">
                      🗑️
                    </button>
                  </div>
                </div>

                {i.lastDepositedMonth && (
                  <p className="pl-13 text-[10px] text-ink-soft">
                    Last auto-credited: {i.lastDepositedMonth}
                  </p>
                )}

                {editingId === i.id && (
                  <EditIncomeInline
                    income={i}
                    saving={update.isPending}
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (patch) => {
                      try {
                        await update.mutateAsync({ id: i.id, ...patch });
                        notify.custom('Income updated', { tone: 'success', icon: '✅', sound: 'save' });
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

function AddIncomeForm({ baseCurrency, assets, onCancel, onSubmit, saving }: {
  baseCurrency: string;
  assets: AssetDTO[];
  onCancel: () => void;
  onSubmit: (p: { type: IncomeType; amount: number; currency: string; frequency: Frequency; depositToAssetId: string | null }) => Promise<void>;
  saving?: boolean;
}) {
  const [type, setType] = useState<IncomeType>(INCOME_OPTIONS[0].value as IncomeType);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(baseCurrency);
  const [depositToAssetId, setDepositToAssetId] = useState<string>('');

  const sameCurAssets = assets.filter((a) => a.currency === currency);

  async function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      notify.error('Enter a positive amount');
      return;
    }
    await onSubmit({
      type,
      amount: n,
      currency,
      frequency: Frequency.Monthly,
      depositToAssetId: depositToAssetId || null,
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-background p-3">
      <div className="flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as IncomeType)} className="focus-ring h-11 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
          {INCOME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
        </select>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="focus-ring h-11 w-24 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
          {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
        </select>
      </div>
      <input type="number" inputMode="decimal" placeholder={`Monthly amount (${currency})`} value={amount} onChange={(e) => setAmount(e.target.value)} className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      {sameCurAssets.length > 0 && (
        <select
          value={depositToAssetId}
          onChange={(e) => setDepositToAssetId(e.target.value)}
          className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
        >
          <option value="">🏦 Auto-deposit: off</option>
          {sameCurAssets.map((a) => (
            <option key={a.id} value={a.id}>🏦 Auto-deposit into {a.name}</option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <Button onClick={submit} loading={saving} fullWidth>Add</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function EditIncomeInline({ income, onCancel, onSubmit, saving }: {
  income: IncomeDTO;
  onCancel: () => void;
  onSubmit: (patch: { type?: IncomeType; amount?: number }) => Promise<void>;
  saving?: boolean;
}) {
  const [type, setType] = useState<IncomeType>(income.type);
  const [amount, setAmount] = useState(String(income.amount));

  async function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      notify.error('Enter a positive amount');
      return;
    }
    await onSubmit({ type, amount: n });
  }

  return (
    <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-background p-3">
      <div className="flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as IncomeType)} className="focus-ring h-10 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
          {INCOME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
        </select>
        <input type="number" inputMode="decimal" placeholder={`Amount (${income.currency})`} value={amount} onChange={(e) => setAmount(e.target.value)} className="focus-ring h-10 w-32 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} loading={saving} fullWidth>Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
