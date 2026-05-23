import { create } from 'zustand';
import { playSound, type SoundName } from '@/lib/sound';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastAction {
  /** Label rendered on the action button (e.g. "Undo"). */
  label: string;
  /** Fires when the user clicks the button — toast auto-dismisses after. */
  onClick: () => void | Promise<void>;
}

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  icon?: string;
  /** When present, an extra button is rendered inline (e.g. for Undo). */
  action?: ToastAction;
}

interface ToastState {
  toasts: Toast[];
  push: (
    message: string,
    opts?: {
      tone?: ToastTone;
      icon?: string;
      sound?: SoundName | null;
      durationMs?: number;
      action?: ToastAction;
    },
  ) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

/** Defaults: each tone maps to a sensible icon and sound cue. */
const TONE_DEFAULTS: Record<ToastTone, { icon: string; sound: SoundName }> = {
  success: { icon: '✅', sound: 'success' },
  error: { icon: '⚠️', sound: 'error' },
  info: { icon: '💡', sound: 'tap' },
};

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, opts) => {
    const tone = opts?.tone ?? 'info';
    const defaults = TONE_DEFAULTS[tone];
    const id = nextId++;
    set((s) => ({
      toasts: [...s.toasts, { id, message, tone, icon: opts?.icon ?? defaults.icon, action: opts?.action }],
    }));

    const sound = opts?.sound === undefined ? defaults.sound : opts.sound;
    if (sound) playSound(sound);

    // Action toasts stick around longer — the user needs time to read & click.
    const defaultDuration = opts?.action ? 5000 : 2600;
    const duration = opts?.durationMs ?? defaultDuration;
    setTimeout(() => get().dismiss(id), duration);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience helpers for the common cases. */
export const notify = {
  success: (message: string, icon?: string) => useToast.getState().push(message, { tone: 'success', icon }),
  error: (message: string) => useToast.getState().push(message, { tone: 'error' }),
  info: (message: string, icon?: string) => useToast.getState().push(message, { tone: 'info', icon }),
  /** A custom toast with a specific icon/sound (e.g. a coin cue for expenses). */
  custom: (
    message: string,
    opts: { tone?: ToastTone; icon?: string; sound?: SoundName | null; action?: ToastAction },
  ) => useToast.getState().push(message, opts),
};
