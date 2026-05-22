import { Link } from 'react-router-dom';
import { GoalStatus, Recommendation, type GoalDTO } from '@fiviko/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GoalCard } from '@/components/goals/GoalCard';

/** Dashboard goals section: Buy Now / Wait / Review counts + top active goals (spec §13). */
export function GoalsOverview({ goals }: { goals: GoalDTO[] }) {
  const active = goals.filter((g) => g.status === GoalStatus.Active);

  if (active.length === 0) {
    return (
      <Card padded className="flex flex-col items-center gap-2 text-center">
        <span className="text-3xl" aria-hidden>🎯</span>
        <p className="font-bold text-ink">No goals yet</p>
        <p className="text-sm text-ink-soft">Set a purchase goal and we’ll tell you when it’s smart to buy.</p>
        <Link to="/app/goals/new"><Button size="sm" className="mt-1">➕ Create a goal</Button></Link>
      </Card>
    );
  }

  const count = (recs: Recommendation[]) => active.filter((g) => g.recommendation && recs.includes(g.recommendation)).length;
  const buyNow = count([Recommendation.BuyNow]);
  const wait = count([Recommendation.Wait]);
  const review = count([Recommendation.ReduceBudget, Recommendation.NotRecommended, Recommendation.HardWarning]);

  // Show the highest-priority / closest goals first.
  const top = [...active].slice(0, 3);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink">Your goals</h2>
        <Link to="/app/goals" className="text-sm font-semibold text-primary">View all →</Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Chip label="Buy now" value={buyNow} icon="✅" tone="text-success" />
        <Chip label="Wait" value={wait} icon="⏳" tone="text-warning" />
        <Chip label="Review" value={review} icon="⚠️" tone="text-danger" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {top.map((g) => <GoalCard key={g.id} goal={g} />)}
      </div>
    </section>
  );
}

function Chip({ label, value, icon, tone }: { label: string; value: number; icon: string; tone: string }) {
  return (
    <Card padded animate={false} className="flex flex-col items-center gap-0.5 py-3">
      <span className="text-lg" aria-hidden>{icon}</span>
      <span className={`text-xl font-extrabold ${tone}`}>{value}</span>
      <span className="text-xs text-ink-soft">{label}</span>
    </Card>
  );
}
