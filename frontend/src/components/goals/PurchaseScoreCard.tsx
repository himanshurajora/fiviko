import type { RecommendationResult } from '@fiviko/shared';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { RecommendationBadge } from './RecommendationBadge';
import { AiText } from '@/components/ai/AiText';
import { RECOMMENDATION_META } from '@/lib/goalMeta';
import { formatCurrency } from '@/lib/format';
import { useAiStatus, useExplainDecision } from '@/lib/ai';

/** The headline purchase-decision result: a friendly verdict, plain-language
 *  reasons (no raw scores), and the saving plan. */
export function PurchaseScoreCard({
  result,
  currency,
  goalId,
}: {
  result: RecommendationResult;
  currency: string;
  goalId?: string;
}) {
  const meta = RECOMMENDATION_META[result.recommendation];
  const ringColor =
    result.purchaseReadinessScore >= 70 ? '#22C55E' : result.purchaseReadinessScore >= 40 ? '#F59E0B' : '#EF4444';
  const { data: aiStatus } = useAiStatus();
  const explain = useExplainDecision();

  return (
    <Card padded className={meta.soft}>
      <div className="flex flex-col items-center gap-3 text-center">
        {/* Readiness shown as a gauge with the verdict emoji — no bare number. */}
        <ProgressRing value={result.purchaseReadinessScore / 100} label={meta.emoji} color={ringColor} size={104} />
        <RecommendationBadge recommendation={result.recommendation} />
        <p className="max-w-prose text-sm leading-relaxed text-ink">{result.explanation}</p>
        {goalId && aiStatus?.enabled && (
          <button
            onClick={() => explain.mutate(goalId)}
            disabled={explain.isPending}
            className="focus-ring rounded-full bg-surface/80 px-3 py-1 text-xs font-semibold text-primary"
          >
            {explain.isPending ? '🤖 Thinking…' : '🤖 Explain in detail'}
          </button>
        )}
      </div>

      {explain.data && (
        <div className="mt-3 rounded-2xl bg-surface/80 p-3">
          <AiText text={explain.data.text} />
        </div>
      )}

      {/* Plain-language reasons (no internal scores). */}
      <div className="mt-5 rounded-2xl bg-surface/70 p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Why this verdict</p>
        <Rating label="Can you afford it" value={result.financialSafetyScore} />
        <Rating label="How much you’ll value it" value={result.personalValueScore} />
        <Rating label="Long-term payoff" value={result.futureBenefitScore} />
        <Rating label="Risk level" value={result.riskScore} inverse />
        <Rating label="Impact on other goals" value={result.goalConflictScore} inverse conflict />
      </div>

      {/* Saving plan */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {result.monthlySavingRequired > 0 ? (
          <Info label="Save / month" value={formatCurrency(result.monthlySavingRequired, currency)} />
        ) : (
          <Info label="Saving needed" value="None — affordable now" />
        )}
        <Info
          label="Comfortable budget"
          value={`${formatCurrency(result.safeBudgetMin, currency)}–${formatCurrency(result.safeBudgetMax, currency)}`}
        />
        {result.recommendedPurchaseDate && (
          <Info
            label="Best time to buy"
            value={isThisMonth(result.recommendedPurchaseDate)
              ? 'Now'
              : new Date(result.recommendedPurchaseDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          />
        )}
      </div>

      {/* Conflicts (plain language) */}
      {result.conflicts.some((c) => c.delayMonths > 0) && (
        <div className="mt-4 rounded-2xl bg-surface/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Effect on other goals</p>
          <ul className="mt-1 space-y-1 text-sm text-ink">
            {result.conflicts.filter((c) => c.delayMonths > 0).map((c) => (
              <li key={c.goalId}>
                <span className="font-semibold">{c.goalName}</span> delayed about {c.delayMonths} month{c.delayMonths > 1 ? 's' : ''}
                {c.progressReductionPct > 0 && ` (−${c.progressReductionPct}%)`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/**
 * Translates an internal 0–100 sub-score into a plain word + colour, hiding the
 * number. For `inverse` dimensions (risk, conflict) a low value is good.
 */
function Rating({ label, value, inverse, conflict }: { label: string; value: number; inverse?: boolean; conflict?: boolean }) {
  let word: string;
  let tone: 'good' | 'mid' | 'bad';
  if (inverse) {
    if (value <= 5 && conflict) {
      word = 'None';
      tone = 'good';
    } else if (value <= 33) {
      word = 'Low';
      tone = 'good';
    } else if (value <= 66) {
      word = conflict ? 'Some' : 'Medium';
      tone = 'mid';
    } else {
      word = 'High';
      tone = 'bad';
    }
  } else {
    if (value >= 67) {
      word = 'Strong';
      tone = 'good';
    } else if (value >= 34) {
      word = 'Okay';
      tone = 'mid';
    } else {
      word = 'Weak';
      tone = 'bad';
    }
  }
  const toneClass = tone === 'good' ? 'bg-success/15 text-success' : tone === 'mid' ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger';
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-ink">{label}</span>
      <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-bold', toneClass)}>{word}</span>
    </div>
  );
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface/70 px-3 py-2">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="font-bold text-ink">{value}</p>
    </div>
  );
}
