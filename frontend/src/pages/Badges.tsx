import { EmptyState } from '@/components/ui/EmptyState';

export function Badges() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">Badges</h1>
      <EmptyState
        icon="🏅"
        title="Your trophy shelf awaits"
        description="Earn badges by logging expenses, building streaks, and hitting your goals."
      />
    </div>
  );
}
