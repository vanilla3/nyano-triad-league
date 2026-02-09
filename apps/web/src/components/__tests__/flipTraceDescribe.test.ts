import { describe, it, expect } from "vitest";
import type { FlipTraceV1 } from "@nyano/triad-engine";
import {
  flipTraceShort,
  flipTraceFull,
  flipTracesSummary,
  flipTracesReadout,
} from "../flipTraceDescribe";

/* ------------------------------------------------------------------ */
/* Helper                                                              */
/* ------------------------------------------------------------------ */

function makeTrace(overrides: Partial<FlipTraceV1> = {}): FlipTraceV1 {
  return {
    from: 4,
    to: 1,
    kind: "ortho",
    dir: "up",
    aVal: 7,
    dVal: 6,
    isChain: false,
    tieBreak: false,
    ...overrides,
  } as FlipTraceV1;
}

/* ------------------------------------------------------------------ */
/* flipTraceShort                                                      */
/* ------------------------------------------------------------------ */

describe("flipTraceShort", () => {
  it("ortho up, 7>6, no tags", () => {
    expect(flipTraceShort(makeTrace())).toBe("↑ 7>6");
  });

  it("ortho left, equal values with tieBreak", () => {
    expect(
      flipTraceShort(makeTrace({ dir: "left", aVal: 5, dVal: 5, tieBreak: true })),
    ).toBe("← 5=5 じゃんけん勝ち");
  });

  it("diag up-left, chain", () => {
    expect(
      flipTraceShort(
        makeTrace({ kind: "diag", vert: "up", horiz: "left", aVal: 8, dVal: 3, isChain: true }),
      ),
    ).toBe("↖ 8>3 連鎖・斜め");
  });

  it("diag down-right, plain (no chain, no tieBreak)", () => {
    expect(
      flipTraceShort(
        makeTrace({ kind: "diag", vert: "down", horiz: "right", aVal: 4, dVal: 3 }),
      ),
    ).toBe("↘ 4>3 斜め");
  });

  it("ortho down, equal values, chain+tieBreak", () => {
    expect(
      flipTraceShort(
        makeTrace({ dir: "down", aVal: 5, dVal: 5, isChain: true, tieBreak: true }),
      ),
    ).toBe("↓ 5=5 じゃんけん勝ち・連鎖");
  });

  it("ortho right arrow", () => {
    expect(
      flipTraceShort(makeTrace({ dir: "right", aVal: 9, dVal: 3 })),
    ).toBe("→ 9>3");
  });

  it("diag up-right arrow", () => {
    expect(
      flipTraceShort(
        makeTrace({ kind: "diag", vert: "up", horiz: "right", aVal: 6, dVal: 2 }),
      ),
    ).toBe("↗ 6>2 斜め");
  });

  it("diag down-left arrow", () => {
    expect(
      flipTraceShort(
        makeTrace({ kind: "diag", vert: "down", horiz: "left", aVal: 3, dVal: 1 }),
      ),
    ).toBe("↙ 3>1 斜め");
  });
});

/* ------------------------------------------------------------------ */
/* flipTraceFull                                                       */
/* ------------------------------------------------------------------ */

