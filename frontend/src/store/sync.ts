import { create } from 'zustand';
import { countQueuedExpenses } from '@/lib/offlineQueue';

interface SyncState {
  /** Number of expenses waiting to sync to the server. */
  pendingCount: number;
  syncing: boolean;
  refreshPending: () => Promise<void>;
  setSyncing: (syncing: boolean) => void;
}

/** Tracks the offline expense queue so the UI can surface pending/sync status. */
export const useSync = create<SyncState>((set) => ({
  pendingCount: 0,
  syncing: false,
  async refreshPending() {
    set({ pendingCount: await countQueuedExpenses() });
  },
  setSyncing(syncing) {
    set({ syncing });
  },
}));
