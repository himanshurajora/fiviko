import { Link } from 'react-router-dom';
import { useGoals } from '@/lib/goals';
import { GoalCard } from '@/components/goals/GoalCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export function Goals() {
  const { data: goals, isLoading, isError } = useGoals();

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink md:text-3xl">Goals</h1>
        <Link to="/app/goals/new">
          <Button size="sm">➕ New goal</Button>
        </Link>
      </header>

      {isLoading && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-hidden>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-black/5" />
          ))}
        </div>
      )}

      {isError && <p className="text-ink-soft">Couldn’t load your goals. Please try again.</p>}

      {goals && goals.length === 0 && (
        <EmptyState
          icon="🎯"
          title="No goals yet"
          description="Create a purchase goal and Fiviko will tell you when it’s smart to buy."
          action={
            <Link to="/app/goals/new">
              <Button>➕ Create a goal</Button>
            </Link>
          }
        />
      )}

      {goals && goals.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
