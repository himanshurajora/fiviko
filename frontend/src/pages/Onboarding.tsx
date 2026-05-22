import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Frequency,
  GoalPriority,
  GoalType,
  type FinancialPersonality,
  type GoalCategory,
  type OnboardingPayload,
  type OnboardingResult,
} from '@fiviko/shared';
import { StepShell } from '@/components/onboarding/StepShell';
import { ItemListEditor, type EditorItem } from '@/components/onboarding/ItemListEditor';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Confetti } from '@/components/ui/Confetti';
import { useAuth } from '@/store/auth';
import { useSubmitOnboarding } from '@/lib/badges';
import { getErrorMessage } from '@/lib/api';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { PERSONALITY_OPTIONS } from '@/lib/personality';
import {
  ASSET_LIQUIDITY,
  ASSET_OPTIONS,
  INCOME_OPTIONS,
  LIABILITY_OPTIONS,
  MANDATORY_OPTIONS,
} from '@/lib/financeMeta';
import { GOAL_CATEGORY_OPTIONS, GOAL_TYPE_OPTIONS } from '@/lib/goalMeta';

const TOTAL_STEPS = 8; // welcome .. first goal (the reveal is separate)

export function Onboarding() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const submit = useSubmitOnboarding();

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  const [baseCurrency, setBaseCurrency] = useState(user?.baseCurrency ?? 'USD');
  const [incomes, setIncomes] = useState<EditorItem[]>([{ key: 'SALARY', amount: 0 }]);
  const [expenses, setExpenses] = useState<EditorItem[]>([{ key: 'RENT', amount: 0 }]);
  const [assets, setAssets] = useState<EditorItem[]>([{ key: 'BANK_BALANCE', name: 'Savings', amount: 0 }]);
  const [liabilities, setLiabilities] = useState<EditorItem[]>([]);
  const [personality, setPersonality] = useState<FinancialPersonality | null>(null);
  const [goal, setGoal] = useState({
    enabled: true,
    name: '',
    category: 'LAPTOP' as GoalCategory,
    type: GoalType.ShortTerm as GoalType,
    targetAmount: 0,
    priority: GoalPriority.High as GoalPriority,
  });

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  function buildPayload(): OnboardingPayload {
    return {
      baseCurrency,
      financialPersonality: personality!,
      incomes: incomes.filter((i) => i.amount > 0).map((i) => ({ type: i.key as never, amount: i.amount, frequency: Frequency.Monthly })),
      mandatoryExpenses: expenses.filter((e) => e.amount > 0).map((e) => ({ category: e.key as never, amount: e.amount, frequency: Frequency.Monthly })),
      assets: assets.filter((a) => a.amount > 0).map((a) => ({ type: a.key as never, name: a.name?.trim() || ASSET_OPTIONS.find((o) => o.value === a.key)!.label, amount: a.amount, liquidityType: ASSET_LIQUIDITY[a.key] })),
      liabilities: liabilities.filter((l) => (l.amount ?? 0) > 0 || (l.amount2 ?? 0) > 0).map((l) => ({ type: l.key as never, name: l.name?.trim() || LIABILITY_OPTIONS.find((o) => o.value === l.key)!.label, outstandingAmount: l.amount ?? 0, monthlyPayment: l.amount2 ?? 0 })),
      firstGoal: goal.enabled && goal.name.trim() && goal.targetAmount > 0
        ? { name: goal.name.trim(), type: goal.type, category: goal.category, targetAmount: goal.targetAmount, priority: goal.priority }
        : null,
    };
  }

  async function finish() {
    setError(null);
    try {
      const res = await submit.mutateAsync(buildPayload());
      setResult(res);
      // Reflect completion locally so the app stops redirecting to onboarding.
      if (user) setUser({ ...user, baseCurrency, financialPersonality: personality, onboardingCompleted: true });
      setStep(TOTAL_STEPS); // reveal
    } catch (err) {
      setError(getErrorMessage(err, 'Could not finish setup'));
    }
  }

  // --- Reveal screen ------------------------------------------------------
  if (step === TOTAL_STEPS && result) {
    return <Reveal result={result} onDone={() => navigate('/app', { replace: true })} />;
  }

  // --- Steps --------------------------------------------------------------
  switch (step) {
    case 0:
      return (
        <StepShell step={0} totalSteps={TOTAL_STEPS} emoji="👋" title={`Welcome, ${user?.name?.split(' ')[0] ?? 'friend'}!`}
          subtitle="Let’s set up your money in about 2 minutes. Quick, honest answers work best." onNext={next} nextLabel="Let’s go 🚀">
          <div className="grid gap-3">
            {[
              { e: '🧾', t: 'Track spending', d: 'See where your money goes.' },
              { e: '🎯', t: 'Plan goals', d: 'Know when you can buy.' },
              { e: '🏅', t: 'Earn badges', d: 'Make saving feel great.' },
            ].map((c) => (
              <div key={c.t} className="card flex items-center gap-3 p-4">
                <span className="text-2xl" aria-hidden>{c.e}</span>
                <div><p className="font-bold text-ink">{c.t}</p><p className="text-sm text-ink-soft">{c.d}</p></div>
              </div>
            ))}
          </div>
        </StepShell>
      );

    case 1:
      return (
        <StepShell step={1} totalSteps={TOTAL_STEPS} emoji="🌍" title="Pick your currency"
          subtitle="All your totals will show in this currency." onBack={back} onNext={next}>
          <div className="grid grid-cols-2 gap-3">
            {SUPPORTED_CURRENCIES.map((c) => (
              <button key={c.code} onClick={() => setBaseCurrency(c.code)}
                className={`focus-ring rounded-2xl border p-4 text-left transition ${baseCurrency === c.code ? 'border-primary bg-primary/10' : 'border-muted-border'}`}>
                <p className="text-2xl font-extrabold text-ink">{c.symbol} {c.code}</p>
                <p className="text-sm text-ink-soft">{c.label}</p>
              </button>
            ))}
          </div>
        </StepShell>
      );

    case 2:
      return (
        <StepShell step={2} totalSteps={TOTAL_STEPS} emoji="💰" title="What’s coming in?"
          subtitle="Add your monthly income sources." onBack={back} onNext={next}>
          <ItemListEditor items={incomes} onChange={setIncomes} currency={baseCurrency}
            config={{ optionLabel: 'Income type', options: INCOME_OPTIONS, amountLabel: 'Monthly amount', addLabel: 'Add income source' }} />
        </StepShell>
      );

    case 3:
      return (
        <StepShell step={3} totalSteps={TOTAL_STEPS} emoji="🏠" title="Monthly must-pays"
          subtitle="Rent, bills, groceries — the essentials you can’t skip." onBack={back} onNext={next}>
          <ItemListEditor items={expenses} onChange={setExpenses} currency={baseCurrency}
            config={{ optionLabel: 'Category', options: MANDATORY_OPTIONS, amountLabel: 'Monthly amount', addLabel: 'Add expense' }} />
        </StepShell>
      );

    case 4:
      return (
        <StepShell step={4} totalSteps={TOTAL_STEPS} emoji="🏦" title="What do you own?"
          subtitle="Savings, investments, property — anything of value." onBack={back} onNext={next}>
          <ItemListEditor items={assets} onChange={setAssets} currency={baseCurrency}
            config={{ optionLabel: 'Asset type', options: ASSET_OPTIONS, hasName: true, amountLabel: 'Value', addLabel: 'Add asset' }} />
        </StepShell>
      );

    case 5:
      return (
        <StepShell step={5} totalSteps={TOTAL_STEPS} emoji="💳" title="Any debts or EMIs?"
          subtitle="Loans and credit you’re paying off. Skip if none." onBack={back} onNext={next} onSkip={next}>
          <ItemListEditor items={liabilities} onChange={setLiabilities} currency={baseCurrency}
            config={{ optionLabel: 'Debt type', options: LIABILITY_OPTIONS, hasName: true, amountLabel: 'Outstanding', secondAmountLabel: 'Monthly payment', addLabel: 'Add debt' }} />
          {liabilities.length === 0 && <p className="mt-4 text-center text-sm text-ink-soft">Debt-free? Tap “Skip”. 🎉</p>}
        </StepShell>
      );

    case 6:
      return (
        <StepShell step={6} totalSteps={TOTAL_STEPS} emoji="✨" title="What’s your money style?"
          subtitle="This helps us tailor your coaching." onBack={back} onNext={next} nextDisabled={!personality}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PERSONALITY_OPTIONS.map((p) => (
              <button key={p.value} onClick={() => setPersonality(p.value)}
                className={`focus-ring rounded-2xl border p-4 text-left transition ${personality === p.value ? 'border-primary bg-primary/10' : 'border-muted-border'}`}>
                <span className="text-3xl" aria-hidden>{p.emoji}</span>
                <p className="mt-2 font-bold text-ink">{p.label}</p>
                <p className="text-sm text-ink-soft">{p.tagline}</p>
              </button>
            ))}
          </div>
        </StepShell>
      );

    case 7:
      return (
        <StepShell step={7} totalSteps={TOTAL_STEPS} emoji="🎯" title="Your first goal"
          subtitle="What are you dreaming of buying? You can change this anytime."
          onBack={back} onNext={finish} nextLabel="Finish setup ✨" nextLoading={submit.isPending}
          onSkip={() => { setGoal((g) => ({ ...g, enabled: false })); finish(); }}>
          <div className="flex flex-col gap-4">
            <input type="text" placeholder="e.g. Work laptop" value={goal.name}
              onChange={(e) => setGoal((g) => ({ ...g, name: e.target.value, enabled: true }))}
              className="focus-ring h-12 rounded-2xl border border-muted-border bg-surface px-4 text-base" />
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {GOAL_CATEGORY_OPTIONS.map((c) => (
                <button key={c.value} onClick={() => setGoal((g) => ({ ...g, category: c.value }))}
                  className={`focus-ring flex flex-col items-center gap-1 rounded-2xl border p-2 text-xs transition ${goal.category === c.value ? 'border-primary bg-primary/10 text-primary' : 'border-muted-border text-ink-soft'}`}>
                  <span className="text-xl" aria-hidden>{c.emoji}</span>{c.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_TYPE_OPTIONS.map((t) => (
                <button key={t.value} onClick={() => setGoal((g) => ({ ...g, type: t.value }))}
                  className={`focus-ring rounded-2xl border p-3 text-left transition ${goal.type === t.value ? 'border-primary bg-primary/10' : 'border-muted-border'}`}>
                  <p className="font-bold text-ink">{t.label}</p><p className="text-xs text-ink-soft">{t.helper}</p>
                </button>
              ))}
            </div>
            <label>
              <span className="mb-1 block text-sm font-semibold text-ink">Target amount ({baseCurrency})</span>
              <input type="number" inputMode="decimal" value={goal.targetAmount || ''}
                onChange={(e) => setGoal((g) => ({ ...g, targetAmount: Number(e.target.value), enabled: true }))}
                className="focus-ring h-12 w-full rounded-2xl border border-muted-border bg-surface px-4 text-base font-semibold" />
            </label>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
          </div>
        </StepShell>
      );

    default:
      return null;
  }
}

/** Final celebratory screen: confetti, animated health score and unlocked badges. */
function Reveal({ result, onDone }: { result: OnboardingResult; onDone: () => void }) {
  const color = result.healthScore >= 70 ? '#22C55E' : result.healthScore >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-app">
      <Confetti />
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}>
          <p className="text-lg font-semibold text-ink-soft">You’re all set! 🎉</p>
          <h1 className="mt-1 text-3xl font-extrabold text-ink">Your financial health</h1>
        </motion.div>

        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="mt-8">
          <ProgressRing value={result.healthScore / 100} label={`${result.healthScore}`} color={color} size={160} strokeWidth={14} />
        </motion.div>
        <p className="mt-3 max-w-xs text-ink-soft">
          {result.healthScore >= 70 ? 'Fantastic start — you’re in great shape!' : result.healthScore >= 40 ? 'Good start! We’ll help you build a stronger cushion.' : 'Let’s grow your safety net together, one step at a time.'}
        </p>

        {result.unlockedBadges.length > 0 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 w-full">
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Badges unlocked</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {result.unlockedBadges.map((b, i) => (
                <motion.div key={b.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.15, type: 'spring' }}
                  className="card flex w-32 flex-col items-center gap-1 p-3">
                  <span className="text-4xl" aria-hidden>{b.icon}</span>
                  <p className="text-sm font-bold text-ink">{b.name}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <Button size="lg" className="mt-10 px-10" onClick={onDone}>
          Go to my dashboard →
        </Button>
      </div>
    </div>
  );
}
