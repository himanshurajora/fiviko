import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export function Expenses() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">Expenses</h1>
      <EmptyState
        icon="🧾"
        title="No expenses yet"
        description="Track your spending to see where your money goes and protect your goals."
        action={<Button>➕ Add your first expense</Button>}
      />
    </div>
  );
}
