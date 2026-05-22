import { create } from 'zustand';

export interface Celebration {
  id: number;
  kind: 'badge' | 'level';
  icon: string;
  title: string;
  subtitle: string;
}

interface CelebrationState {
  /** The celebration currently on screen, or null. */
  current: Celebration | null;
  queue: Celebration[];
  enqueue: (c: Omit<Celebration, 'id'>) => void;
  next: () => void;
}

let nextId = 1;

/** Shows big celebratory overlays one at a time (badge unlocks, level-ups). */
export const useCelebration = create<CelebrationState>((set, get) => ({
  current: null,
  queue: [],
  enqueue: (c) => {
    const item = { ...c, id: nextId++ };
    const { current } = get();
    if (current) set((s) => ({ queue: [...s.queue, item] }));
    else set({ current: item });
  },
  next: () => {
    const [head, ...rest] = get().queue;
    set({ current: head ?? null, queue: rest });
  },
}));
