import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { useToast, type ToastTone } from '@/store/toast';

const TONE_STYLE: Record<ToastTone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-primary/20 bg-primary/10 text-primary',
};

/** Stacked top-center toasts. Mount once near the app root. */
export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-[70] flex flex-col items-center gap-2 px-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            onClick={() => dismiss(t.id)}
            className={clsx(
              'pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-card backdrop-blur',
              TONE_STYLE[t.tone],
            )}
          >
            {t.icon && <span aria-hidden>{t.icon}</span>}
            <span>{t.message}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
