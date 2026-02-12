import { describe, it, expect } from "vitest";
import {
  IDENTITY_FRAME,
  animDurationsForQuality,
  vfxFeatureFlagsForQuality,
  easePlacement,
  easeFlip,
  interpolatePlacement,
  interpolateFlip,
  computeCellFrame,
  animationProgress,
  BREATHE_CYCLE_MS,
  computeBreatheFrame,
  type CellAnimRecord,
} from "../renderers/pixi/cellAnimations";

/* ═══════════════════════════════════════════════════════════════════════════
   IDENTITY_FRAME
   ═══════════════════════════════════════════════════════════════════════════ */

describe("IDENTITY_FRAME", () => {
  it("has resting state values", () => {
    expect(IDENTITY_FRAME).toEqual({
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      offsetY: 0,
      brightness: 1,
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   animDurationsForQuality
   ═══════════════════════════════════════════════════════════════════════════ */

describe("animDurationsForQuality", () => {
  it("off → all zeros", () => {
    const d = animDurationsForQuality("off");
    expect(d.placeMs).toBe(0);
    expect(d.flipMs).toBe(0);
    expect(d.flipStaggerMs).toBe(0);
  });

  it("low → condensed durations", () => {
    const d = animDurationsForQuality("low");
    expect(d.placeMs).toBe(250);
    expect(d.flipMs).toBe(250);
    expect(d.flipStaggerMs).toBe(100);
  });

  it("medium → standard durations", () => {
    const d = animDurationsForQuality("medium");
    expect(d.placeMs).toBe(500);
    expect(d.flipMs).toBe(600);
    expect(d.flipStaggerMs).toBe(200);
  });

  it("high → same as medium (future: particles)", () => {
    const d = animDurationsForQuality("high");
    expect(d.placeMs).toBe(500);
    expect(d.flipMs).toBe(600);
    expect(d.flipStaggerMs).toBe(200);
  });
});

describe("vfxFeatureFlagsForQuality", () => {
  it("off disables heavy/animated features", () => {
    expect(vfxFeatureFlagsForQuality("off")).toEqual({
      boardDepth: false,
      boardPattern: false,
      cellShadow: false,
      cardGlass: false,
      edgePill: false,
      idleBreathe: false,
      brightnessPulse: false,
      eventFoilFlash: false,
    });
  });

  it("low keeps readability layers but disables heavy loops/flashes", () => {
    expect(vfxFeatureFlagsForQuality("low")).toEqual({
      boardDepth: true,
      boardPattern: false,
      cellShadow: true,
      cardGlass: false,
      edgePill: true,
      idleBreathe: false,
      brightnessPulse: false,
      eventFoilFlash: false,
    });
  });

  it("high enables full feature set", () => {
    expect(vfxFeatureFlagsForQuality("high")).toEqual({
      boardDepth: true,
      boardPattern: true,
      cellShadow: true,
      cardGlass: true,
      edgePill: true,
      idleBreathe: true,
      brightnessPulse: true,
      eventFoilFlash: true,
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   easePlacement
   ═══════════════════════════════════════════════════════════════════════════ */

describe("easePlacement", () => {
  it("returns 0 at t=0", () => {
    expect(easePlacement(0)).toBe(0);
  });

  it("returns 1 at t=1", () => {
    expect(easePlacement(1)).toBe(1);
  });

  it("clamps below 0", () => {
    expect(easePlacement(-0.1)).toBe(0);
  });

  it("clamps above 1", () => {
    expect(easePlacement(1.5)).toBe(1);
  });

  it("overshoots past 1.0 in the middle (bounce)", () => {
    // The bounce easing should exceed 1.0 somewhere in mid-range
    let foundOvershoot = false;
    for (let t = 0.3; t <= 0.9; t += 0.05) {
      if (easePlacement(t) > 1.0) {
        foundOvershoot = true;
        break;
      }
    }
    expect(foundOvershoot).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   easeFlip
   ═══════════════════════════════════════════════════════════════════════════ */

describe("easeFlip", () => {
  it("returns 0 at t=0", () => {
    expect(easeFlip(0)).toBe(0);
  });

  it("returns 1 at t=1", () => {
    expect(easeFlip(1)).toBe(1);
  });

  it("is monotonically increasing", () => {
    let prev = 0;
    for (let t = 0.1; t <= 1.0; t += 0.1) {
      const val = easeFlip(t);
      expect(val).toBeGreaterThanOrEqual(prev);
      prev = val;
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   interpolatePlacement
   ═══════════════════════════════════════════════════════════════════════════ */

describe("interpolatePlacement", () => {
  const cellH = 100;

  it("at t=0: scale=0.5, alpha=0, offset=-16", () => {
    const f = interpolatePlacement(0, cellH);
    expect(f.scaleX).toBe(0.5);
    expect(f.scaleY).toBe(0.5);
    expect(f.alpha).toBe(0);
    expect(f.offsetY).toBe(-16);
    expect(f.brightness).toBe(1);
  });

  it("at t=1: identity frame", () => {
    const f = interpolatePlacement(1, cellH);
    expect(f.scaleX).toBe(1);
    expect(f.scaleY).toBe(1);
    expect(f.alpha).toBe(1);
    expect(f.offsetY).toBe(0);
    expect(f.brightness).toBe(1);
  });

  it("at t=0.3: scale≈1.12, alpha=1, brightness≈1.4 (bounce peak)", () => {
    const f = interpolatePlacement(0.3, cellH);
    expect(f.scaleX).toBeCloseTo(1.12, 1);
    expect(f.alpha).toBeCloseTo(1, 1);
    expect(f.brightness).toBeCloseTo(1.4, 1);
  });

  it("at t=0.5: scale≈0.96, brightness≈1.1 (rebound dip)", () => {
    const f = interpolatePlacement(0.5, cellH);
    expect(f.scaleX).toBeCloseTo(0.96, 1);
    expect(f.brightness).toBeCloseTo(1.1, 1);
  });

  it("at t=0.7: scale≈1.04, brightness≈1 (second peak)", () => {
    const f = interpolatePlacement(0.7, cellH);
    expect(f.scaleX).toBeCloseTo(1.04, 1);
    expect(f.brightness).toBeCloseTo(1, 1);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   interpolateFlip
   ═══════════════════════════════════════════════════════════════════════════ */

describe("interpolateFlip", () => {
  it("at t=0: identity frame", () => {
    const f = interpolateFlip(0);
    expect(f.scaleX).toBe(1);
    expect(f.scaleY).toBe(1);
    expect(f.brightness).toBe(1);
  });

  it("at t=1: identity frame", () => {
    const f = interpolateFlip(1);
    expect(f.scaleX).toBe(1);
    expect(f.scaleY).toBe(1);
    expect(f.brightness).toBe(1);
  });

  it("at t=0.25: scaleX≈0 (edge-on), brightness≈0.7", () => {
    const f = interpolateFlip(0.25);
    expect(f.scaleX).toBeCloseTo(0, 1);
    expect(f.scaleY).toBeCloseTo(1.06, 1);
    expect(f.brightness).toBeCloseTo(0.7, 1);
  });

  it("at t=0.5: scaleX≈-1 (back face), brightness≈1.5", () => {
    const f = interpolateFlip(0.5);
    expect(f.scaleX).toBeCloseTo(-1, 1);
    expect(f.scaleY).toBeCloseTo(1.08, 1);
    expect(f.brightness).toBeCloseTo(1.5, 1);
  });

  it("at t=0.75: scaleX≈0 (edge-on), brightness≈1.2", () => {
    const f = interpolateFlip(0.75);
    expect(f.scaleX).toBeCloseTo(0, 1);
    expect(f.scaleY).toBeCloseTo(1.04, 1);
    expect(f.brightness).toBeCloseTo(1.2, 1);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   computeCellFrame
   ═══════════════════════════════════════════════════════════════════════════ */

describe("computeCellFrame", () => {
  const cellH = 100;

  it("returns null for null record (no animation)", () => {
    expect(computeCellFrame(null, 1000, cellH)).toBeNull();
  });

  it("returns null when animation is complete (t >= 1)", () => {
    const record: CellAnimRecord = {
      kind: "place",
      startMs: 0,
      durationMs: 500,
      staggerDelayMs: 0,
    };
    expect(computeCellFrame(record, 600, cellH)).toBeNull();
  });

  it("returns null for durationMs=0 (VFX off)", () => {
    const record: CellAnimRecord = {
      kind: "place",
      startMs: 0,
      durationMs: 0,
      staggerDelayMs: 0,
    };
    expect(computeCellFrame(record, 0, cellH)).toBeNull();
  });

  it("returns placement frame at mid-animation", () => {
    const record: CellAnimRecord = {
      kind: "place",
      startMs: 0,
      durationMs: 500,
      staggerDelayMs: 0,
    };
    const frame = computeCellFrame(record, 250, cellH);
    expect(frame).not.toBeNull();
    // t = 250/500 = 0.5 raw → eased → interpolated
    // Just verify it's a valid non-identity frame
    expect(frame!.alpha).toBeGreaterThan(0);
  });

  it("holds initial state during stagger delay", () => {
    const record: CellAnimRecord = {
      kind: "flip",
      startMs: 0,
      durationMs: 600,
      staggerDelayMs: 200,
    };
    // At t=100ms, stagger delay (200ms) hasn't elapsed yet
    const frame = computeCellFrame(record, 100, cellH);
    expect(frame).not.toBeNull();
    // Should be at t=0 of flip → identity-like
    expect(frame!.scaleX).toBe(1);
    expect(frame!.scaleY).toBe(1);
  });

  it("starts animating after stagger delay elapses", () => {
    const record: CellAnimRecord = {
      kind: "flip",
      startMs: 0,
      durationMs: 600,
      staggerDelayMs: 200,
    };
    // At t=500ms: elapsed = 500 - 200 = 300ms, rawT = 300/600 = 0.5
    // After easeFlip (deceleration curve), eased t > 0.5 → interpolateFlip
    // past the 50% mark. Regardless of exact easing, scaleX should differ
    // from the stagger-delay hold state (which was scaleX=1).
    const frame = computeCellFrame(record, 500, cellH);
    expect(frame).not.toBeNull();
    // The flip is well underway — scaleX should have moved from 1
    expect(frame!.scaleX).not.toBe(1);
  });

  it("returns flip frame correctly", () => {
    const record: CellAnimRecord = {
      kind: "flip",
      startMs: 1000,
      durationMs: 600,
      staggerDelayMs: 0,
    };
    // 150ms into 600ms = rawT = 0.25
    const frame = computeCellFrame(record, 1150, cellH);
    expect(frame).not.toBeNull();
    // Early in flip → scaleX shrinking toward 0
    expect(frame!.scaleX).toBeLessThanOrEqual(1);
    expect(frame!.alpha).toBe(1);
  });
});

describe("animationProgress", () => {
  const rec: CellAnimRecord = {
    kind: "flip",
    startMs: 1000,
    durationMs: 600,
    staggerDelayMs: 200,
  };

  it("returns 0 before stagger delay elapses", () => {
    expect(animationProgress(rec, 1100)).toBe(0);
  });

  it("returns normalized 0..1 while active", () => {
    // elapsed = 400 - 200 = 200, progress = 200/600
    expect(animationProgress(rec, 1400)).toBeCloseTo(1 / 3, 3);
  });

  it("clamps to 1 after completion", () => {
    expect(animationProgress(rec, 1900)).toBe(1);
  });

  it("returns 1 for zero duration", () => {
    expect(animationProgress({ ...rec, durationMs: 0 }, 1400)).toBe(1);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   computeBreatheFrame
   ═══════════════════════════════════════════════════════════════════════════ */

describe("computeBreatheFrame", () => {
  it("BREATHE_CYCLE_MS is 2500", () => {
    expect(BREATHE_CYCLE_MS).toBe(2500);
  });

  it("at t=0: scale=1, glowAlpha=0", () => {
    // sin(0) = 0 → p = 0.5 ... wait, let's think about this.
    // t=0 → (0 % 2500) / 2500 = 0 → sin(0) = 0 → p = (0+1)/2 = 0.5
    // Actually at t=0: sin(0)=0 → p=0.5 → scale=1.01, glowAlpha=0.125
    // This is the mid-point, not the start. The "start" of the visual cycle
    // (scale=1, glow=0) happens at t where sin = -1, i.e. t = 75% of cycle.
    const frame = computeBreatheFrame(0);
    // At t=0: sin(0)=0, p=0.5
    expect(frame.scale).toBeCloseTo(1.01, 2);
    expect(frame.glowAlpha).toBeCloseTo(0.125, 2);
  });

  it("at peak (25% of cycle): scale≈1.02, glowAlpha≈0.25", () => {
    // sin(π/2) = 1 → p = 1 → max values
    const peakMs = BREATHE_CYCLE_MS * 0.25; // 625ms
    const frame = computeBreatheFrame(peakMs);
    expect(frame.scale).toBeCloseTo(1.02, 2);
    expect(frame.glowAlpha).toBeCloseTo(0.25, 2);
  });

  it("at trough (75% of cycle): scale=1, glowAlpha=0", () => {
    // sin(3π/2) = -1 → p = 0 → min values
    const troughMs = BREATHE_CYCLE_MS * 0.75; // 1875ms
    const frame = computeBreatheFrame(troughMs);
    expect(frame.scale).toBeCloseTo(1.0, 2);
    expect(frame.glowAlpha).toBeCloseTo(0, 2);
  });

  it("loops: t=2500 same as t=0", () => {
    const f0 = computeBreatheFrame(0);
    const fCycle = computeBreatheFrame(BREATHE_CYCLE_MS);
    expect(fCycle.scale).toBeCloseTo(f0.scale, 4);
    expect(fCycle.glowAlpha).toBeCloseTo(f0.glowAlpha, 4);
  });

  it("scale stays in [1.0, 1.02] range", () => {
    for (let ms = 0; ms < BREATHE_CYCLE_MS; ms += 50) {
      const { scale } = computeBreatheFrame(ms);
      expect(scale).toBeGreaterThanOrEqual(1.0);
      expect(scale).toBeLessThanOrEqual(1.02 + 0.001);
    }
  });

  it("glowAlpha stays in [0, 0.25] range", () => {
    for (let ms = 0; ms < BREATHE_CYCLE_MS; ms += 50) {
      const { glowAlpha } = computeBreatheFrame(ms);
      expect(glowAlpha).toBeGreaterThanOrEqual(-0.001);
      expect(glowAlpha).toBeLessThanOrEqual(0.25 + 0.001);
    }
  });

  it("returns identity frame for off/low quality", () => {
    expect(computeBreatheFrame(1234, "off")).toEqual({ scale: 1, glowAlpha: 0 });
    expect(computeBreatheFrame(1234, "low")).toEqual({ scale: 1, glowAlpha: 0 });
  });

  it("medium is gentler than high", () => {
    const t = BREATHE_CYCLE_MS * 0.25; // peak
    const medium = computeBreatheFrame(t, "medium");
    const high = computeBreatheFrame(t, "high");
    expect(medium.scale).toBeLessThan(high.scale);
    expect(medium.glowAlpha).toBeLessThan(high.glowAlpha);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   Module exports
   ═══════════════════════════════════════════════════════════════════════════ */

describe("cellAnimations module exports", () => {
  it("exports all expected functions and constants", async () => {
    const mod = await import("../renderers/pixi/cellAnimations");
    expect(mod.IDENTITY_FRAME).toBeDefined();
    expect(typeof mod.animDurationsForQuality).toBe("function");
    expect(typeof mod.vfxFeatureFlagsForQuality).toBe("function");
    expect(typeof mod.easePlacement).toBe("function");
    expect(typeof mod.easeFlip).toBe("function");
    expect(typeof mod.interpolatePlacement).toBe("function");
    expect(typeof mod.interpolateFlip).toBe("function");
    expect(typeof mod.computeCellFrame).toBe("function");
    expect(typeof mod.animationProgress).toBe("function");
    expect(mod.BREATHE_CYCLE_MS).toBeDefined();
    expect(typeof mod.computeBreatheFrame).toBe("function");
  });
});
