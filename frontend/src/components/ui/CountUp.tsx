import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

/**
 * Animates a number from its previous value to the new one and renders it
 * through `format`. Respects reduced-motion (snaps instantly).
 */
export function CountUp({ value, format, durationMs = 700 }: { value: number; format: (n: number) => string; durationMs?: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || prev.current === value) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: durationMs / 1000,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, durationMs]);

  return <>{format(display)}</>;
}
