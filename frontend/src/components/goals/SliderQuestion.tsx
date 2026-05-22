import type { ScoreQuestionMeta } from '@fiviko/shared';

interface SliderQuestionProps {
  question: ScoreQuestionMeta;
  value: number;
  onChange: (value: number) => void;
}

/** A single 1–100 slider with emoji, label and live value (spec §8.6). */
export function SliderQuestion({ question, value, onChange }: SliderQuestionProps) {
  const id = `score-${question.key}`;
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-2 font-semibold text-ink">
          <span className="text-xl" aria-hidden>
            {question.emoji}
          </span>
          {question.label}
        </label>
        <span className="min-w-[2.5rem] rounded-full bg-primary/10 px-2.5 py-0.5 text-center text-sm font-bold text-primary">
          {value}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        {question.helper}
        {question.inverse && <span className="ml-1 font-medium text-warning">(higher = riskier)</span>}
      </p>
      <input
        id={id}
        type="range"
        min={1}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted-border accent-primary"
        aria-valuemin={1}
        aria-valuemax={100}
        aria-valuenow={value}
      />
    </div>
  );
}
