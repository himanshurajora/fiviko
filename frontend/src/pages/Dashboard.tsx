import { StreakType, UserChallengeStatus } from '@fiviko/shared';
import { useAuth } from '@/store/auth';
import { useExpenseModal } from '@/store/expenseModal';
import { useFinancialSummary } from '@/lib/queries';
import { useChallenges, useLevel, useStreaks } from '@/lib/gamification';
import { FinancialHealthCard } from '@/components/dashboard/FinancialHealthCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { StreakCard } from '@/components/gamification/StreakCard';
import { ChallengeCard } from '@/components/gamification/ChallengeCard';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, greeting } from '@/lib/format';

export function Dashboard() {
  const user = useAuth((s) => s.user);
  const openModal = useExpenseModal((s) => s.openModal);
  const { data: summary, isLoading, isError } = useFinancialSummary();
  const { data: streaks } = useStreaks();
  const { data: challenges } = useChallenges();
  const { data: level } = useLevel();
  const currency = summary?.baseCurrency ?? user?.baseCurrency ?? 'USD';

  const loggingStreak = streaks?.find((s) => s.type === StreakType.ExpenseLogging);
  // Surface daily challenges that still need attention first.
  const dailyChallenges = (challenges ?? [])
    .filter((c) => c.type === 'DAILY')
    .sort((a, b) => (a.status === UserChallengeStatus.Completed ? 1 : 0) - (b.status === UserChallengeStatus.Completed ? 1 : 0));

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Greeting (avatar hidden on desktop where the sidebar shows the user). */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-soft">{greeting()},</p>
          <h1 className="text-2xl font-extrabold text-ink md:text-3xl">{user?.name ?? 'there'} 👋</h1>
        </div>
        {level ? (
          <LevelBadge level={level} />
        ) : (
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-primary text-lg font-bold text-white md:hidden">
            {(user?.name ?? 'F').charAt(0).toUpperCase()}
          </span>
        )}
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
            <Button size="lg" fullWidth className="h-16 text-lg" onClick={() => openModal()}>
              ➕ Add Expense
            </Button>

            {loggingStreak && <StreakCard streak={loggingStreak} />}
          </div>

          {dailyChallenges.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-extrabold text-ink">Today’s challenges 🎯</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {dailyChallenges.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} />
                ))}
              </div>
            </section>
          )}
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
