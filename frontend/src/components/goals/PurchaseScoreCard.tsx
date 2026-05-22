import type { RecommendationResult } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { RecommendationBadge } from './RecommendationBadge';
import { RECOMMENDATION_META } from '@/lib/goalMeta';
import { formatCurrency } from '@/lib/format';

/** The headline purchase-decision result with score, explanation and breakdown. */
export function PurchaseScoreCard({
  result,
  currency,
}: {
  result: RecommendationResult;
  currency: string;
}) {
  const meta = RECOMMENDATION_META[result.recommendation];
  const ringColor =
    result.purchaseReadinessScore >= 70 ? '#22C55E' : result.purchaseReadinessScore >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <Card padded className={meta.soft}>
      <div className="flex flex-col items-center gap-3 text-center">
        <ProgressRing value={result.purchaseReadinessScore / 100} label={`${Math.round(result.purchaseReadinessScore)}`} color={ringColor} size={108} />
        <RecommendationBadge recommendation={result.recommendation} />
        <p className="max-w-prose text-sm leading-relaxed text-ink">{result.explanation}</p>
      </div>

      {/* Sub-scores */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <SubScore label="Safety" value={result.financialSafetyScore} />
        <SubScore label="Personal value" value={result.personalValueScore} />
        <SubScore label="Future benefit" value={result.futureBenefitScore} />
        <SubScore label="Risk" value={result.riskScore} inverse />
        <SubScore label="Goal conflict" value={result.goalConflictScore} inverse />
      </div>

      {/* Saving plan */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Info label="Save / month" value={formatCurrency(result.monthlySavingRequired, currency)} />
        <Info
          label="Safe budget"
          value={`${formatCurrency(result.safeBudgetMin, currency)}–${formatCurrency(result.safeBudgetMax, currency)}`}
        />
        {result.recommendedPurchaseDate && (
          <Info
            label="Best time to buy"
            value={new Date(result.recommendedPurchaseDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          />
        )}
      </div>

      {/* Conflicts */}
      {result.conflicts.length > 0 && (
        <div className="mt-4 rounded-2xl bg-surface/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Impact on other goals</p>
          <ul className="mt-1 space-y-1 text-sm text-ink">
            {result.conflicts.map((c) => (
              <li key={c.goalId}>
                <span className="font-semibold">{c.goalName}</span>: delayed ~{c.delayMonths} mo
                {c.progressReductionPct > 0 && `, −${c.progressReductionPct}% progress`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function SubScore({ label, value, inverse }: { label: string; value: number; inverse?: boolean }) {
  const good = inverse ? value <= 40 : value >= 60;
  const mid = value > 40 && value < 60;
  const color = good ? 'text-success' : mid ? 'text-warning' : 'text-danger';
  return (
    <div className="rounded-2xl bg-surface/70 px-3 py-2 text-center">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className={`text-lg font-extrabold ${color}`}>{Math.round(value)}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface/70 px-3 py-2">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="font-bold text-ink">{value}</p>
    </div>
  );
}
