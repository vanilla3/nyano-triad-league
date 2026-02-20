/**
 * cellAnimations — pure animation math for PixiJS cell placement & flip.
 *
 * Translates the CSS keyframes from mint-theme.css (mint-cell-place,
 * mint-cell-flip) into frame-by-frame interpolation functions that
 * PixiBattleRenderer applies to per-cell Containers.
 *
 * This file has NO pixi.js dependency — safe for Node.js tests.
 */

import type { VfxQuality } from "@/lib/visual/visualSettings";

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

export type CellAnimKind = "place" | "flip";

/** Tracks a single cell's active animation. */
export interface CellAnimRecord {
  kind: CellAnimKind;
  /** performance.now() when animation was created. */
  startMs: number;
  /** Total duration in ms (from VFX quality). */
  durationMs: number;
  /** Delay before animation begins (for flip cascade stagger). */
  staggerDelayMs: number;
}

/** A single frame of cell visual state. */
export interface CellAnimFrame {
  scaleX: number;
  scaleY: number;
  alpha: number;
  /** Vertical offset in px (placement slam-down). */
  offsetY: number;
  /** Brightness multiplier (1.0 = normal). */
  brightness: number;
}

/** Duration configuration per VFX quality tier. */
export interface AnimDurations {
  placeMs: number;
  flipMs: number;
  flipStaggerMs: number;
}

