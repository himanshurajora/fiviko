import { SyncStatus, type ExpenseDTO } from '@fiviko/shared';
import { EXPENSE_CATEGORY_META } from '@/lib/expenseMeta';
import { formatCurrency } from '@/lib/format';

/** A single row in the expense list; flags entries that haven't synced yet. */
export function ExpenseListItem({ expense, onDelete }: { expense: ExpenseDTO; onDelete?: (id: string) => void }) {
  const meta = EXPENSE_CATEGORY_META[expense.category];
  const pending = expense.syncStatus === SyncStatus.Pending;
  const date = new Date(expense.date);

  return (
    <div className="flex items-center gap-3 px-1 py-2.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-black/5 text-lg" aria-hidden>
        {meta.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">
          {expense.note || meta.label}
          {expense.needOrWant === 'WANT' && <span className="ml-1 text-xs text-accent-orange">✨</span>}
        </p>
        <p className="text-xs text-ink-soft">
          {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {meta.label}
          {pending && <span className="ml-1.5 rounded-full bg-warning/15 px-1.5 py-0.5 font-medium text-warning">⏳ pending</span>}
        </p>
      </div>
      <span className="shrink-0 font-bold text-ink">{formatCurrency(expense.amount, expense.currency)}</span>
      {onDelete && !pending && (
        <button onClick={() => onDelete(expense.id)} className="focus-ring shrink-0 rounded-full p-1 text-ink-soft hover:text-danger" aria-label="Delete expense">
          🗑️
        </button>
      )}
    </div>
  );
}
