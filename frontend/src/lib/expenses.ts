import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  NeedOrWant,
  PaymentMethod,
  SyncStatus,
  type ExpenseCategory,
  type ExpenseDTO,
  type MonthlySummary,
} from '@fiviko/shared';
import { api } from './api';
import {
  getQueuedExpenses,
  queueExpense,
  removeQueuedExpenses,
  type PendingExpense,
} from './offlineQueue';
import { useSync } from '@/store/sync';

export interface NewExpense {
  amount: number;
  currency: string;
  category: ExpenseCategory;
  note?: string | null;
  date?: string;
  paymentMethod?: PaymentMethod;
  isRecurring?: boolean;
  needOrWant?: NeedOrWant;
  linkedGoalId?: string | null;
}

/** Queries that depend on expense data and should refresh after any change. */
function invalidateExpenseViews(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: ['expenses'] });
  void qc.invalidateQueries({ queryKey: ['monthly-summary'] });
  void qc.invalidateQueries({ queryKey: ['profile', 'summary'] });
  void qc.invalidateQueries({ queryKey: ['goals'] });
  // Logging an expense advances streaks and challenges.
  void qc.invalidateQueries({ queryKey: ['streaks'] });
  void qc.invalidateQueries({ queryKey: ['challenges'] });
  void qc.invalidateQueries({ queryKey: ['badges'] });
}

export function useExpenses(month?: string) {
  return useQuery({
    queryKey: ['expenses', month ?? 'recent'],
    queryFn: async (): Promise<ExpenseDTO[]> =>
      (await api.get('/expenses', { params: month ? { month } : undefined })).data,
  });
}

export function useMonthlySummary(month?: string) {
  return useQuery({
    queryKey: ['monthly-summary', month ?? 'current'],
    queryFn: async (): Promise<MonthlySummary> =>
      (await api.get('/expenses/monthly-summary', { params: month ? { month } : undefined })).data,
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/expenses/${id}`)).data,
    onSuccess: () => invalidateExpenseViews(qc),
  });
}

/**
 * Adds an expense with offline-first behaviour: when online it POSTs directly;
 * when offline (or the request fails) it queues to IndexedDB for later sync.
 * Returns `{ offline: true }` when the entry was queued.
 */
export function useAddExpense() {
  const qc = useQueryClient();
  const refreshPending = useSync((s) => s.refreshPending);

  return useMutation({
    mutationFn: async (input: NewExpense): Promise<{ offline: boolean }> => {
      const clientId = crypto.randomUUID();
      const payload = {
        clientId,
        amount: input.amount,
        currency: input.currency,
        category: input.category,
        note: input.note ?? null,
        date: input.date ?? new Date().toISOString(),
        paymentMethod: input.paymentMethod ?? PaymentMethod.Cash,
        isRecurring: input.isRecurring ?? false,
        needOrWant: input.needOrWant ?? NeedOrWant.Need,
        linkedGoalId: input.linkedGoalId ?? null,
      };

      if (navigator.onLine) {
        try {
          await api.post('/expenses', payload);
          return { offline: false };
        } catch {
          // Network blip while "online" — fall through to the queue.
        }
      }

      const pending: PendingExpense = { ...payload, queuedAt: new Date().toISOString() };
      await queueExpense(pending);
      await refreshPending();
      return { offline: true };
    },
    onSuccess: () => invalidateExpenseViews(qc),
  });
}

/** Pushes any queued expenses to the server. Safe to call repeatedly. */
export async function flushQueue(qc: QueryClient): Promise<number> {
  const queued = await getQueuedExpenses();
  if (queued.length === 0) return 0;

  const { setSyncing, refreshPending } = useSync.getState();
  setSyncing(true);
  try {
    const expenses = queued.map(({ queuedAt: _queuedAt, ...rest }) => rest);
    await api.post('/expenses/sync-offline', { expenses });
    await removeQueuedExpenses(queued.map((q) => q.clientId));
    await refreshPending();
    invalidateExpenseViews(qc);
    return queued.length;
  } finally {
    setSyncing(false);
  }
}

/** Build the merged list of pending (local) expenses for optimistic display. */
export async function readPendingForDisplay(): Promise<ExpenseDTO[]> {
  const queued = await getQueuedExpenses();
  return queued.map((q) => ({
    id: `pending-${q.clientId}`,
    amount: q.amount,
    currency: q.currency,
    baseCurrencyAmount: q.amount,
    category: q.category,
    note: q.note,
    date: q.date,
    paymentMethod: q.paymentMethod,
    isRecurring: q.isRecurring,
    needOrWant: q.needOrWant,
    linkedGoalId: q.linkedGoalId,
    syncStatus: SyncStatus.Pending,
    clientId: q.clientId,
    createdAt: q.queuedAt,
  }));
}

/**
 * Wires up automatic sync: flushes the queue on mount and whenever the browser
 * comes back online. Mount once near the app root.
 */
export function useOfflineSync(): void {
  const qc = useQueryClient();
  const refreshPending = useSync((s) => s.refreshPending);

  useEffect(() => {
    void refreshPending();
    const flush = () => void flushQueue(qc).catch(() => undefined);
    flush(); // attempt on mount in case items are left from a previous session
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [qc, refreshPending]);
}