/** Renderer-side feature gates by VFX quality (kept pure for easy tests). */
export interface VfxFeatureFlags {
  /** Board depth pass (panel shadow + layered frame). */
  boardDepth: boolean;
  /** Board material pattern lines (medium/high only). */
  boardPattern: boolean;
  /** Per-cell soft shadow under card slots. */
  cellShadow: boolean;
  /** Subtle card glass sheen. */
  cardGlass: boolean;
  /** Edge number pill backgrounds for textured cards. */
  edgePill: boolean;
  /** Idle selectable-cell breathe loop. */
  idleBreathe: boolean;
  /** Place/flip brightness pulse overlay. */
  brightnessPulse: boolean;
  /** High-tier event-only foil/holo flash. */
  eventFoilFlash: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

/** Resting state — no animation active. */
export const IDENTITY_FRAME: Readonly<CellAnimFrame> = {
  scaleX: 1,
  scaleY: 1,
  alpha: 1,
  offsetY: 0,
  brightness: 1,
};

/* ═══════════════════════════════════════════════════════════════════════════
   VFX quality → durations
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Map VFX quality tier to animation durations.
 *
 *   off    → 0ms (no animation — identity frame always)
 *   low    → 250ms condensed
 *   medium → 500/600ms (matches CSS)
 *   high   → 500/600ms (same timing as medium; renderer adds foil flash)
 */
export function animDurationsForQuality(quality: VfxQuality): AnimDurations {
  switch (quality) {
    case "off":
      return { placeMs: 0, flipMs: 0, flipStaggerMs: 0 };
    case "low":
      return { placeMs: 250, flipMs: 250, flipStaggerMs: 100 };
    case "medium":
      return { placeMs: 500, flipMs: 600, flipStaggerMs: 200 };
    case "high":
      return { placeMs: 500, flipMs: 600, flipStaggerMs: 200 };
  }
}

/**
 * Map VFX quality tier to renderer feature flags.
 *
 * Off/low intentionally avoid continuous/heavy effects.
 */
export function vfxFeatureFlagsForQuality(quality: VfxQuality): VfxFeatureFlags {
  switch (quality) {
    case "off":
      return {
        boardDepth: false,
        boardPattern: false,
        cellShadow: false,
        cardGlass: false,
        edgePill: false,
        idleBreathe: false,
        brightnessPulse: false,
        eventFoilFlash: false,
      };
    case "low":
      return {
        boardDepth: true,
        boardPattern: false,
        cellShadow: true,
        cardGlass: false,
        edgePill: true,
        idleBreathe: false,
        brightnessPulse: false,
        eventFoilFlash: false,
      };
    case "medium":
      return {
        boardDepth: true,
        boardPattern: true,
        cellShadow: true,
        cardGlass: true,
        edgePill: true,
        idleBreathe: true,
        brightnessPulse: true,
        eventFoilFlash: false,
      };
    case "high":
      return {
        boardDepth: true,
        boardPattern: true,
        cellShadow: true,
        cardGlass: true,
        edgePill: true,
        idleBreathe: true,
        brightnessPulse: true,
        eventFoilFlash: true,
      };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Easing functions
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Placement easing — approximates cubic-bezier(0.34, 1.56, 0.64, 1).
 * Overshoots past 1.0 for bounce effect.
 *
 * Simple polynomial approximation: `t * (2.56 * t * (t - 1) + 1)`
 * which gives overshoot around t=0.5 then settles to 1.0 at t=1.
 */
export function easePlacement(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  // Attempt to approximate the cubic-bezier overshoot
  // f(t) = t + 1.56 * t * (1 - t) * (2t - 1) ... simplified:
  // We use a direct polynomial: 2.7t³ - 5.4t² + 3.7t
  // But let's use the simpler and well-tested form:
  return 1 - Math.pow(1 - t, 3) * (1 - 2.56 * t);
}

/**
 * Flip easing — approximates cubic-bezier(0.4, 0, 0.2, 1).
 * Standard deceleration curve.
 */
export function easeFlip(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  // Smooth deceleration: ease-out cubic with slight adjustment
  const t2 = 1 - t;
  return 1 - t2 * t2 * t2;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Keyframe interpolation
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Linear interpolation helper (also used in tests).
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate placement animation at progress t ∈ [0, 1].
 *
 * Reproduces mint-cell-place keyframes:
 *   0%:   scale(0.5) translateY(-16px) opacity(0) brightness(1)
 *   30%:  scale(1.12) translateY(0)    opacity(1) brightness(1.4)
 *   50%:  scale(0.96)                             brightness(1.1)
 *   70%:  scale(1.04)                             brightness(1)
 *   100%: scale(1)                                brightness(1)
 *
 * @param cellH  Cell height in px (for translateY scaling)
 */
export function interpolatePlacement(t: number, _cellH: number): CellAnimFrame {
  if (t <= 0) {
    return { scaleX: 0.5, scaleY: 0.5, alpha: 0, offsetY: -16, brightness: 1 };
  }
  if (t >= 1) {
    return { ...IDENTITY_FRAME };
  }

  // Keyframe breakpoints
  if (t <= 0.3) {
    // 0% → 30%
    const p = t / 0.3;
    return {
      scaleX: lerp(0.5, 1.12, p),
      scaleY: lerp(0.5, 1.12, p),
      alpha: lerp(0, 1, p),
      offsetY: lerp(-16, 0, p),
      brightness: lerp(1, 1.4, p),
    };
  }
  if (t <= 0.5) {
    // 30% → 50%
    const p = (t - 0.3) / 0.2;
    return {
      scaleX: lerp(1.12, 0.96, p),
      scaleY: lerp(1.12, 0.96, p),
      alpha: 1,
      offsetY: 0,
      brightness: lerp(1.4, 1.1, p),
    };
  }
  if (t <= 0.7) {
    // 50% → 70%
    const p = (t - 0.5) / 0.2;
    return {
      scaleX: lerp(0.96, 1.04, p),
      scaleY: lerp(0.96, 1.04, p),
      alpha: 1,
      offsetY: 0,
      brightness: lerp(1.1, 1, p),
    };
  }
  // 70% → 100%
  const p = (t - 0.7) / 0.3;
  return {
    scaleX: lerp(1.04, 1, p),
    scaleY: lerp(1.04, 1, p),
    alpha: 1,
    offsetY: 0,
    brightness: lerp(1, 1, p),
  };
}

/**
 * Interpolate flip animation at progress t ∈ [0, 1].
 *
 * Simulates rotateY using scaleX (2D-only approach):
 *   0%:   scaleX(1)  scaleY(1)    brightness(1)
 *   25%:  scaleX(0)  scaleY(1.06) brightness(0.7)   ← edge-on
 *   50%:  scaleX(-1) scaleY(1.08) brightness(1.5)   ← "back face"
 *   75%:  scaleX(0)  scaleY(1.04) brightness(1.2)
 *   100%: scaleX(1)  scaleY(1)    brightness(1)
 */
export function interpolateFlip(t: number): CellAnimFrame {
  if (t <= 0) {
    return { ...IDENTITY_FRAME };
  }
  if (t >= 1) {
    return { ...IDENTITY_FRAME };
  }

  if (t <= 0.25) {
    // 0% → 25%
    const p = t / 0.25;
    return {
      scaleX: lerp(1, 0, p),
      scaleY: lerp(1, 1.06, p),
      alpha: 1,
      offsetY: 0,
      brightness: lerp(1, 0.7, p),
    };
  }
  if (t <= 0.5) {
    // 25% → 50%
    const p = (t - 0.25) / 0.25;
    return {
      scaleX: lerp(0, -1, p),
      scaleY: lerp(1.06, 1.08, p),
      alpha: 1,
      offsetY: 0,
      brightness: lerp(0.7, 1.5, p),
    };
  }
  if (t <= 0.75) {
    // 50% → 75%
    const p = (t - 0.5) / 0.25;
    return {
      scaleX: lerp(-1, 0, p),
      scaleY: lerp(1.08, 1.04, p),
      alpha: 1,
      offsetY: 0,
      brightness: lerp(1.5, 1.2, p),
    };
  }
  // 75% → 100%
  const p = (t - 0.75) / 0.25;
  return {
    scaleX: lerp(0, 1, p),
    scaleY: lerp(1.04, 1, p),
    alpha: 1,
    offsetY: 0,
    brightness: lerp(1.2, 1, p),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Master frame computation
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Compute the visual frame for a cell animation at a given time.
 *
 * Returns `null` if the animation has completed (caller should remove record
 * and reset to IDENTITY_FRAME).
 *
 * @param record   The animation record (null = no animation)
 * @param nowMs    Current time (performance.now())
 * @param cellH    Cell height in px (for placement offsetY scaling)
 */
export function computeCellFrame(
  record: CellAnimRecord | null,
  nowMs: number,
  cellH: number,
): CellAnimFrame | null {
  if (!record) return null;

  // Duration 0 = animation disabled (VFX off)
  if (record.durationMs <= 0) return null;

  const elapsed = nowMs - record.startMs - record.staggerDelayMs;

  // Stagger delay hasn't elapsed yet — hold initial state
  if (elapsed < 0) {
    return record.kind === "place"
      ? interpolatePlacement(0, cellH)
      : interpolateFlip(0);
  }

  const rawT = elapsed / record.durationMs;

  // Animation complete
  if (rawT >= 1) return null;

  // Apply easing
  const easedT = record.kind === "place"
    ? easePlacement(rawT)
    : easeFlip(rawT);

  return record.kind === "place"
    ? interpolatePlacement(easedT, cellH)
    : interpolateFlip(easedT);
}

/**
 * Compute normalized animation progress [0, 1] from a record and current time.
 * Useful for effect layers that should sweep once per event (not per wall-clock).
 */
export function animationProgress(record: CellAnimRecord, nowMs: number): number {
  if (record.durationMs <= 0) return 1;
  const elapsed = nowMs - record.startMs - record.staggerDelayMs;
  if (elapsed <= 0) return 0;
  if (elapsed >= record.durationMs) return 1;
  return elapsed / record.durationMs;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Breathe glow (selectable empty cells)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Breathe animation cycle duration in ms (matches CSS 2.5s infinite). */
export const BREATHE_CYCLE_MS = 2500;

/** Return type for breathe glow frame. */
export interface BreatheFrame {
  /** Scale factor for the cell content container (1.0 → 1.02). */
  scale: number;
  /** Alpha for the glow ring stroke (0 → 0.25). */
  glowAlpha: number;
}

/**
 * Compute breathe glow frame at a given time.
 *
 * Reproduces the `mint-breathe` CSS keyframe:
 *   0%, 100%: scale(1), box-shadow alpha = 0
 *   50%:      scale(1.02), box-shadow alpha = 0.25
 *
 * Uses sin() for smooth infinite loop — no record/startMs needed.
 *
 * @param nowMs    Current time (performance.now())
 * @param quality  VFX quality for amplitude gating
 */
export function computeBreatheFrame(
  nowMs: number,
  quality: VfxQuality = "high",
): BreatheFrame {
  if (!vfxFeatureFlagsForQuality(quality).idleBreathe) {
    return { scale: 1, glowAlpha: 0 };
  }

  const ampScale = quality === "high" ? 0.02 : 0.012;
  const ampAlpha = quality === "high" ? 0.25 : 0.16;
  const t = (nowMs % BREATHE_CYCLE_MS) / BREATHE_CYCLE_MS;
  const sin = Math.sin(t * Math.PI * 2);
  // Remap sin [-1, 1] → [0, 1]
  const p = (sin + 1) / 2;
  return {
    scale: 1 + ampScale * p,
    glowAlpha: ampAlpha * p,
  };
}
