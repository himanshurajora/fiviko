import { ExpenseCategory, NeedOrWant, PaymentMethod } from '@fiviko/shared';

export const EXPENSE_CATEGORY_META: Record<ExpenseCategory, { label: string; emoji: string }> = {
  [ExpenseCategory.Food]: { label: 'Food', emoji: '🍔' },
  [ExpenseCategory.Groceries]: { label: 'Groceries', emoji: '🛒' },
  [ExpenseCategory.Transport]: { label: 'Transport', emoji: '🚌' },
  [ExpenseCategory.Shopping]: { label: 'Shopping', emoji: '🛍️' },
  [ExpenseCategory.Entertainment]: { label: 'Fun', emoji: '🎬' },
  [ExpenseCategory.Health]: { label: 'Health', emoji: '💊' },
  [ExpenseCategory.Bills]: { label: 'Bills', emoji: '🧾' },
  [ExpenseCategory.Education]: { label: 'Education', emoji: '📚' },
  [ExpenseCategory.Travel]: { label: 'Travel', emoji: '✈️' },
  [ExpenseCategory.Subscriptions]: { label: 'Subs', emoji: '📺' },
  [ExpenseCategory.Other]: { label: 'Other', emoji: '📦' },
};

export const EXPENSE_CATEGORY_OPTIONS = Object.entries(EXPENSE_CATEGORY_META).map(([value, meta]) => ({
  value: value as ExpenseCategory,
  ...meta,
}));

/** Distinct chart colors per category, aligned to the app palette. */
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.Food]: '#FF8A3D',
  [ExpenseCategory.Groceries]: '#22C55E',
  [ExpenseCategory.Transport]: '#6C63FF',
  [ExpenseCategory.Shopping]: '#EF4444',
  [ExpenseCategory.Entertainment]: '#FFD166',
  [ExpenseCategory.Health]: '#00C2A8',
  [ExpenseCategory.Bills]: '#4038C9',
  [ExpenseCategory.Education]: '#F59E0B',
  [ExpenseCategory.Travel]: '#0EA5E9',
  [ExpenseCategory.Subscriptions]: '#A855F7',
  [ExpenseCategory.Other]: '#9CA3AF',
};

export const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.Cash, label: 'Cash' },
  { value: PaymentMethod.Card, label: 'Card' },
  { value: PaymentMethod.Upi, label: 'UPI' },
  { value: PaymentMethod.BankTransfer, label: 'Bank' },
  { value: PaymentMethod.Wallet, label: 'Wallet' },
  { value: PaymentMethod.Other, label: 'Other' },
];

export const NEED_WANT_OPTIONS = [
  { value: NeedOrWant.Need, label: 'Need', emoji: '✅' },
  { value: NeedOrWant.Want, label: 'Want', emoji: '✨' },
];
