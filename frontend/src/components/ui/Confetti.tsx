import { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#6C63FF', '#00C2A8', '#FFD166', '#FF8A3D', '#22C55E', '#EF4444'];

/**
 * Lightweight confetti burst for celebrations (no external dependency).
 * Respects reduced-motion via the global CSS rule that flattens animations.
 */
export function Confetti({ pieces = 60 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 1.4,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
      })),
    [pieces],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {bits.map((b) => (
        <motion.span
          key={b.id}
          initial={{ y: -40, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', rotate: b.rotate, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: b.duration, delay: b.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            left: `${b.left}%`,
            width: b.size,
            height: b.size * 0.6,
            background: b.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
