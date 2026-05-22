import { computeHealthScore, type FinancialSummary } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { formatCurrency } from '@/lib/format';

/**
 * Headline financial-health card. The score is a simple, explainable blend of
 * emergency-fund health, surplus health and debt pressure (0–100).
 */
export function FinancialHealthCard({ summary }: { summary: FinancialSummary }) {
  const score = computeHealthScore(summary);
  const color = score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <Card className="bg-gradient-primary text-white" padded>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm/relaxed text-white/80">Financial Health</p>
          <p className="mt-1 text-3xl font-extrabold">{score}/100</p>
          <p className="mt-2 max-w-[18ch] text-sm text-white/85">{healthMessage(score)}</p>
        </div>
        <div className="rounded-full bg-white/15 p-1.5">
          <ProgressRing value={score / 100} label={`${score}`} color={color} size={88} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Mini label="Net worth" value={formatCurrency(summary.netWorth, summary.baseCurrency)} />
        <Mini label="Monthly surplus" value={formatCurrency(summary.monthlySurplus, summary.baseCurrency)} />
      </div>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2">
      <p className="text-white/70">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function healthMessage(score: number): string {
  if (score >= 70) return 'You’re in great shape — keep it up!';
  if (score >= 40) return 'Solid start. A bigger buffer would help.';
  return 'Let’s build a safety cushion together.';
}
