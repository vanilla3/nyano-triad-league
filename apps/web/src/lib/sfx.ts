/**
 * sfx.ts — Procedural Sound Effects Engine (NIN-UX-031, D-3)
 *
 * Web Audio API oscillator-based sounds. No audio files needed.
 * Synthesizes game event sounds:
 *   - card_place:     440Hz triangle pop (100ms)
 *   - flip:           330→660Hz sine sweep (200ms)
 *   - chain_flip:     C5-E5-G5 arpeggio (chain combo)
 *   - error_buzz:     100Hz square buzz (150ms)
 *   - victory_fanfare: C5→E6 major scale ascend
 *   - defeat_sad:     E4→A3 descending minor
 *
 * Settings stored in localStorage:
 *   nytl.sfx.muted  — "1"/"0"
 *   nytl.sfx.volume — 0..1 float
 *
 * Respects prefers-reduced-motion: skips all sounds except error_buzz.
 */

import { readBoolSetting, readNumberSetting, writeBoolSetting, writeNumberSetting } from "./local_settings";

export type SfxName =
  | "card_place"
  | "flip"
  | "chain_flip"
  | "error_buzz"
  | "victory_fanfare"
  | "defeat_sad";

export interface SfxEngine {
  play: (name: SfxName) => void;
  setVolume: (v: number) => void;
  getVolume: () => number;
  setMuted: (m: boolean) => void;
  isMuted: () => boolean;
  dispose: () => void;
}

const KEY_MUTED = "nytl.sfx.muted";
const KEY_VOLUME = "nytl.sfx.volume";
const DEFAULT_VOLUME = 0.5;

// Check prefers-reduced-motion
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function createSfxEngine(): SfxEngine {
  let ctx: AudioContext | null = null;
  let muted = readBoolSetting(KEY_MUTED, false);
  let volume = readNumberSetting(KEY_VOLUME, DEFAULT_VOLUME, 0, 1);

  function getCtx(): AudioContext | null {
    if (!ctx) {
      try {
        ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    // Resume if suspended (mobile autoplay policy)
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  }

  function makeGain(audioCtx: AudioContext): GainNode {
    const g = audioCtx.createGain();
    g.gain.value = volume;
    g.connect(audioCtx.destination);
    return g;
  }

  // ── Sound Definitions ─────────────────────────────────────────────

  function playCardPlace(audioCtx: AudioContext) {
    const g = makeGain(audioCtx);
    const osc = audioCtx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.05);
    osc.connect(g);
    osc.start(audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.stop(audioCtx.currentTime + 0.1);
  }

  function playFlip(audioCtx: AudioContext) {
    const g = makeGain(audioCtx);
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(330, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.2);
    osc.connect(g);
    osc.start(audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.stop(audioCtx.currentTime + 0.2);
  }

  function playChainFlip(audioCtx: AudioContext) {
    // C5-E5-G5 arpeggio
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const t = audioCtx.currentTime + i * 0.08;
      const g = makeGain(audioCtx);
      g.gain.setValueAtTime(volume * 0.7, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.connect(g);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  function playErrorBuzz(audioCtx: AudioContext) {
    const g = makeGain(audioCtx);
    g.gain.setValueAtTime(volume * 0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    const osc = audioCtx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.connect(g);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
  }

  function playVictoryFanfare(audioCtx: AudioContext) {
    // C5→D5→E5→F5→G5→A5→B5→C6 ascending major scale
    const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
    notes.forEach((freq, i) => {
      const t = audioCtx.currentTime + i * 0.1;
      const g = makeGain(audioCtx);
      g.gain.setValueAtTime(volume * 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.connect(g);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  function playDefeatSad(audioCtx: AudioContext) {
    // E4→D4→C4→A3 descending minor
    const notes = [329.63, 293.66, 261.63, 220.0];
    notes.forEach((freq, i) => {
      const t = audioCtx.currentTime + i * 0.15;
      const g = makeGain(audioCtx);
      g.gain.setValueAtTime(volume * 0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.connect(g);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // ── Dispatch ──────────────────────────────────────────────────────

  const SOUNDS: Record<SfxName, (ctx: AudioContext) => void> = {
    card_place: playCardPlace,
    flip: playFlip,
    chain_flip: playChainFlip,
    error_buzz: playErrorBuzz,
    victory_fanfare: playVictoryFanfare,
    defeat_sad: playDefeatSad,
  };

  function play(name: SfxName): void {
    if (muted) return;

    // Respect prefers-reduced-motion: only allow error_buzz
    if (prefersReducedMotion() && name !== "error_buzz") return;

    const audioCtx = getCtx();
    if (!audioCtx) return;

    const fn = SOUNDS[name];
    if (fn) {
      try {
        fn(audioCtx);
      } catch {
        // ignore audio errors
      }
    }
  }

  function setVolume(v: number): void {
    volume = Math.max(0, Math.min(1, v));
    writeNumberSetting(KEY_VOLUME, volume);
  }

  function getVolume(): number {
    return volume;
  }

  function setMuted(m: boolean): void {
    muted = m;
    writeBoolSetting(KEY_MUTED, muted);
  }

  function isMutedFn(): boolean {
    return muted;
  }

  function dispose(): void {
    if (ctx) {
      void ctx.close();
      ctx = null;
    }
  }

  return {
    play,
    setVolume,
    getVolume,
    setMuted,
    isMuted: isMutedFn,
    dispose,
  };
}
