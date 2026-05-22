import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GoalPriority,
  GoalType,
  SCORE_QUESTIONS,
  type GoalCategory,
  type GoalScoreInputValues,
} from '@fiviko/shared';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Card } from '@/components/ui/Card';
import { SliderQuestion } from '@/components/goals/SliderQuestion';
import { useAuth } from '@/store/auth';
import { useCreateGoal, type CreateGoalPayload } from '@/lib/goals';
import { GOAL_CATEGORY_OPTIONS, GOAL_PRIORITY_OPTIONS, GOAL_TYPE_OPTIONS } from '@/lib/goalMeta';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { api, getErrorMessage } from '@/lib/api';

const DEFAULT_SCORES: GoalScoreInputValues = Object.fromEntries(
  SCORE_QUESTIONS.map((q) => [q.key, 50]),
) as unknown as GoalScoreInputValues;

export function AddGoal() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const createGoal = useCreateGoal();
  // score-input mutation is bound per-goal, created after the goal exists
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<CreateGoalPayload>({
    name: '',
    type: GoalType.ShortTerm,
    category: 'LAPTOP' as GoalCategory,
    targetAmount: 0,
    currency: user?.baseCurrency ?? 'USD',
    currentSavedAmount: 0,
    priority: GoalPriority.Medium,
    targetDate: null,
    expectedMaintenanceCost: null,
    notes: null,
  });
  const [scores, setScores] = useState<GoalScoreInputValues>(DEFAULT_SCORES);

  const set = <K extends keyof CreateGoalPayload>(key: K, value: CreateGoalPayload[K]) =>
    setDetails((d) => ({ ...d, [key]: value }));

  function goToScores(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!details.name.trim()) return setError('Give your goal a name.');
    if (details.targetAmount <= 0) return setError('Enter a target amount greater than 0.');
    setStep(2);
  }

  const [submitting, setSubmitting] = useState(false);

  // Create the goal, then persist the 1–100 answers (which computes the
  // recommendation server-side), then jump to the goal's detail page.
  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const goal = await createGoal.mutateAsync(details);
      await api.post(`/goals/${goal.id}/score-inputs`, scores);
      navigate(`/app/goals/${goal.id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create goal'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <header className="flex items-center gap-3">
        <button onClick={() => (step === 1 ? navigate(-1) : setStep(1))} className="focus-ring text-2xl" aria-label="Back">
          ←
        </button>
        <h1 className="text-2xl font-extrabold text-ink">New goal</h1>
      </header>

      {/* Step progress */}
      <div className="flex gap-2" aria-hidden>
        {[1, 2].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted-border'}`} />
        ))}
      </div>

      {step === 1 && (
        <motion.form initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} onSubmit={goToScores} className="flex flex-col gap-4">
          <TextField label="What are you saving for?" name="name" placeholder="e.g. Work laptop" value={details.name} onChange={(e) => set('name', e.target.value)} />

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Category</span>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {GOAL_CATEGORY_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => set('category', c.value)}
                  className={`focus-ring flex flex-col items-center gap-1 rounded-2xl border p-2 text-xs transition ${
                    details.category === c.value ? 'border-primary bg-primary/10 text-primary' : 'border-muted-border text-ink-soft'
                  }`}
                >
                  <span className="text-xl" aria-hidden>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Goal type</span>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_TYPE_OPTIONS.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => set('type', t.value)}
                  className={`focus-ring rounded-2xl border p-3 text-left transition ${
                    details.type === t.value ? 'border-primary bg-primary/10' : 'border-muted-border'
                  }`}
                >
                  <p className="font-bold text-ink">{t.label}</p>
                  <p className="text-xs text-ink-soft">{t.helper}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <TextField label="Target amount" name="targetAmount" type="number" inputMode="decimal" value={details.targetAmount || ''} onChange={(e) => set('targetAmount', Number(e.target.value))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="goal-currency" className="text-sm font-semibold text-ink">Currency</label>
              <select id="goal-currency" value={details.currency} onChange={(e) => set('currency', e.target.value)} className="focus-ring h-12 rounded-2xl border border-muted-border bg-surface px-3 text-base">
                {SUPPORTED_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
              </select>
            </div>
          </div>

          <TextField label="Already saved (optional)" name="currentSavedAmount" type="number" inputMode="decimal" value={details.currentSavedAmount || ''} onChange={(e) => set('currentSavedAmount', Number(e.target.value))} />

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-ink">Priority</span>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_PRIORITY_OPTIONS.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => set('priority', p.value)}
                  className={`focus-ring rounded-2xl border py-2.5 font-semibold transition ${
                    details.priority === p.value ? 'border-primary bg-primary/10 text-primary' : 'border-muted-border text-ink-soft'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" size="lg" fullWidth>Next: how much does it matter?</Button>
        </motion.form>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-3">
          <Card padded className="bg-primary/5">
            <p className="text-sm text-ink-soft">
              Slide to rate each factor from 1–100. Honest answers give you a better recommendation.
            </p>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            {SCORE_QUESTIONS.map((q) => (
              <SliderQuestion key={q.key} question={q} value={scores[q.key]} onChange={(v) => setScores((s) => ({ ...s, [q.key]: v }))} />
            ))}
          </div>
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button size="lg" fullWidth loading={submitting} onClick={submit}>
            🎯 Create goal & get my recommendation
          </Button>
        </motion.div>
      )}
    </div>
  );
}
