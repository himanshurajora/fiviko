import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CountUp } from '@/components/ui/CountUp';
import { AssetRowEditor } from '@/components/tracker/AssetRowEditor';
import { useAssets, useLiabilities, useNetWorthHistory, useSetAssetBalance, useSnapshotNetWorth, type NetWorthGranularity } from '@/lib/finances';
import { useFinancialSummary } from '@/lib/queries';
import { useAuth } from '@/store/auth';
import { formatCurrency } from '@/lib/format';
import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';

/**
 * The main day-to-day tracking surface: see your live net worth (in base
 * currency), update each account in seconds, and view the trend at any
 * granularity. Built for under-30-seconds-a-day usage.
 */
export function NetWorthTracker() {
  const user = useAuth((s) => s.user);
  const baseCurrency = user?.baseCurrency ?? 'USD';

  const { data: summary } = useFinancialSummary();
  const { data: assets } = useAssets();
  const { data: liabilities } = useLiabilities();
  const setBalance = useSetAssetBalance();
  const snapshot = useSnapshotNetWorth();

  const [granularity, setGranularity] = useState<NetWorthGranularity>('M');
  const { data: history } = useNetWorthHistory(granularity);

  // Per-asset live-base contribution; merged with assets to give a real-time total.
  const [liveByAsset, setLiveByAsset] = useState<Record<string, number>>({});

  // Build a currency → base-rate map from the asset list itself (each asset
  // carries its baseCurrencyAmount cached from the server's latest rates).
  const rateMap = useMemo(() => {
    const m = new Map<string, number>([[baseCurrency, 1]]);
    for (const a of assets ?? []) {
      if (!m.has(a.currency) && a.amount > 0) m.set(a.currency, a.baseCurrencyAmount / a.amount);
    }
    return m;
  }, [assets, baseCurrency]);

  // Live net worth as you type: sum of (live or current) per-asset base values,
  // minus the latest liabilities total (which the user can edit in Settings).
  const liveAssetsTotal = (assets ?? []).reduce((s, a) => s + (liveByAsset[a.id] ?? a.baseCurrencyAmount), 0);
  const liveLiabTotal = summary?.totalLiabilities ?? 0;
  const liveNetWorth = liveAssetsTotal - liveLiabTotal;

  async function commitBalance(id: string, amount: number) {
    try {
      await setBalance.mutateAsync({ id, amount });
      notify.custom('Updated', { tone: 'success', icon: '✅', sound: 'save' });
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not update'));
    }
  }

  async function saveSnapshot() {
    try {
      await snapshot.mutateAsync();
      notify.custom('Snapshot saved 📸', { tone: 'success', icon: '📸', sound: 'success' });
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not save snapshot'));
    }
  }

  const lastSyncedNote = summary
    ? `${formatCurrency(summary.totalAssets, baseCurrency)} assets · ${formatCurrency(summary.totalLiabilities, baseCurrency)} debts · live FX`
    : null;

  const chartData = (history ?? []).map((p) => ({ label: chartLabel(p.date, granularity), value: p.netWorth }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink md:text-3xl">Net worth</h1>
      </header>

      {/* Live total */}
      <Card padded className="bg-gradient-primary text-white">
        <p className="text-sm text-white/80">Your net worth ({baseCurrency})</p>
        <p className="mt-1 text-4xl font-extrabold leading-none">
          <CountUp value={liveNetWorth} format={(n) => formatCurrency(n, baseCurrency)} />
        </p>
        {lastSyncedNote && <p className="mt-2 text-xs text-white/80">{lastSyncedNote}</p>}
      </Card>

      {/* History chart with granularity toggle */}
      <Card padded>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">Trend</h2>
          <div className="inline-flex rounded-2xl bg-background p-0.5 text-xs font-bold">
            {(['D', 'W', 'M', 'Y', 'ALL'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`focus-ring rounded-xl px-2.5 py-1 transition ${granularity === g ? 'bg-primary text-white' : 'text-ink-soft'}`}
              >
                {g === 'ALL' ? 'All' : g}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="nw-trk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0FA" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#6B7280" />
              <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#6B7280" width={48}
                tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
              <Tooltip formatter={(v: number) => [formatCurrency(v, baseCurrency), 'Net worth']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB' }} />
              <Area type="monotone" dataKey="value" stroke="#6C63FF" strokeWidth={2.5} fill="url(#nw-trk)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Editable balances */}
      <Card padded>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">Accounts</h2>
          <Link to="/app/profile" className="focus-ring text-sm font-semibold text-primary">+ Add</Link>
        </div>
        {(!assets || assets.length === 0) ? (
          <p className="mt-3 text-sm text-ink-soft">
            No accounts yet. <Link to="/app/profile" className="font-semibold text-primary">Add some in Settings →</Link>
          </p>
        ) : (
          <div className="mt-2">
            {assets.map((a) => (
              <AssetRowEditor
                key={a.id}
                asset={a}
                baseCurrency={baseCurrency}
                rateToBase={rateMap.get(a.currency) ?? 1}
                onLiveChange={(id, base) => setLiveByAsset((prev) => (prev[id] === base ? prev : { ...prev, [id]: base }))}
                onCommit={commitBalance}
                saving={setBalance.isPending}
              />
            ))}
          </div>
        )}

        {liabilities && liabilities.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-danger/5 px-3 py-2 text-sm">
            <span className="text-ink-soft">Debts ({liabilities.length})</span>
            <span className="font-bold text-danger">−{formatCurrency(liveLiabTotal, baseCurrency)}</span>
          </div>
        )}

        <Button size="lg" fullWidth className="mt-4" loading={snapshot.isPending} onClick={saveSnapshot}>
          📸 Save today’s snapshot
        </Button>
      </Card>

      <p className="px-2 text-center text-[11px] leading-relaxed text-ink-soft">
        All amounts shown in {baseCurrency}, converted from native currencies using the latest exchange rates.
      </p>
    </div>
  );
}

function chartLabel(date: string, g: NetWorthGranularity): string {
  // Date keys are YYYY-MM-DD (some are ISO-week buckets like 2026-W22, but the
  // service emits real dates in the entries; we use the entry's full date here).
  const d = new Date(date.length === 10 ? date : `${date}-01`);
  if (g === 'D') return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  if (g === 'W') return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  if (g === 'M') return d.toLocaleDateString(undefined, { month: 'short' });
  if (g === 'Y') return String(d.getFullYear());
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}
