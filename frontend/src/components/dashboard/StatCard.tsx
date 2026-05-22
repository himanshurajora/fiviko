import { Card } from '@/components/ui/Card';
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: string;
  icon?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  sublabel?: string;
}

const tones: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-ink',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

/** Compact metric tile for net worth, surplus, spending, etc. */
export function StatCard({ label, value, icon, tone = 'default', sublabel }: StatCardProps) {
  return (
    <Card padded className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        {icon && <span aria-hidden>{icon}</span>}
        <span>{label}</span>
      </div>
      <span className={clsx('text-2xl font-extrabold', tones[tone])}>{value}</span>
      {sublabel && <span className="text-xs text-ink-soft">{sublabel}</span>}
    </Card>
  );
}
