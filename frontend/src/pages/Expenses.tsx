import { useEffect, useState } from 'react';
import type { ExpenseDTO } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/dashboard/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExpenseListItem } from '@/components/expenses/ExpenseListItem';
import { SpendingByCategory } from '@/components/expenses/SpendingByCategory';
import { useDeleteExpense, useExpenses, useMonthlySummary, readPendingForDisplay } from '@/lib/expenses';
import { useExpenseModal } from '@/store/expenseModal';
import { useSync } from '@/store/sync';
import { formatCurrency } from '@/lib/format';

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function Expenses() {
  const month = currentMonthKey();
  const openModal = useExpenseModal((s) => s.openModal);
  const pendingCount = useSync((s) => s.pendingCount);
  const { data: summary } = useMonthlySummary(month);
  const { data: serverExpenses, isLoading } = useExpenses(month);
  const deleteExpense = useDeleteExpense();

  // Merge locally-queued (pending) expenses on top of the synced list.
  const [pending, setPending] = useState<ExpenseDTO[]>([]);
  useEffect(() => {
    void readPendingForDisplay().then(setPending);
  }, [pendingCount, serverExpenses]);

  const expenses = [...pending, ...(serverExpenses ?? [])];
  const currency = summary?.baseCurrency ?? 'USD';
  const budgetUsedPct = summary && summary.monthlyBudget > 0
    ? Math.min(100, Math.round((summary.total / summary.monthlyBudget) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink md:text-3xl">Expenses</h1>
        <Button size="sm" onClick={() => openModal()}>➕ Add</Button>
      </header>

      {summary && (
        <>
          {summary.overBudget && (
            <Card padded className="flex items-center gap-3 bg-danger/10" role="alert">
              <span className="text-2xl" aria-hidden>🚨</span>
              <p className="text-sm font-medium text-danger">
                You’re over your monthly budget by {formatCurrency(summary.total - summary.monthlyBudget, currency)}.
              </p>
            </Card>
          )}

          {/* Budget vs actual */}
          <Card padded>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-ink">Budget vs actual</h3>
              <span className="text-sm text-ink-soft">{budgetUsedPct}% used</span>
            </div>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted-border">
              <div
                className={`h-full rounded-full transition-all ${summary.overBudget ? 'bg-danger' : budgetUsedPct > 80 ? 'bg-warning' : 'bg-secondary'}`}
                style={{ width: `${budgetUsedPct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-ink-soft">Spent {formatCurrency(summary.total, currency)}</span>
              <span className="text-ink-soft">Budget {formatCurrency(summary.monthlyBudget, currency)}</span>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="This month" icon="🧾" value={formatCurrency(summary.total, currency)} />
            <StatCard label="Daily average" icon="📅" value={formatCurrency(summary.dailyAverage, currency)} />
            <StatCard
              label="Safe to spend"
              icon="🛟"
              tone={summary.remainingSafeSpend > 0 ? 'success' : 'danger'}
              value={formatCurrency(summary.remainingSafeSpend, currency)}
            />
            <StatCard
              label="Needs vs wants"
              icon="⚖️"
              value={`${pctOf(summary.needTotal, summary.total)}/${pctOf(summary.wantTotal, summary.total)}`}
              sublabel="need / want"
            />
          </div>

          <SpendingByCategory summary={summary} />
        </>
      )}

      {/* Expense list */}
      <Card padded>
        <h3 className="mb-1 font-bold text-ink">Recent</h3>
        {isLoading && <p className="py-6 text-center text-sm text-ink-soft">Loading…</p>}
        {!isLoading && expenses.length === 0 && (
          <EmptyState
            icon="🧾"
            title="No expenses yet"
            description="Track your spending to see where your money goes and protect your goals."
            action={<Button onClick={() => openModal()}>➕ Add your first expense</Button>}
          />
        )}
        {expenses.length > 0 && (
          <div className="divide-y divide-muted-border">
            {expenses.map((e) => (
              <ExpenseListItem key={e.id} expense={e} onDelete={(id) => deleteExpense.mutate(id)} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function pctOf(part: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}
