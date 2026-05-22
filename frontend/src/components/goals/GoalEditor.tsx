import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GoalPriority, SCORE_QUESTIONS, type GoalDTO, type GoalScoreInputValues } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SliderQuestion } from '@/components/goals/SliderQuestion';
import { useRecalculate, useSaveScoreInput, useUpdateGoal } from '@/lib/goals';
import { GOAL_PRIORITY_OPTIONS } from '@/lib/goalMeta';
import { GOAL_SCORE_PRESETS } from '@/lib/goalPresets';
import { notify } from '@/store/toast';
import { getErrorMessage } from '@/lib/api';

/** Collapsible editors for a goal's fields and its 1–100 value scores. */
export function GoalEditor({ goal, scoreInput }: { goal: GoalDTO; scoreInput: GoalScoreInputValues | null }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openScores, setOpenScores] = useState(false);

  const updateGoal = useUpdateGoal(goal.id);
  const recalc = useRecalculate(goal.id);
  const saveScores = useSaveScoreInput(goal.id);

  const [fields, setFields] = useState({
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentSavedAmount: goal.currentSavedAmount,
    priority: goal.priority,
    expectedMaintenanceCost: goal.expectedMaintenanceCost ?? 0,
  });
  const [scores, setScores] = useState<GoalScoreInputValues>(scoreInput ?? GOAL_SCORE_PRESETS[goal.category]);

  async function saveFields() {
    if (!fields.name.trim() || fields.targetAmount <= 0) {
      notify.error('Enter a name and a target above 0');
      return;
    }
    try {
      await updateGoal.mutateAsync(fields);
      await recalc.mutateAsync(); // re-score after the numbers change
      notify.custom('Goal updated', { tone: 'success', icon: '✅', sound: 'save' });
      setOpenEdit(false);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not update goal'));
    }
  }

  async function saveScoreValues() {
    try {
      await saveScores.mutateAsync(scores);
      notify.success('Recommendation updated', '🎯');
      setOpenScores(false);
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not save scores'));
    }
  }

  return (
    <Card padded animate={false}>
      {/* Edit fields */}
      <button onClick={() => setOpenEdit((v) => !v)} className="focus-ring flex w-full items-center justify-between text-left">
        <span className="font-bold text-ink">✏️ Edit goal</span>
        <span className="text-ink-soft">{openEdit ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence initial={false}>
        {openEdit && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 flex flex-col gap-3">
              <TextField label="Name" name="name" value={fields.name} onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <TextField label={`Target (${goal.currency})`} name="target" type="number" inputMode="decimal" value={fields.targetAmount || ''} onChange={(e) => setFields((f) => ({ ...f, targetAmount: Number(e.target.value) }))} />
                <TextField label={`Saved (${goal.currency})`} name="saved" type="number" inputMode="decimal" value={fields.currentSavedAmount || ''} onChange={(e) => setFields((f) => ({ ...f, currentSavedAmount: Number(e.target.value) }))} />
              </div>
              <TextField
                label={`Monthly running cost (${goal.currency}, optional)`}
                name="maintenance"
                type="number"
                inputMode="decimal"
                hint="Insurance, fuel, subscriptions… reduces your post-purchase surplus."
                value={fields.expectedMaintenanceCost || ''}
                onChange={(e) => setFields((f) => ({ ...f, expectedMaintenanceCost: Number(e.target.value) }))}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-ink">Priority</span>
                <div className="grid grid-cols-3 gap-2">
                  {GOAL_PRIORITY_OPTIONS.map((p) => (
                    <button key={p.value} type="button" onClick={() => setFields((f) => ({ ...f, priority: p.value as GoalPriority }))}
                      className={`focus-ring rounded-2xl border py-2 font-semibold transition ${fields.priority === p.value ? 'border-primary bg-primary/10 text-primary' : 'border-muted-border text-ink-soft'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={saveFields} loading={updateGoal.isPending || recalc.isPending}>Save changes</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="my-3 h-px bg-muted-border" />

      {/* Adjust scores */}
      <button onClick={() => setOpenScores((v) => !v)} className="focus-ring flex w-full items-center justify-between text-left">
        <span className="font-bold text-ink">🎚️ Adjust value scores</span>
        <span className="text-ink-soft">{openScores ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence initial={false}>
        {openScores && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {SCORE_QUESTIONS.map((q) => (
                <SliderQuestion key={q.key} question={q} value={scores[q.key]} onChange={(v) => setScores((s) => ({ ...s, [q.key]: v }))} />
              ))}
            </div>
            <Button className="mt-3" fullWidth onClick={saveScoreValues} loading={saveScores.isPending}>
              Update recommendation
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
