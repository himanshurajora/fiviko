import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ExpenseGranularity } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { useExpenseTrendByGrain } from '@/lib/expenses';
import { EXPENSE_CATEGORY_META } from '@/lib/expenseMeta';
import { formatCurrency } from '@/lib/format';

const GRAIN_LABELS: Record<ExpenseGranularity, string> = {
  D: 'last period: yesterday',
  W: 'last period: last week',
  M: 'last period: last month',
  Y: 'last period: last year',
};

/** D/W/M/Y expense trend with current-vs-prior delta and the category mover. */
export function ExpenseTrendCard({ currency }: { currency: string }) {
  const [granularity, setGranularity] = useState<ExpenseGranularity>('M');
  const { data } = useExpenseTrendByGrain(granularity);
  const bins = data?.bins ?? [];

  const deltaIsUp = (data?.deltaAbsolute ?? 0) > 0;
  // Spending going DOWN is "good" (green); going up is danger.
  const deltaTone = deltaIsUp ? 'text-danger' : 'text-success';
  const pctLabel = data && data.deltaPct != null
    ? `${deltaIsUp ? '+' : '−'}${Math.round(Math.abs(data.deltaPct) * 100)}%`
    : null;

  const mover = data?.topMover ?? null;
  const moverMeta = mover ? EXPENSE_CATEGORY_META[mover.category] : null;

  return (
    <Card padded>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-ink">Spending trend</h3>
        <div className="inline-flex rounded-2xl bg-background p-0.5 text-xs font-bold">
          {(['D', 'W', 'M', 'Y'] as ExpenseGranularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`focus-ring rounded-xl px-2.5 py-1 transition ${granularity === g ? 'bg-primary text-white' : 'text-ink-soft'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={bins.map((b) => ({ label: b.label, value: b.total }))} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="exp-trend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F87171" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#F87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0FA" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#6B7280" />
            <YAxis
              tickLine={false} axisLine={false} fontSize={11} stroke="#6B7280" width={48}
              tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
            />
            <Tooltip formatter={(v: number) => [formatCurrency(v, currency), 'Spent']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB' }} />
            <Area type="monotone" dataKey="value" stroke="#F87171" strokeWidth={2.5} fill="url(#exp-trend)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Delta + top mover — the "so what" line beneath the chart. */}
      {data && data.priorTotal > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-background px-3 py-2 text-xs">
          <div>
            <p className="text-ink-soft">vs {GRAIN_LABELS[granularity].replace('last period: ', '')}</p>
            <p className={`text-sm font-extrabold ${deltaTone}`}>
              {deltaIsUp ? '▲' : '▼'} {formatCurrency(Math.abs(data.deltaAbsolute), currency)}
              {pctLabel && <span className="ml-1 text-xs">({pctLabel})</span>}
            </p>
          </div>
          {mover && moverMeta && Math.abs(mover.delta) > 0 && (
            <div className="text-right">
              <p className="text-ink-soft">Biggest mover</p>
              <p className="text-sm font-bold text-ink">
                <span aria-hidden>{moverMeta.emoji}</span> {moverMeta.label}{' '}
                <span className={mover.delta > 0 ? 'text-danger' : 'text-success'}>
                  {mover.delta > 0 ? '+' : '−'}{formatCurrency(Math.abs(mover.delta), currency)}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
      {data && data.priorTotal <= 0 && (
        <p className="mt-3 text-[11px] text-ink-soft">
          Not enough history for a comparison yet — keep logging and we’ll show period-on-period changes here.
        </p>
      )}
    </Card>
  );
}
