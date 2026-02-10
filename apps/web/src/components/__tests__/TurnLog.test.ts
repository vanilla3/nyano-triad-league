import { describe, it, expect } from "vitest";

/* ================================================================
   TurnLog smoke tests — Sprint 20 P0-FLIP verification
   ================================================================ */

describe("TurnLog module exports", () => {
  it("exports TurnLog component (and no legacy explainFlip)", async () => {
    const mod = await import("../TurnLog");
    // TurnLog component must be exported
    expect(typeof mod.TurnLog).toBe("function");
    // The old explainFlip helper must NOT be exported (deleted in P0-FLIP)
    expect((mod as Record<string, unknown>)["explainFlip"]).toBeUndefined();
  });
});

describe("TurnLog depends on flipTraceFull", () => {
  it("flipTraceFull is importable from flipTraceDescribe", async () => {
    const mod = await import("../flipTraceDescribe");
    expect(typeof mod.flipTraceFull).toBe("function");
    expect(typeof mod.flipTracesSummary).toBe("function");
    expect(typeof mod.flipTracesReadout).toBe("function");
  });
});
