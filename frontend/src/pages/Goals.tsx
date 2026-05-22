import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export function Goals() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">Goals</h1>
      <EmptyState
        icon="🎯"
        title="No goals yet"
        description="Create a purchase goal and Fiviko will tell you when it’s smart to buy."
        action={<Button>➕ Create a goal</Button>}
      />
    </div>
  );
}
