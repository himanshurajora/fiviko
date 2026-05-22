import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Confetti } from '@/components/ui/Confetti';
import { useCelebration } from '@/store/celebration';
import { playSound } from '@/lib/sound';

/** Full-screen celebratory moment for badge unlocks and level-ups. */
export function CelebrationOverlay() {
  const current = useCelebration((s) => s.current);
  const next = useCelebration((s) => s.next);

  useEffect(() => {
    if (!current) return;
    playSound(current.kind === 'level' ? 'levelUp' : 'badge');
    const timer = setTimeout(next, 3400);
    return () => clearTimeout(timer);
  }, [current, next]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          className="fixed inset-0 z-[80] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={next}
          role="dialog"
          aria-label={current.title}
        >
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
          <Confetti pieces={80} />
          <motion.div
            initial={{ scale: 0.7, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 220 }}
            className="relative z-10 flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-surface p-8 text-center shadow-soft"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {current.kind === 'level' ? 'Level up!' : 'Badge unlocked!'}
            </p>
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', damping: 10 }}
              className="grid h-24 w-24 place-items-center rounded-full bg-gradient-primary text-5xl shadow-soft"
            >
              {current.icon}
            </motion.div>
            <h2 className="text-xl font-extrabold text-ink">{current.title}</h2>
            <p className="text-sm text-ink-soft">{current.subtitle}</p>
            <button onClick={next} className="focus-ring mt-1 rounded-full bg-primary px-6 py-2 text-sm font-bold text-white">
              Awesome!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
