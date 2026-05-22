import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSync } from '@/store/sync';

/**
 * Clear offline-state indicator (spec §3). Shows an offline banner when the
 * connection drops, and a "syncing N" banner while queued expenses upload.
 */
export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const pendingCount = useSync((s) => s.pendingCount);
  const syncing = useSync((s) => s.syncing);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const message = !online
    ? { tone: 'warning', text: `You’re offline${pendingCount > 0 ? ` — ${pendingCount} expense${pendingCount > 1 ? 's' : ''} will sync later` : ' — new expenses will sync when you reconnect.'}` }
    : syncing || pendingCount > 0
      ? { tone: 'primary', text: `Syncing ${pendingCount} pending expense${pendingCount > 1 ? 's' : ''}…` }
      : null;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`mx-4 mt-2 rounded-2xl px-4 py-2 text-center text-sm font-medium ${
            message.tone === 'warning' ? 'bg-warning/15 text-warning' : 'bg-primary/10 text-primary'
          }`}
        >
          {message.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
