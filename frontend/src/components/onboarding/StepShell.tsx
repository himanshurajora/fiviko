import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface StepShellProps {
  step: number;
  totalSteps: number;
  emoji: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextLoading?: boolean;
  nextDisabled?: boolean;
  onSkip?: () => void;
}

/** Consistent, animated frame for each onboarding step. */
export function StepShell({
  step,
  totalSteps,
  emoji,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextLoading,
  nextDisabled,
  onSkip,
}: StepShellProps) {
  return (
    <div className="min-h-dvh bg-gradient-app">
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pb-8 pt-8">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {onBack ? (
            <button onClick={onBack} className="focus-ring -ml-1 rounded-full p-1 text-xl text-ink-soft" aria-label="Back">
              ←
            </button>
          ) : (
            <span className="w-7" />
          )}
          <div className="flex flex-1 gap-1.5" aria-label={`Step ${step + 1} of ${totalSteps}`}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted-border'}`} />
            ))}
          </div>
          {onSkip && (
            <button onClick={onSkip} className="focus-ring rounded text-sm font-medium text-ink-soft">
              Skip
            </button>
          )}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-8 flex flex-1 flex-col"
        >
          <div className="text-5xl" aria-hidden>{emoji}</div>
          <h1 className="mt-3 text-2xl font-extrabold text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
          <div className="mt-6 flex-1">{children}</div>
        </motion.div>

        <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-background to-transparent pt-3">
          <Button size="lg" fullWidth onClick={onNext} loading={nextLoading} disabled={nextDisabled}>
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
