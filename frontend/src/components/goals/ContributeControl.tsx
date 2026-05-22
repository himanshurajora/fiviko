import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LiquidityType, type GoalDTO } from '@fiviko/shared';
import { Button } from '@/components/ui/Button';
import { useContribute } from '@/lib/goals';
import { useAssets } from '@/lib/finances';
import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

/** Log real savings toward a goal, optionally moved out of a real account. */
export function ContributeControl({ goal }: { goal: GoalDTO }) {
  const contribute = useContribute(goal.id);
  const { data: assets } = useAssets();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [fromAssetId, setFromAssetId] = useState<string>('');

  // Only cash-like accounts make sense as a source of savings.
  const liquidAssets = (assets ?? []).filter((a) => a.liquidityType === LiquidityType.Liquid);

  async function save() {
    const value = Number(amount);
    if (!value || value <= 0) {
      notify.error('Enter an amount to add');
      return;
    }
    try {
      const updated = await contribute.mutateAsync({ amount: value, fromAssetId: fromAssetId || null });
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
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
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
            </div>
            {liquidAssets.length > 0 && (
              <label className="text-sm text-ink-soft">
                Move from account (optional):
                <select
                  value={fromAssetId}
                  onChange={(e) => setFromAssetId(e.target.value)}
                  className="focus-ring mt-1 h-10 w-full rounded-2xl border border-muted-border bg-surface px-3 text-sm"
                >
                  <option value="">Just track — don’t deduct</option>
                  {liquidAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.amount, a.currency)})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