describe("flipTraceFull", () => {
  it("ortho up, 7>6 で奪取", () => {
    // from=4 → B2, to=1 → B1
    expect(flipTraceFull(makeTrace())).toBe("B2→B1: 上方向 7>6 で奪取");
  });

  it("ortho left, 5=5 じゃんけんで勝ち", () => {
    // from=4 → B2, to=3 → A2
    expect(
      flipTraceFull(makeTrace({ to: 3, dir: "left", aVal: 5, dVal: 5, tieBreak: true })),
    ).toBe("B2→A2: 左方向 5=5 じゃんけんで勝ち");
  });

  it("diag up-right, 9>4 で奪取", () => {
    // from=6 → A3, to=1 → B1
    expect(
      flipTraceFull(
        makeTrace({ from: 6, to: 1, kind: "diag", vert: "up", horiz: "right", aVal: 9, dVal: 4 }),
      ),
    ).toBe("A3→B1: 上右斜め 9>4 で奪取");
  });

  it("chain prefix 【連鎖】", () => {
    expect(
      flipTraceFull(makeTrace({ isChain: true })),
    ).toBe("【連鎖】B2→B1: 上方向 7>6 で奪取");
  });

  it("equal values, no tieBreak → no で奪取", () => {
    // from=0 → A1, to=1 → B1
    expect(
      flipTraceFull(makeTrace({ from: 0, to: 1, dir: "right", aVal: 5, dVal: 5 })),
    ).toBe("A1→B1: 右方向 5=5");
  });

  it("diag with chain and tieBreak", () => {
    // from=8 → C3, to=4 → B2
    expect(
      flipTraceFull(
        makeTrace({
          from: 8, to: 4, kind: "diag", vert: "up", horiz: "left",
          aVal: 6, dVal: 6, isChain: true, tieBreak: true,
        }),
      ),
    ).toBe("【連鎖】C3→B2: 上左斜め 6=6 じゃんけんで勝ち");
  });
});

/* ------------------------------------------------------------------ */
/* flipTracesSummary                                                   */
/* ------------------------------------------------------------------ */

describe("flipTracesSummary", () => {
  it("empty → 奪取なし", () => {
    expect(flipTracesSummary([])).toBe("奪取なし");
  });

  it("1 plain ortho flip", () => {
    expect(flipTracesSummary([makeTrace()])).toBe("1枚奪取");
  });

  it("2 flips, 1 chain", () => {
    expect(
      flipTracesSummary([
        makeTrace(),
        makeTrace({ isChain: true }),
      ]),
    ).toBe("2枚奪取（連鎖1）");
  });

  it("3 flips: chain + janken + diag", () => {
    expect(
      flipTracesSummary([
        makeTrace({ isChain: true }),
        makeTrace({ tieBreak: true }),
        makeTrace({ kind: "diag", vert: "up", horiz: "right" }),
      ]),
    ).toBe("3枚奪取（連鎖1・じゃんけん1・斜め1）");
  });

  it("multiple diag flips counted", () => {
    expect(
      flipTracesSummary([
        makeTrace({ kind: "diag", vert: "up", horiz: "left" }),
        makeTrace({ kind: "diag", vert: "down", horiz: "right" }),
      ]),
    ).toBe("2枚奪取（斜め2）");
  });
});

/* ------------------------------------------------------------------ */
/* flipTracesReadout                                                   */
/* ------------------------------------------------------------------ */

describe("flipTracesReadout", () => {
  it("no flips → player が coord に配置", () => {
    expect(flipTracesReadout([], "Player1", 4)).toBe("Player1がB2に配置");
  });

  it("1 flip → 奪取 single cell", () => {
    expect(
      flipTracesReadout([makeTrace({ to: 1 })], "にゃの", 4),
    ).toBe("にゃのがB2に配置 → B1を奪取");
  });

  it("2 flips → cells joined with ・", () => {
    expect(
      flipTracesReadout(
        [makeTrace({ to: 0 }), makeTrace({ to: 2 })],
        "AI",
        4,
      ),
    ).toBe("AIがB2に配置 → A1・C1を奪取");
  });

  it("chain flip → adds 連鎖あり！", () => {
    expect(
      flipTracesReadout([makeTrace({ to: 1, isChain: true })], "Cat", 4),
    ).toBe("CatがB2に配置 → B1を奪取（連鎖あり！）");
  });

  it("multiple flips with chain → 連鎖あり！ appended", () => {
    expect(
      flipTracesReadout(
        [makeTrace({ to: 3 }), makeTrace({ to: 5, isChain: true })],
        "Neko",
        0,
      ),
    ).toBe("NekoがA1に配置 → A2・C2を奪取（連鎖あり！）");
  });
});
