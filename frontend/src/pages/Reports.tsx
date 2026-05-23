import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Recommendation } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { SpendingByCategory } from '@/components/expenses/SpendingByCategory';
import { IncomeHistoryEditor } from '@/components/reports/IncomeHistoryEditor';
import { AiInsights } from '@/components/ai/AiInsights';
import { useFinancialSummary } from '@/lib/queries';
import { useExpenseTrend, useNetWorthHistory } from '@/lib/finances';
import { useMonthlySummary } from '@/lib/expenses';
import { useGoals } from '@/lib/goals';
import { formatCurrency } from '@/lib/format';
import { RECOMMENDATION_META } from '@/lib/goalMeta';

export function Reports() {
  const { data: summary } = useFinancialSummary();
  const { data: monthly } = useMonthlySummary();
  const { data: trend } = useExpenseTrend(6);
  const { data: netWorthHistory } = useNetWorthHistory('M');
  const { data: goals } = useGoals();
  const cur = summary?.baseCurrency ?? 'USD';

  const trendData = (trend ?? []).map((p) => ({
    label: new Date(`${p.month}-01`).toLocaleDateString(undefined, { month: 'short' }),
    Spent: p.total,
    Income: p.income,
  }));

  const netWorthData = (netWorthHistory ?? []).map((p) => ({
    label: new Date(p.date).toLocaleDateString(undefined, { month: 'short' }),
    'Net worth': p.netWorth,
  }));

  const activeGoals = (goals ?? []).filter((g) => g.status === 'ACTIVE');
  const warnings = buildWarnings(summary, monthly, goals ?? []);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <h1 className="text-2xl font-extrabold text-ink md:text-3xl">Monthly report</h1>

      {/* AI money coach (report, tips, Q&A) */}
      <AiInsights />

      {/* Net worth snapshot */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Net worth" icon="💎" value={formatCurrency(summary.netWorth, cur)} />
          <StatCard label="Total assets" icon="🏦" value={formatCurrency(summary.totalAssets, cur)} />
          <StatCard label="Liabilities" icon="💳" value={formatCurrency(summary.totalLiabilities, cur)} />
          <StatCard label="Monthly surplus" icon="📈" tone={summary.monthlySurplus >= 0 ? 'success' : 'danger'} value={formatCurrency(summary.monthlySurplus, cur)} />
        </div>
      )}

      {/* Warning summary */}
      {warnings.length > 0 && (
        <Card padded className="bg-warning/10">
          <h3 className="flex items-center gap-2 font-bold text-ink"><span aria-hidden>⚠️</span> Things to watch</h3>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {warnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </Card>
      )}

      {/* Income vs spending trend */}
      <Card padded>
        <h3 className="font-bold text-ink">Income vs spending</h3>
        <p className="text-sm text-ink-soft">Last {trendData.length} months</p>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0FA" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#6B7280" />
              <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#6B7280" width={48}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
              <Tooltip
                cursor={{ fill: 'rgba(108,99,255,0.08)' }}
                formatter={(v: number, name) => [formatCurrency(v, cur), name]}
                contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Income" radius={[8, 8, 0, 0]} fill="#00C2A8" />
              <Bar dataKey="Spent" radius={[8, 8, 0, 0]} fill="#6C63FF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Net-worth trend */}
      <Card padded>
        <h3 className="font-bold text-ink">Net worth over time</h3>
        <p className="text-sm text-ink-soft">Snapshotted monthly</p>
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netWorthData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0FA" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#6B7280" />
              <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#6B7280" width={48}
                tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)} />
              <Tooltip formatter={(v: number) => [formatCurrency(v, cur), 'Net worth']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB' }} />
              <Area type="monotone" dataKey="Net worth" stroke="#6C63FF" strokeWidth={2.5} fill="url(#nw)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Editable income history */}
      <IncomeHistoryEditor currency={cur} months={6} />

      {/* Spending by category + budget */}
      {monthly && <SpendingByCategory summary={monthly} />}

      {/* Goal progress + savings allocation */}
      <Card padded>
        <h3 className="font-bold text-ink">Goal progress & savings plan</h3>
        {activeGoals.length === 0 && <p className="mt-2 text-sm text-ink-soft">No active goals yet.</p>}
        <div className="mt-3 space-y-3">
          {activeGoals.map((g) => {
            const pct = g.baseCurrencyTargetAmount > 0 ? Math.min(100, Math.round((g.baseCurrencyCurrentSavedAmount / g.baseCurrencyTargetAmount) * 100)) : 0;
            return (
              <div key={g.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{g.name}</span>
                  <span className="text-ink-soft">
                    {pct}%{g.recommendedMonthlySaving ? ` · ${formatCurrency(g.recommendedMonthlySaving, g.currency)}/mo` : ''}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted-border">
                  <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="px-2 text-center text-[11px] leading-relaxed text-ink-soft">
        Educational insights based on your data — not licensed financial advice.
      </p>
    </div>
  );
}

function buildWarnings(
  summary: ReturnType<typeof useFinancialSummary>['data'],
  monthly: ReturnType<typeof useMonthlySummary>['data'],
  goals: NonNullable<ReturnType<typeof useGoals>['data']>,
): string[] {
  const out: string[] = [];
  if (summary && summary.monthlySurplus < 0) out.push('Your monthly spending exceeds your income.');
  if (summary && summary.emergencyFundHealth < 0.5) out.push('Your emergency fund is below half the recommended level.');
  if (monthly?.overBudget) out.push('You’re over budget this month.');
  const flagged = goals.filter((g) => g.recommendation === Recommendation.HardWarning || g.recommendation === Recommendation.NotRecommended);
  for (const g of flagged) {
    out.push(`“${g.name}” is flagged as ${RECOMMENDATION_META[g.recommendation!].label}.`);
  }
  return out;
}
