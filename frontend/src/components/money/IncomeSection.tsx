import { useMemo, useState } from 'react';
import type { AssetDTO, IncomeDTO, IncomeType } from '@fiviko/shared';
import { Frequency } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { INCOME_OPTIONS } from '@/lib/financeMeta';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import {
  useIncomeMutations,
  useLogIncomeReceipt,
  useRestoreIncome,
  useUpdateIncome,
} from '@/lib/finances';
import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { undoableDelete } from '@/lib/undoable';

interface Props {
  incomes: IncomeDTO[];
  assets: AssetDTO[];
  baseCurrency: string;
}

const emojiFor = (t: string) => INCOME_OPTIONS.find((o) => o.value === t)?.emoji ?? '💰';
const typeLabel = (t: string) => INCOME_OPTIONS.find((o) => o.value === t)?.label ?? t;

function previousMonthKey(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Income — list with name + per-row deposit-into-any-account + actual receipt
 * logging (for variable-pay months) + undoable delete + add.
 *
 * Cross-currency auto-deposit is allowed: the cron converts at credit time
 * using the latest FX rate. The selector here lists every account, not just
 * same-currency ones, to support flows like "USD freelance → INR account".
 */
export function IncomeSection({ incomes, assets, baseCurrency }: Props) {
  const { create, remove } = useIncomeMutations();
  const update = useUpdateIncome();
  const restore = useRestoreIncome();
  const logReceipt = useLogIncomeReceipt();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loggingId, setLoggingId] = useState<string | null>(null);

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
          {incomes.map((i) => (
            <IncomeRow
              key={i.id}
              income={i}
              assets={assets}
              baseCurrency={baseCurrency}
              isEditing={editingId === i.id}
              isLogging={loggingId === i.id}
              onEdit={() => { setEditingId(editingId === i.id ? null : i.id); setLoggingId(null); }}
              onLog={() => { setLoggingId(loggingId === i.id ? null : i.id); setEditingId(null); }}
              onSetDepositTarget={(assetId) => setDepositTarget(i, assetId)}
              onDelete={() => undoableDelete({
                thing: 'Income',
                doDelete: () => remove.mutateAsync(i.id),
                doRestore: () => restore.mutateAsync(i.id),
              })}
              onSaveEdit={async (patch) => {
                try {
                  await update.mutateAsync({ id: i.id, ...patch });
                  notify.custom('Income updated', { tone: 'success', icon: '✅', sound: 'save' });
                  setEditingId(null);
                } catch (err) {
                  notify.error(getErrorMessage(err, 'Could not update'));
                }
              }}
              onLogReceipt={async (periodKey, amount, note) => {
                try {
                  await logReceipt.mutateAsync({ incomeId: i.id, periodKey, amount, note });
                  notify.custom(
                    `Logged ${formatCurrency(amount, i.currency)} for ${periodKey}`,
                    { tone: 'success', icon: '📝', sound: 'coin' },
                  );
                  setLoggingId(null);
                } catch (err) {
                  notify.error(getErrorMessage(err, 'Could not log receipt'));
                }
              }}
              savingEdit={update.isPending}
              savingReceipt={logReceipt.isPending}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function IncomeRow({
  income,
  assets,
  baseCurrency,
  isEditing,
  isLogging,
  onEdit,
  onLog,
  onSetDepositTarget,
  onDelete,
  onSaveEdit,
  onLogReceipt,
  savingEdit,
  savingReceipt,
}: {
  income: IncomeDTO;
  assets: AssetDTO[];
  baseCurrency: string;
  isEditing: boolean;
  isLogging: boolean;
  onEdit: () => void;
  onLog: () => void;
  onSetDepositTarget: (assetId: string | null) => void;
  onDelete: () => void;
  onSaveEdit: (patch: { type?: IncomeType; name?: string | null; amount?: number }) => Promise<void>;
  onLogReceipt: (periodKey: string, amount: number, note?: string | null) => Promise<void>;
  savingEdit?: boolean;
  savingReceipt?: boolean;
}) {
  const target = assets.find((a) => a.id === income.depositToAssetId);
  const displayName = income.name?.trim() || typeLabel(income.type);
  const latest = income.latestReceipt;

  return (
    <div className="border-b border-muted-border last:border-b-0 py-2">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-success/10 text-lg" aria-hidden>
          {emojiFor(income.type)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{displayName}</p>
          <p className="text-[11px] text-ink-soft">
            {typeLabel(income.type)} · {income.frequency.toLowerCase()}
            {target && ` · 🏦 ${target.name}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-success">
            +{formatCurrency(income.amount, income.currency)}
          </p>
          {income.currency !== baseCurrency && (
            <p className="text-[11px] text-ink-soft">
              ≈ {formatCurrency(income.baseCurrencyAmount, baseCurrency)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 pl-13 text-xs">
        {assets.length > 0 ? (
          <label className="inline-flex items-center gap-1.5 text-ink-soft">
            <span>🏦 Deposit into</span>
            <select
              value={income.depositToAssetId ?? ''}
              onChange={(e) => onSetDepositTarget(e.target.value || null)}
              className="focus-ring h-7 max-w-[180px] rounded-full border border-muted-border bg-surface px-2 text-xs font-semibold text-ink"
            >
              <option value="">— off —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.currency !== income.currency ? ` (${a.currency}, FX)` : ''}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="text-[11px] text-ink-soft">Add an account to enable auto-deposit</span>
        )}
        <div className="flex items-center gap-2">
          <button onClick={onLog} className="focus-ring rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
            📝 Log actual
          </button>
          <button onClick={onEdit} className="focus-ring rounded-full px-2 py-0.5 font-medium text-ink-soft hover:text-primary">
            ✏️
          </button>
          <button onClick={onDelete} className="focus-ring rounded-full px-2 py-0.5 font-medium text-ink-soft hover:text-danger">
            🗑️
          </button>
        </div>
      </div>

      {(latest || income.lastDepositedMonth) && (
        <p className="pl-13 text-[10px] text-ink-soft">
          {latest && (
            <>
              {latest.source === 'manual' ? 'Actual' : 'Modelled'}: {formatCurrency(latest.amount, latest.currency)} for {latest.periodKey}
            </>
          )}
          {latest && income.lastDepositedMonth && ' · '}
          {income.lastDepositedMonth && <>Last auto-credit: {income.lastDepositedMonth}</>}
        </p>
      )}

      {isEditing && (
        <EditIncomeInline
          income={income}
          saving={savingEdit}
          onCancel={onEdit}
          onSubmit={onSaveEdit}
        />
      )}

      {isLogging && (
        <LogReceiptInline
          income={income}
          saving={savingReceipt}
          onCancel={onLog}
          onSubmit={onLogReceipt}
        />
      )}
    </div>
  );
}

function AddIncomeForm({ baseCurrency, assets, onCancel, onSubmit, saving }: {
  baseCurrency: string;
  assets: AssetDTO[];
  onCancel: () => void;
  onSubmit: (p: { type: IncomeType; name: string | null; amount: number; currency: string; frequency: Frequency; depositToAssetId: string | null }) => Promise<void>;
  saving?: boolean;
}) {
  const [type, setType] = useState<IncomeType>(INCOME_OPTIONS[0].value as IncomeType);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(baseCurrency);
  const [depositToAssetId, setDepositToAssetId] = useState<string>('');

  async function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      notify.error('Enter a positive amount');
      return;
    }
    await onSubmit({
      type,
      name: name.trim() ? name.trim() : null,
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
      <input
        type="text"
        placeholder="Name (e.g. Flink Berlin, Acme freelance)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
      />
      <input type="number" inputMode="decimal" placeholder={`Monthly amount (${currency})`} value={amount} onChange={(e) => setAmount(e.target.value)} className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      {assets.length > 0 && (
        <select
          value={depositToAssetId}
          onChange={(e) => setDepositToAssetId(e.target.value)}
          className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
        >
          <option value="">🏦 Auto-deposit: off</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              🏦 Auto-deposit into {a.name}{a.currency !== currency ? ` (${a.currency}, FX at credit)` : ''}
            </option>
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
  onSubmit: (patch: { type?: IncomeType; name?: string | null; amount?: number }) => Promise<void>;
  saving?: boolean;
}) {
  const [type, setType] = useState<IncomeType>(income.type);
  const [name, setName] = useState(income.name ?? '');
  const [amount, setAmount] = useState(String(income.amount));

  async function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      notify.error('Enter a positive amount');
      return;
    }
    await onSubmit({ type, name: name.trim() ? name.trim() : null, amount: n });
  }

  return (
    <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-background p-3">
      <div className="flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as IncomeType)} className="focus-ring h-10 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
          {INCOME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
        </select>
        <input type="number" inputMode="decimal" placeholder={`Amount (${income.currency})`} value={amount} onChange={(e) => setAmount(e.target.value)} className="focus-ring h-10 w-32 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      </div>
      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        maxLength={80}
        onChange={(e) => setName(e.target.value)}
        className="focus-ring h-10 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} loading={saving} fullWidth>Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function LogReceiptInline({ income, onCancel, onSubmit, saving }: {
  income: IncomeDTO;
  onCancel: () => void;
  onSubmit: (periodKey: string, amount: number, note?: string | null) => Promise<void>;
  saving?: boolean;
}) {
  const monthOptions = useMemo(() => {
    // Offer the last 6 months (newest first) — usually you log "last month".
    const out: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      out.push({ key, label });
    }
    return out;
  }, []);

  const [periodKey, setPeriodKey] = useState(previousMonthKey());
  const [amount, setAmount] = useState(String(income.amount));
  const [note, setNote] = useState('');

  async function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 0) {
      notify.error('Enter a non-negative amount');
      return;
    }
    await onSubmit(periodKey, n, note.trim() || null);
  }

  return (
    <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-primary/5 p-3">
      <p className="text-[11px] text-ink-soft">
        Log what you actually received in this period — the auto-deposit will use it next time it runs.
      </p>
      <div className="flex gap-2">
        <select
          value={periodKey}
          onChange={(e) => setPeriodKey(e.target.value)}
          className="focus-ring h-10 w-36 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
        >
          {monthOptions.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
        <input
          type="number"
          inputMode="decimal"
          placeholder={`Actual (${income.currency})`}
          value={amount}
          autoFocus
          onChange={(e) => setAmount(e.target.value)}
          className="focus-ring h-10 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
        />
      </div>
      <input
        type="text"
        placeholder="Note (e.g. fewer trips this month)"
        value={note}
        maxLength={120}
        onChange={(e) => setNote(e.target.value)}
        className="focus-ring h-10 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} loading={saving} fullWidth>📝 Log</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
