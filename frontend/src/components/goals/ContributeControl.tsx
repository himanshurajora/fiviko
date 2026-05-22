import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GoalDTO } from '@fiviko/shared';
import { Button } from '@/components/ui/Button';
import { useContribute } from '@/lib/goals';
import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';

/** Log real savings toward a goal, moving its progress and recommendation. */
export function ContributeControl({ goal }: { goal: GoalDTO }) {
  const contribute = useContribute(goal.id);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');

  async function save() {
    const value = Number(amount);
    if (!value || value <= 0) {
      notify.error('Enter an amount to add');
      return;
    }
    try {
      const updated = await contribute.mutateAsync(value);
      const done = updated.status === 'ACHIEVED';
      notify.custom(done ? 'Goal reached! 🎉' : 'Savings added', { tone: 'success', icon: done ? '🏆' : '💰', sound: done ? 'success' : 'coin' });
      setAmount('');
      setOpen(false);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not add savings'));
    }
  }

  if (goal.status === 'ACHIEVED') {
    return (
      <div className="rounded-2xl bg-success/10 px-4 py-3 text-center text-sm font-semibold text-success">
        🏆 Goal achieved — congratulations!
      </div>
    );
  }

  return (
    <div>
      {!open ? (
        <Button variant="secondary" fullWidth onClick={() => setOpen(true)}>
          💰 Add savings
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="contribute" className="text-sm font-semibold text-ink">
                Add savings ({goal.currency})
              </label>
              <input
                id="contribute"
                type="number"
                inputMode="decimal"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="focus-ring mt-1 h-12 w-full rounded-2xl border border-muted-border bg-surface px-4 text-base font-semibold"
              />
            </div>
            <Button onClick={save} loading={contribute.isPending}>Add</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>✕</Button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
