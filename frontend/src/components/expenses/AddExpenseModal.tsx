import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NeedOrWant, PaymentMethod, type ExpenseCategory } from '@fiviko/shared';
import { Button } from '@/components/ui/Button';
import { useAddExpense } from '@/lib/expenses';
import { notify } from '@/store/toast';
import { useExpenseModal } from '@/store/expenseModal';
import { useAuth } from '@/store/auth';
import {
  EXPENSE_CATEGORY_OPTIONS,
  NEED_WANT_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '@/lib/expenseMeta';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';

/**
 * Quick, amount-first expense entry (spec §8.4): designed to log a spend in
 * under 10 seconds. Renders as a bottom sheet on phones, a centered card on
 * larger screens. Works offline via useAddExpense.
 */
export function AddExpenseModal() {
  const { open, linkedGoalId, closeModal } = useExpenseModal();
  const baseCurrency = useAuth((s) => s.user?.baseCurrency ?? 'USD');
  const addExpense = useAddExpense();

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(baseCurrency);
  const [category, setCategory] = useState<ExpenseCategory>('FOOD' as ExpenseCategory);
  const [needOrWant, setNeedOrWant] = useState<NeedOrWant>(NeedOrWant.Need);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Reset the form whenever the sheet is (re)opened.
  useEffect(() => {
    if (open) {
      setAmount('');
      setCurrency(baseCurrency);
      setCategory('FOOD' as ExpenseCategory);
      setNeedOrWant(NeedOrWant.Need);
      setPaymentMethod(PaymentMethod.Cash);
      setNote('');
      setFeedback(null);
    }
  }, [open, baseCurrency]);

  // Close on Escape (accessibility).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeModal]);

  async function save() {
    const value = Number(amount);
    if (!value || value <= 0) {
      setFeedback('Enter an amount first');
      return;
    }
    try {
      const result = await addExpense.mutateAsync({
        amount: value,
        currency,
        category,
        needOrWant,
        paymentMethod,
        note: note.trim() || null,
        linkedGoalId,
      });
      if (result.offline) {
        notify.custom('Saved offline — will sync later', { tone: 'info', icon: '📥', sound: 'tap' });
      } else {
        notify.custom('Expense added', { tone: 'success', icon: '💸', sound: 'coin' });
      }
      closeModal();
    } catch {
      notify.error('Could not save expense');
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} aria-hidden />
          <motion.div
            role="dialog"
            aria-label="Add expense"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-soft sm:rounded-3xl"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-border sm:hidden" aria-hidden />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-ink">Add expense</h2>
              <button onClick={closeModal} className="focus-ring rounded-full p-1 text-ink-soft" aria-label="Close">
                ✕
              </button>
            </div>

            {/* Amount first */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="focus-ring rounded-2xl border border-muted-border bg-surface px-3 py-2 text-sm font-semibold"
                aria-label="Currency"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="focus-ring w-40 bg-transparent text-center text-5xl font-extrabold text-ink outline-none placeholder:text-muted-border"
                aria-label="Amount"
              />
            </div>

            {/* Category */}
            <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {EXPENSE_CATEGORY_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`focus-ring flex flex-col items-center gap-1 rounded-2xl border p-2 text-[11px] transition ${
                    category === c.value ? 'border-primary bg-primary/10 text-primary' : 'border-muted-border text-ink-soft'
                  }`}
                >
                  <span className="text-lg" aria-hidden>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Need / Want + payment */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {NEED_WANT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setNeedOrWant(o.value)}
                  className={`focus-ring rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    needOrWant === o.value ? 'bg-primary text-white' : 'bg-black/5 text-ink-soft'
                  }`}
                >
                  {o.emoji} {o.label}
                </button>
              ))}
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="focus-ring ml-auto rounded-full border border-muted-border bg-surface px-3 py-1.5 text-sm"
                aria-label="Payment method"
              >
                {PAYMENT_METHOD_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={280}
              className="focus-ring mt-3 h-11 w-full rounded-2xl border border-muted-border bg-surface px-4 text-sm"
            />

            {feedback && <p className="mt-3 text-center text-sm font-medium text-primary">{feedback}</p>}

            <Button size="lg" fullWidth className="mt-4" loading={addExpense.isPending} onClick={save}>
              Save expense
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
