import { create } from 'zustand';

/**
 * Sound effects synthesized at runtime with the Web Audio API — no audio asset
 * files, so the bundle stays lean and TypeScript-only. Sounds are short, soft
 * cues meant to reward actions without being annoying.
 */
export type SoundName =
  | 'tap'
  | 'coin'
  | 'success'
  | 'levelUp'
  | 'badge'
  | 'error'
  | 'sweep' // tab / section navigation
  | 'pop' // opening an item (e.g. a goal)
  | 'whoosh' // opening the add-expense sheet
  | 'save'; // committing a form (assets, profile, etc.)

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

/** Schedule a tone that glides between two frequencies (for sweeps/whooshes). */
function glide(c: AudioContext, from: number, to: number, start: number, dur: number, type: OscillatorType, gain: number): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.015);
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
  // A quick upward swish for moving between tabs/sections.
  sweep: (c, t) => glide(c, 360, 840, t, 0.13, 'sine', 0.045),
  // A soft two-step "blip up" when opening an item.
  pop: (c, t) => {
    tone(c, 740, t, 0.06, 'sine', 0.06);
    tone(c, 1110, t + 0.05, 0.09, 'sine', 0.06);
  },
  // A downward-to-up airy whoosh when a sheet/modal slides in.
  whoosh: (c, t) => glide(c, 220, 540, t, 0.2, 'triangle', 0.05),
  // A warm two-note confirm for committing a form.
  save: (c, t) => {
    tone(c, 660, t, 0.1, 'sine', 0.08);
    tone(c, 988, t + 0.09, 0.18, 'sine', 0.08);
  },
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
