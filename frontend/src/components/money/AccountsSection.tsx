import { useState } from 'react';
import type { AssetDTO, AssetType, LiquidityType } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AssetRowEditor } from '@/components/tracker/AssetRowEditor';
import { ASSET_LIQUIDITY, ASSET_OPTIONS } from '@/lib/financeMeta';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import {
  useAssetMutations,
  useDepositToAsset,
  useRestoreAsset,
  useSetAssetBalance,
  useTransferBetweenAssets,
} from '@/lib/finances';
import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { undoableDelete } from '@/lib/undoable';

interface Props {
  assets: AssetDTO[];
  baseCurrency: string;
  rateMap: Map<string, number>;
  onLiveChange: (assetId: string, baseAmount: number) => void;
}

/** Accounts (assets) — inline balance edit + add money + transfer + add + undoable delete. */
export function AccountsSection({ assets, baseCurrency, rateMap, onLiveChange }: Props) {
  const setBalance = useSetAssetBalance();
  const deposit = useDepositToAsset();
  const transfer = useTransferBetweenAssets();
  const { create, remove } = useAssetMutations();
  const restore = useRestoreAsset();
  const [adding, setAdding] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [depositingId, setDepositingId] = useState<string | null>(null);

  async function commitBalance(id: string, amount: number) {
    try {
      await setBalance.mutateAsync({ id, amount });
      notify.custom('Updated', { tone: 'success', icon: '✅', sound: 'save' });
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not update'));
    }
  }

  return (
    <Card padded>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-ink">Accounts</h2>
        <div className="flex items-center gap-1">
          {assets && assets.length >= 2 && (
            <button
              onClick={() => { setTransferring((v) => !v); setAdding(false); }}
              className="focus-ring rounded-full px-3 py-1 text-sm font-semibold text-primary"
            >
              {transferring ? 'Close' : '⇄ Transfer'}
            </button>
          )}
          <button
            onClick={() => { setAdding((v) => !v); setTransferring(false); }}
            className="focus-ring rounded-full px-3 py-1 text-sm font-semibold text-primary"
          >
            {adding ? 'Close' : '+ Add account'}
          </button>
        </div>
      </div>

      {transferring && (
        <TransferForm
          assets={assets}
          saving={transfer.isPending}
          onCancel={() => setTransferring(false)}
          onSubmit={async ({ fromAssetId, toAssetId, amount, note }) => {
            try {
              const res = await transfer.mutateAsync({ fromAssetId, toAssetId, amount, note });
              const from = assets.find((a) => a.id === fromAssetId);
              const to = assets.find((a) => a.id === toAssetId);
              const msg = from && to && from.currency !== to.currency
                ? `Transferred ${formatCurrency(res.fromAmount, res.fromCurrency)} → ${formatCurrency(res.toAmount, res.toCurrency)} @ ${res.fxRate}`
                : `Transferred ${formatCurrency(res.fromAmount, res.fromCurrency)}`;
              notify.custom(msg, { tone: 'success', icon: '⇄', sound: 'coin' });
              setTransferring(false);
            } catch (err) {
              notify.error(getErrorMessage(err, 'Could not transfer'));
            }
          }}
        />
      )}

      {adding && (
        <AddAccountForm
          baseCurrency={baseCurrency}
          onCancel={() => setAdding(false)}
          onSubmit={async (payload) => {
            try {
              await create.mutateAsync(payload);
              notify.custom('Account added', { tone: 'success', icon: '🏦', sound: 'save' });
              setAdding(false);
            } catch (err) {
              notify.error(getErrorMessage(err, 'Could not add account'));
            }
          }}
          saving={create.isPending}
        />
      )}

      {(!assets || assets.length === 0) ? (
        <p className="mt-3 text-sm text-ink-soft">No accounts yet — add your bank, brokerage, gold, cash.</p>
      ) : (
        <div className="mt-2">
          {assets.map((a) => (
            <div key={a.id} className="border-b border-muted-border last:border-b-0">
              <AssetRowEditor
                asset={a}
                baseCurrency={baseCurrency}
                rateToBase={rateMap.get(a.currency) ?? 1}
                onLiveChange={onLiveChange}
                onCommit={commitBalance}
                saving={setBalance.isPending}
              />
              <div className="flex items-center justify-end gap-2 pb-2 pl-13 text-xs">
                <button onClick={() => setDepositingId(depositingId === a.id ? null : a.id)} className="focus-ring rounded-full bg-success/10 px-2.5 py-0.5 font-semibold text-success">
                  + Add money
                </button>
                <button
                  onClick={() => undoableDelete({
                    thing: 'Account',
                    doDelete: () => remove.mutateAsync(a.id),
                    doRestore: () => restore.mutateAsync(a.id),
                  })}
                  className="focus-ring rounded-full px-2 py-0.5 font-medium text-ink-soft hover:text-danger"
                >
                  🗑️
                </button>
              </div>
              {depositingId === a.id && (
                <DepositInline
                  currency={a.currency}
                  saving={deposit.isPending}
                  onCancel={() => setDepositingId(null)}
                  onSubmit={async (amount, note) => {
                    try {
                      await deposit.mutateAsync({ id: a.id, amount, note });
                      notify.custom(`Added ${formatCurrency(amount, a.currency)}`, { tone: 'success', icon: '💰', sound: 'coin' });
                      setDepositingId(null);
                    } catch (err) {
                      notify.error(getErrorMessage(err, 'Could not add money'));
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

function TransferForm({ assets, saving, onCancel, onSubmit }: {
  assets: AssetDTO[];
  saving?: boolean;
  onCancel: () => void;
  onSubmit: (p: { fromAssetId: string; toAssetId: string; amount: number; note: string | null }) => Promise<void>;
}) {
  const [fromAssetId, setFromAssetId] = useState<string>(assets[0]?.id ?? '');
  const [toAssetId, setToAssetId] = useState<string>(assets[1]?.id ?? assets[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const from = assets.find((a) => a.id === fromAssetId);
  const to = assets.find((a) => a.id === toAssetId);

  async function submit() {
    const n = Number(amount);
    if (!fromAssetId || !toAssetId) {
      notify.error('Pick both accounts');
      return;
    }
    if (fromAssetId === toAssetId) {
      notify.error('Pick a different destination');
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      notify.error('Enter a positive amount');
      return;
    }
    await onSubmit({ fromAssetId, toAssetId, amount: n, note: note.trim() || null });
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-primary/5 p-3">
      <div className="flex gap-2">
        <select
          value={fromAssetId}
          onChange={(e) => setFromAssetId(e.target.value)}
          className="focus-ring h-11 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
        >
          {assets.map((a) => <option key={a.id} value={a.id}>From: {a.name} ({a.currency})</option>)}
        </select>
        <span className="grid h-11 w-8 place-items-center text-lg" aria-hidden>⇄</span>
        <select
          value={toAssetId}
          onChange={(e) => setToAssetId(e.target.value)}
          className="focus-ring h-11 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
        >
          {assets.map((a) => <option key={a.id} value={a.id}>To: {a.name} ({a.currency})</option>)}
        </select>
      </div>
      <input
        type="number"
        inputMode="decimal"
        placeholder={`Amount${from ? ` (${from.currency})` : ''}`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
      />
      <input
        type="text"
        placeholder="Note (optional)"
        value={note}
        maxLength={120}
        onChange={(e) => setNote(e.target.value)}
        className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm"
      />
      {from && to && from.currency !== to.currency && (
        <p className="text-[11px] text-ink-soft">
          Cross-currency: we’ll convert at today’s rate when the transfer commits.
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={submit} loading={saving} fullWidth>⇄ Transfer</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function AddAccountForm({ baseCurrency, onCancel, onSubmit, saving }: {
  baseCurrency: string;
  onCancel: () => void;
  onSubmit: (p: { type: AssetType; name: string; amount: number; currency: string; liquidityType: LiquidityType }) => Promise<void>;
  saving?: boolean;
}) {
  const [type, setType] = useState<AssetType>(ASSET_OPTIONS[0].value as AssetType);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(baseCurrency);

  async function submit() {
    const n = Number(amount);
    if (!name.trim() || !Number.isFinite(n) || n <= 0) {
      notify.error('Enter a name and a positive starting balance');
      return;
    }
    await onSubmit({
      type,
      name: name.trim(),
      amount: n,
      currency,
      liquidityType: ASSET_LIQUIDITY[type] ?? ('SEMI_LIQUID' as LiquidityType),
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-background p-3">
      <div className="flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as AssetType)} className="focus-ring h-11 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
          {ASSET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
        </select>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="focus-ring h-11 w-24 rounded-2xl border border-muted-border bg-surface px-3 text-sm">
          {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
        </select>
      </div>
      <input type="text" placeholder="Name (e.g. Chase Checking)" value={name} onChange={(e) => setName(e.target.value)} className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      <input type="number" inputMode="decimal" placeholder={`Starting balance (${currency})`} value={amount} onChange={(e) => setAmount(e.target.value)} className="focus-ring h-11 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      <div className="flex gap-2">
        <Button onClick={submit} loading={saving} fullWidth>Add</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function DepositInline({ currency, onCancel, onSubmit, saving }: {
  currency: string;
  onCancel: () => void;
  onSubmit: (amount: number, note?: string | null) => Promise<void>;
  saving?: boolean;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  return (
    <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-success/5 p-3">
      <div className="flex gap-2">
        <input type="number" inputMode="decimal" placeholder={`Amount (${currency})`} value={amount} autoFocus onChange={(e) => setAmount(e.target.value)} className="focus-ring h-10 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
        <input type="text" placeholder="Note (optional)" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} className="focus-ring h-10 flex-1 rounded-2xl border border-muted-border bg-surface px-3 text-sm" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { const n = Number(amount); if (n > 0) void onSubmit(n, note.trim() || null); }} loading={saving} fullWidth>
          💰 Add money
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>✕</Button>
      </div>
    </div>
  );
}
