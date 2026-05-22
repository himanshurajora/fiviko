import { create } from 'zustand';

/**
 * Sound effects synthesized at runtime with the Web Audio API — no audio asset
 * files, so the bundle stays lean and TypeScript-only. Sounds are short, soft
 * cues meant to reward actions without being annoying.
 */
export type SoundName = 'tap' | 'coin' | 'success' | 'levelUp' | 'badge' | 'error';

const STORAGE_KEY = 'fiviko_sound';

interface SoundState {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (v: boolean) => void;
}

export const useSound = create<SoundState>((set) => ({
  enabled: typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) !== 'off' : true,
  toggle: () =>
    set((s) => {
      const enabled = !s.enabled;
      localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
      return { enabled };
    }),
  setEnabled: (enabled) => {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    set({ enabled });
  },
}));

let ctx: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/** Schedule a single enveloped tone. */
function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain: number): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

const RECIPES: Record<SoundName, (c: AudioContext, t: number) => void> = {
  tap: (c, t) => tone(c, 660, t, 0.08, 'sine', 0.06),
  coin: (c, t) => {
    tone(c, 988, t, 0.08, 'square', 0.08);
    tone(c, 1319, t + 0.07, 0.16, 'square', 0.08);
  },
  success: (c, t) => [523, 659, 784].forEach((f, i) => tone(c, f, t + i * 0.08, 0.2, 'sine', 0.09)),
  levelUp: (c, t) => [523, 659, 784, 1047].forEach((f, i) => tone(c, f, t + i * 0.1, 0.24, 'triangle', 0.1)),
  badge: (c, t) => [1047, 1319, 1568].forEach((f, i) => tone(c, f, t + i * 0.07, 0.2, 'sine', 0.08)),
  error: (c, t) => tone(c, 196, t, 0.22, 'sawtooth', 0.06),
};

/** Play a named sound cue, unless the user has muted sounds. */
export function playSound(name: SoundName): void {
  if (!useSound.getState().enabled) return;
  const c = audioCtx();
  if (!c) return;
  // Browsers start the context suspended until a user gesture; resume on demand.
  if (c.state === 'suspended') void c.resume();
  try {
    RECIPES[name](c, c.currentTime);
  } catch {
    /* audio is best-effort; never break a user action over a failed cue */
  }
}
