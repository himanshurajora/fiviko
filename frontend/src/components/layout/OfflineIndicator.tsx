import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Clear offline-state indicator (spec §3). Watches the browser online status. */
export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);

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

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mx-4 mt-2 rounded-2xl bg-warning/15 px-4 py-2 text-center text-sm font-medium text-warning"
        >
          You’re offline — new expenses will sync when you reconnect.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
