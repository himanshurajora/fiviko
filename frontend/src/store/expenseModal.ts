import { create } from 'zustand';
import type { ExpenseDTO } from '@fiviko/shared';
import { playSound } from '@/lib/sound';

interface ExpenseModalState {
  open: boolean;
  /** Optional goal to pre-link the expense to. */
  linkedGoalId: string | null;
  /** When set, the modal edits this expense instead of adding a new one. */
  editing: ExpenseDTO | null;
  openModal: (opts?: { linkedGoalId?: string }) => void;
  openForEdit: (expense: ExpenseDTO) => void;
  closeModal: () => void;
}

/** Global control for the quick Add/Edit-Expense modal so any button can open it. */
export const useExpenseModal = create<ExpenseModalState>((set) => ({
  open: false,
  linkedGoalId: null,
  editing: null,
  openModal: (opts) => {
    playSound('whoosh');
    set({ open: true, linkedGoalId: opts?.linkedGoalId ?? null, editing: null });
  },
  openForEdit: (expense) => {
    playSound('whoosh');
    set({ open: true, editing: expense, linkedGoalId: expense.linkedGoalId ?? null });
  },
  closeModal: () => set({ open: false, linkedGoalId: null, editing: null }),
}));
