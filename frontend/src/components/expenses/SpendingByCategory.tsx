import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { MonthlySummary } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { CATEGORY_COLORS, EXPENSE_CATEGORY_META } from '@/lib/expenseMeta';
import { formatCurrency } from '@/lib/format';

/** Donut chart + legend of spending by category for the month (spec §8.4, §16). */
export function SpendingByCategory({ summary }: { summary: MonthlySummary }) {
  if (summary.byCategory.length === 0) {
    return (
      <Card padded>
        <h3 className="font-bold text-ink">Spending by category</h3>
        <p className="mt-2 text-sm text-ink-soft">No spending logged this month yet.</p>
      </Card>
    );
  }

  const data = summary.byCategory.map((c) => ({
    ...c,
    color: CATEGORY_COLORS[c.category],
    label: EXPENSE_CATEGORY_META[c.category].label,
  }));

  return (
    <Card padded>
      <h3 className="font-bold text-ink">Spending by category</h3>
      <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="amount" nameKey="label" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="none">
                {data.map((d) => (
                  <Cell key={d.category} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-ink-soft">Total</span>
            <span className="text-sm font-extrabold text-ink">{formatCurrency(summary.total, summary.baseCurrency)}</span>
          </div>
        </div>
        <ul className="w-full flex-1 space-y-1.5">
          {data.map((d) => (
            <li key={d.category} className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden />
              <span className="flex-1 text-ink">{d.label}</span>
              <span className="text-ink-soft">{d.pct}%</span>
              <span className="w-20 text-right font-semibold text-ink">{formatCurrency(d.amount, summary.baseCurrency)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
