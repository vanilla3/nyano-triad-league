import { describe, it, expect } from "vitest";
import {
  IDENTITY_FRAME,
  animDurationsForQuality,
  easePlacement,
  easeFlip,
  interpolatePlacement,
  interpolateFlip,
  computeCellFrame,
  type CellAnimRecord,
  type CellAnimFrame,
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

/* ═══════════════════════════════════════════════════════════════════════════
   Module exports
   ═══════════════════════════════════════════════════════════════════════════ */

describe("cellAnimations module exports", () => {
  it("exports all expected functions and constants", async () => {
    const mod = await import("../renderers/pixi/cellAnimations");
    expect(mod.IDENTITY_FRAME).toBeDefined();
    expect(typeof mod.animDurationsForQuality).toBe("function");
    expect(typeof mod.easePlacement).toBe("function");
    expect(typeof mod.easeFlip).toBe("function");
    expect(typeof mod.interpolatePlacement).toBe("function");
    expect(typeof mod.interpolateFlip).toBe("function");
    expect(typeof mod.computeCellFrame).toBe("function");
  });
});
