import { create } from 'zustand';

interface ExpenseModalState {
  open: boolean;
  /** Optional goal to pre-link the expense to. */
  linkedGoalId: string | null;
  openModal: (opts?: { linkedGoalId?: string }) => void;
  closeModal: () => void;
}

/** Global control for the quick Add-Expense modal so any button can open it. */
export const useExpenseModal = create<ExpenseModalState>((set) => ({
  open: false,
  linkedGoalId: null,
  openModal: (opts) => set({ open: true, linkedGoalId: opts?.linkedGoalId ?? null }),
  closeModal: () => set({ open: false, linkedGoalId: null }),
}));
