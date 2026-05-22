import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}

/** Friendly placeholder shown when a section has no data yet. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-4xl" aria-hidden>
        {icon}
      </div>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="max-w-[28ch] text-sm text-ink-soft">{description}</p>
      {action}
    </div>
  );
}
