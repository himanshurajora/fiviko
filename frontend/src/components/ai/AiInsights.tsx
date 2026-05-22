import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AiText } from './AiText';
import { useAiStatus, useCoachAsk, useMonthlyReport, useSavingsTips } from '@/lib/ai';
import { getErrorMessage } from '@/lib/api';
import { notify } from '@/store/toast';

/** AI money coach: monthly report, savings tips, and free-form Q&A. */
export function AiInsights() {
  const { data: status } = useAiStatus();
  const enabled = !!status?.enabled;
  const report = useMonthlyReport(enabled);
  const tips = useSavingsTips(enabled);
  const coach = useCoachAsk();
  const [question, setQuestion] = useState('');

  if (!status) return null;
  if (!enabled) {
    return (
      <Card padded>
        <h3 className="font-bold text-ink">🤖 AI money coach</h3>
        <p className="mt-1 text-sm text-ink-soft">AI features aren’t enabled on this server.</p>
      </Card>
    );
  }

  async function ask() {
    if (question.trim().length < 3) return;
    try {
      await coach.mutateAsync(question.trim());
    } catch (err) {
      notify.error(getErrorMessage(err, 'Could not reach the coach'));
    }
  }

  return (
    <Card padded className="bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-ink">🤖 AI money coach</h3>
        <span className="text-[11px] uppercase tracking-wide text-ink-soft">powered by AI</span>
      </div>

      {/* Monthly report */}
      <section className="mt-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-ink">This month’s report</h4>
          <button onClick={() => report.refetch()} className="focus-ring rounded text-xs font-semibold text-primary" disabled={report.isFetching}>
            {report.isFetching ? 'Thinking…' : 'Refresh'}
          </button>
        </div>
        <div className="mt-2">
          {report.isLoading || report.isFetching ? (
            <p className="text-sm text-ink-soft">Generating your report…</p>
          ) : report.isError ? (
            <p className="text-sm text-danger">{getErrorMessage(report.error)}</p>
          ) : report.data ? (
            <AiText text={report.data.text} />
          ) : null}
        </div>
      </section>

      {/* Tips */}
      <section className="mt-4 border-t border-muted-border/60 pt-3">
        <h4 className="text-sm font-bold text-ink">Smart savings tips</h4>
        <div className="mt-2">
          {tips.isLoading ? <p className="text-sm text-ink-soft">Finding tips…</p> : tips.data ? <AiText text={tips.data.text} /> : null}
        </div>
      </section>

      {/* Coach Q&A */}
      <section className="mt-4 border-t border-muted-border/60 pt-3">
        <h4 className="text-sm font-bold text-ink">Ask a question</h4>
        <div className="mt-2 flex items-end gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
            placeholder="e.g. Can I afford a vacation this year?"
            maxLength={500}
            className="focus-ring h-11 flex-1 rounded-2xl border border-muted-border bg-surface px-4 text-sm"
          />
          <Button onClick={ask} loading={coach.isPending}>Ask</Button>
        </div>
        {coach.data && (
          <div className="mt-3 rounded-2xl bg-surface/80 p-3">
            <AiText text={coach.data.text} />
          </div>
        )}
        <p className="mt-2 text-[11px] text-ink-soft">Educational guidance from your data — not licensed financial advice.</p>
      </section>
    </Card>
  );
}
