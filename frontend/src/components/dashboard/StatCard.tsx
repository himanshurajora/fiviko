import { Card } from '@/components/ui/Card';
import { CountUp } from '@/components/ui/CountUp';
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: string;
  icon?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  sublabel?: string;
  /** When provided, the value counts up to this number using `format`. */
  animatedValue?: number;
  format?: (n: number) => string;
}

const tones: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-ink',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

const iconTones: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-primary/10',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  danger: 'bg-danger/15',
};

/** Compact metric tile for net worth, surplus, spending, etc. */
export function StatCard({ label, value, icon, tone = 'default', sublabel, animatedValue, format }: StatCardProps) {
  return (
    <Card padded className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        {icon && (
          <span className={clsx('grid h-7 w-7 place-items-center rounded-xl text-base', iconTones[tone])} aria-hidden>
            {icon}
          </span>
        )}
        <span>{label}</span>
      </div>
      <span className={clsx('text-2xl font-extrabold', tones[tone])}>
        {animatedValue != null && format ? <CountUp value={animatedValue} format={format} /> : value}
      </span>
      {sublabel && <span className="text-xs text-ink-soft">{sublabel}</span>}
    </Card>
  );
}
