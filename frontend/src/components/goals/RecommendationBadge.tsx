import type { Recommendation } from '@fiviko/shared';
import clsx from 'clsx';
import { RECOMMENDATION_META } from '@/lib/goalMeta';

/** Colored pill showing a purchase recommendation. */
export function RecommendationBadge({
  recommendation,
  size = 'md',
}: {
  recommendation: Recommendation;
  size?: 'sm' | 'md';
}) {
  const meta = RECOMMENDATION_META[recommendation];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-bold',
        meta.badge,
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
