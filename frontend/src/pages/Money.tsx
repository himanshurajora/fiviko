import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CountUp } from '@/components/ui/CountUp';
import { AccountsSection } from '@/components/money/AccountsSection';
import { DebtsSection } from '@/components/money/DebtsSection';
import { IncomeSection } from '@/components/money/IncomeSection';
import { BillsSection } from '@/components/money/BillsSection';
import {
  useAssets,
  useIncomes,
  useLiabilities,
  useMandatoryExpenses,
  useNetWorthHistory,
  useSnapshotNetWorth,
  type NetWorthGranularity,
} from '@/lib/finances';
import { useFinancialSummary } from '@/lib/queries';
import { useAuth } from '@/store/auth';
import { formatCurrency } from '@/lib/format';
import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';

/**
 * Money hub — one screen to manage everything the user owns, owes, earns and
 * pays. The "Net worth" tab evolved from a read-mostly tracker into the full
 * money-management surface, so all finance CRUD lives here (not in Settings).
 *
 * Reads stay live: balances convert through the latest FX rates on every render,
 * and the trend reflects daily snapshots so even no-activity days show drift.
 */
export function Money() {
  const user = useAuth((s) => s.user);
  const baseCurrency = user?.baseCurrency ?? 'USD';

  const { data: summary } = useFinancialSummary();
  const { data: assets } = useAssets();
  const { data: liabilities } = useLiabilities();
  const { data: incomes } = useIncomes();
  const { data: bills } = useMandatoryExpenses();
  const snapshot = useSnapshotNetWorth();

  const [granularity, setGranularity] = useState<NetWorthGranularity>('M');
  const { data: history } = useNetWorthHistory(granularity);

  // Optimistic per-asset base contribution so the live total reflects typing
  // in the accounts section before the server round-trips.
  const [liveByAsset, setLiveByAsset] = useState<Record<string, number>>({});

  const rateMap = useMemo(() => {
    const m = new Map<string, number>([[baseCurrency, 1]]);
    for (const a of assets ?? []) {
      if (!m.has(a.currency) && a.amount > 0) m.set(a.currency, a.baseCurrencyAmount / a.amount);
    }
    return m;
  }, [assets, baseCurrency]);

  const liveAssetsTotal = (assets ?? []).reduce((s, a) => s + (liveByAsset[a.id] ?? a.baseCurrencyAmount), 0);
  const liveLiabTotal = summary?.totalLiabilities ?? 0;
  const liveNetWorth = liveAssetsTotal - liveLiabTotal;

  async function saveSnapshot() {
    try {
      await snapshot.mutateAsync();
      notify.custom('Snapshot saved 📸', { tone: 'success', icon: '📸', sound: 'success' });
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not save snapshot'));
    }
  }

  const chartData = (history ?? []).map((p) => ({ label: chartLabel(p.date, granularity), value: p.netWorth }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink md:text-3xl">My money</h1>
          <p className="text-xs text-ink-soft">Everything you own, owe, earn and pay — all in {baseCurrency}, live FX.</p>
        </div>
      </header>

      {/* Live total */}
      <Card padded className="bg-gradient-primary text-white">
        <p className="text-sm text-white/80">Net worth</p>
        <p className="mt-1 text-4xl font-extrabold leading-none">
          <CountUp value={liveNetWorth} format={(n) => formatCurrency(n, baseCurrency)} />
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-white/70">Assets</p>
            <p className="font-bold">{formatCurrency(liveAssetsTotal, baseCurrency)}</p>
          </div>
          <div>
            <p className="text-white/70">Debts</p>
            <p className="font-bold">−{formatCurrency(liveLiabTotal, baseCurrency)}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="mt-3 !bg-white/15 !text-white hover:!bg-white/25"
          loading={snapshot.isPending}
          onClick={saveSnapshot}
        >
          📸 Save today’s snapshot
        </Button>
      </Card>

      {/* Trend */}
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
                <linearGradient id="nw-money" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0FA" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#6B7280" />
              <YAxis
                tickLine={false} axisLine={false} fontSize={11} stroke="#6B7280" width={48}
                tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
              />
              <Tooltip formatter={(v: number) => [formatCurrency(v, baseCurrency), 'Net worth']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB' }} />
              <Area type="monotone" dataKey="value" stroke="#6C63FF" strokeWidth={2.5} fill="url(#nw-money)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <AccountsSection
        assets={assets ?? []}
        baseCurrency={baseCurrency}
        rateMap={rateMap}
        onLiveChange={(id, base) => setLiveByAsset((prev) => (prev[id] === base ? prev : { ...prev, [id]: base }))}
      />

      <DebtsSection
        liabilities={liabilities ?? []}
        assets={assets ?? []}
        baseCurrency={baseCurrency}
      />

      <IncomeSection
        incomes={incomes ?? []}
        assets={assets ?? []}
        baseCurrency={baseCurrency}
      />

      <BillsSection
        bills={bills ?? []}
        baseCurrency={baseCurrency}
      />

      <p className="px-2 text-center text-[11px] leading-relaxed text-ink-soft">
        All totals in {baseCurrency}, converted from native currencies using the latest exchange rates.
      </p>
    </div>
  );
}

function chartLabel(date: string, g: NetWorthGranularity): string {
  const d = new Date(date.length === 10 ? date : `${date}-01`);
  if (g === 'D') return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  if (g === 'W') return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  if (g === 'M') return d.toLocaleDateString(undefined, { month: 'short' });
  if (g === 'Y') return String(d.getFullYear());
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}
