import { useAuth } from '@/store/auth';
import { useFinancialSummary } from '@/lib/queries';
import { FinancialHealthCard } from '@/components/dashboard/FinancialHealthCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, greeting } from '@/lib/format';

export function Dashboard() {
  const user = useAuth((s) => s.user);
  const { data: summary, isLoading, isError } = useFinancialSummary();
  const currency = summary?.baseCurrency ?? user?.baseCurrency ?? 'USD';

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Greeting (avatar hidden on desktop where the sidebar shows the user). */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-soft">{greeting()},</p>
          <h1 className="text-2xl font-extrabold text-ink md:text-3xl">{user?.name ?? 'there'} 👋</h1>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-primary text-lg font-bold text-white md:hidden">
          {(user?.name ?? 'F').charAt(0).toUpperCase()}
        </span>
      </header>

      {isLoading && <DashboardSkeleton />}

      {isError && (
        <Card className="text-center" padded>
          <p className="text-ink-soft">Couldn’t load your dashboard. Pull to refresh or try again.</p>
        </Card>
      )}

      {summary && (
        <>
          <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <FinancialHealthCard summary={summary} />
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:col-span-2 lg:content-start">
              <StatCard
                label="This month spent"
                icon="🧾"
                value={formatCurrency(summary.currentMonthSpending, currency)}
              />
              <StatCard
                label="Safe to spend"
                icon="🛟"
                tone={summary.safeRemainingSpend > 0 ? 'success' : 'danger'}
                value={formatCurrency(summary.safeRemainingSpend, currency)}
              />
              <StatCard
                label="Liquid money"
                icon="💧"
                value={formatCurrency(summary.liquidNetWorth, currency)}
              />
              <StatCard
                label="Emergency fund"
                icon="🚑"
                tone={summary.emergencyFundHealth >= 0.5 ? 'success' : 'warning'}
                value={`${Math.round(summary.emergencyFundHealth * 100)}%`}
                sublabel={`of ${formatCurrency(summary.emergencyFundTarget, currency)}`}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Big, expressive add-expense action (spec §8.4). */}
            <Button size="lg" fullWidth className="h-16 text-lg">
              ➕ Add Expense
            </Button>

            <Card padded className="flex items-center gap-3 bg-gradient-sun text-ink">
              <span className="text-2xl" aria-hidden>
                🔥
              </span>
              <div>
                <p className="font-bold">Start your first streak!</p>
                <p className="text-sm text-ink/80">Log an expense today to get going.</p>
              </div>
            </Card>
          </div>
        </>
      )}

      <p className="px-2 pt-2 text-center text-[11px] leading-relaxed text-ink-soft">
        Educational insights based on your data — not licensed financial advice.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3" aria-hidden>
      <div className="h-44 animate-pulse rounded-3xl bg-black/5 lg:col-span-1" />
      <div className="grid grid-cols-2 gap-3 lg:col-span-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-3xl bg-black/5" />
        ))}
      </div>
    </div>
  );
}
