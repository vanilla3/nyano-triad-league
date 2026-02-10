import { describe, it, expect } from "vitest";
import {
  fnv1a32Hex,
  cellCoordToIndex,
  cellIndexToCoord,
  parseCellAny,
  toViewerMoveText,
  computeToPlay,
  computeEmptyCells,
  computeRemainingCardIndices,
  computeWarningMarksUsed,
  computeWarningMarksRemaining,
  computeStrictAllowed,
} from "../triad_vote_utils";
import type { OverlayStateV1 } from "../streamer_bus";

/* ═══════════════════════════════════════════════════════════════════
   triad_vote_utils.test.ts
   Unit tests for vote computation, cell coordinates, and FNV-1a hash.
   ═══════════════════════════════════════════════════════════════════ */

/** Minimal OverlayStateV1 factory for tests. */
function makeState(overrides: Partial<OverlayStateV1> & Record<string, unknown> = {}): OverlayStateV1 {
  return {
    version: 1,
    updatedAtMs: Date.now(),
    mode: "live",
    ...overrides,
  } as OverlayStateV1;
}

// ── fnv1a32Hex ──────────────────────────────────────────────────────

describe("fnv1a32Hex", () => {
  it("returns offset basis for empty string", () => {
    expect(fnv1a32Hex("")).toBe("0x811c9dc5");
  });

  it("is deterministic (same input → same hash)", () => {
    const h1 = fnv1a32Hex("hello");
    const h2 = fnv1a32Hex("hello");
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different inputs", () => {
    expect(fnv1a32Hex("a")).not.toBe(fnv1a32Hex("b"));
  });

  it("output starts with 0x and has 10 chars total", () => {
    const h = fnv1a32Hex("test");
    expect(h).toMatch(/^0x[0-9a-f]{8}$/);
  });
});

// ── cellCoordToIndex / cellIndexToCoord ─────────────────────────────

describe("cellCoordToIndex (vote_utils)", () => {
  it("maps A1 to 0 and C3 to 8", () => {
    expect(cellCoordToIndex("A1")).toBe(0);
    expect(cellCoordToIndex("C3")).toBe(8);
  });

  it("all 9 coords roundtrip", () => {
    const coords = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"];
    for (let i = 0; i < 9; i++) {
      expect(cellCoordToIndex(coords[i])).toBe(i);
      expect(cellIndexToCoord(i)).toBe(coords[i]);
    }
  });

  it("returns null for invalid input", () => {
    expect(cellCoordToIndex("Z9")).toBeNull();
    expect(cellCoordToIndex("")).toBeNull();
    expect(cellCoordToIndex("A0")).toBeNull();
  });
});

// ── parseCellAny ────────────────────────────────────────────────────

describe("parseCellAny", () => {
  it("parses digit 0 and 8", () => {
    expect(parseCellAny("0")).toBe(0);
    expect(parseCellAny("8")).toBe(8);
  });

  it("rejects digit 9 (out of range)", () => {
    expect(parseCellAny("9")).toBeNull();
  });

  it("parses coordinate B2", () => {
    expect(parseCellAny("B2")).toBe(4);
  });
});

// ── toViewerMoveText ────────────────────────────────────────────────

describe("toViewerMoveText", () => {
  it("formats a basic move", () => {
    expect(toViewerMoveText({ cell: 4, cardIndex: 1 })).toBe("#triad A2->B2");
  });

  it("formats with warning mark", () => {
    expect(toViewerMoveText({ cell: 0, cardIndex: 2, warningMarkCell: 8 })).toBe(
      "#triad A3->A1 wm=C3",
    );
  });
});

// ── computeToPlay ───────────────────────────────────────────────────

describe("computeToPlay", () => {
  it("returns null for null state", () => {
    expect(computeToPlay(null)).toBeNull();
  });

  it("turn 0, firstPlayer 0 → player A (0)", () => {
    expect(computeToPlay(makeState({ turn: 0, firstPlayer: 0 }))).toBe(0);
  });

  it("turn 1, firstPlayer 0 → player B (1)", () => {
    expect(computeToPlay(makeState({ turn: 1, firstPlayer: 0 }))).toBe(1);
  });

  it("turn 0, firstPlayer 1 → player B (1)", () => {
    expect(computeToPlay(makeState({ turn: 0, firstPlayer: 1 }))).toBe(1);
  });

  it("turn 9 → null (game over)", () => {
    expect(computeToPlay(makeState({ turn: 9, firstPlayer: 0 }))).toBeNull();
  });

  it("finished game → null", () => {
    expect(
      computeToPlay(makeState({ turn: 5, firstPlayer: 0, status: { finished: true } })),
    ).toBeNull();
  });
});

// ── computeEmptyCells ───────────────────────────────────────────────

describe("computeEmptyCells", () => {
  it("returns [] for null state", () => {
    expect(computeEmptyCells(null)).toEqual([]);
  });

  it("returns remaining cells when usedCells is provided", () => {
    const state = makeState({ usedCells: [0, 4] });
    expect(computeEmptyCells(state)).toEqual([1, 2, 3, 5, 6, 7, 8]);
  });

  it("returns all 9 when no usage info", () => {
    const state = makeState({});
    expect(computeEmptyCells(state)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

// ── computeRemainingCardIndices ─────────────────────────────────────

describe("computeRemainingCardIndices", () => {
  it("all 5 when no cards used", () => {
    const state = makeState({});
    expect(computeRemainingCardIndices(state, 0)).toEqual([0, 1, 2, 3, 4]);
  });

  it("filters out used cards for side A", () => {
    const state = makeState({ usedCardIndicesA: [0, 2] });
    expect(computeRemainingCardIndices(state, 0)).toEqual([1, 3, 4]);
  });

  it("filters out used cards for side B", () => {
    const state = makeState({ usedCardIndicesB: [1, 3, 4] });
    expect(computeRemainingCardIndices(state, 1)).toEqual([0, 2]);
  });
});

// ── computeWarningMarksUsed / Remaining ─────────────────────────────

describe("computeWarningMarksUsed", () => {
  it("returns 0 for null state", () => {
    expect(computeWarningMarksUsed(null, 0)).toBe(0);
  });

  it("reads warningMarksUsedA from state", () => {
    const state = makeState({ warningMarksUsedA: 2 });
    expect(computeWarningMarksUsed(state, 0)).toBe(2);
  });

  it("reads warningMarksUsedB from state", () => {
    const state = makeState({ warningMarksUsedB: 1 });
    expect(computeWarningMarksUsed(state, 1)).toBe(1);
  });
});

describe("computeWarningMarksRemaining", () => {
  it("returns max (3) when no marks used", () => {
    const state = makeState({});
    expect(computeWarningMarksRemaining(state, 0)).toBe(3);
  });

  it("subtracts used marks", () => {
    const state = makeState({ warningMarksUsedA: 2 });
    expect(computeWarningMarksRemaining(state, 0)).toBe(1);
  });
});

// ── computeStrictAllowed ────────────────────────────────────────────

describe("computeStrictAllowed", () => {
  it("returns null for null state", () => {
    expect(computeStrictAllowed(null)).toBeNull();
  });

  it("returns null for finished game", () => {
    const state = makeState({
      turn: 5,
      firstPlayer: 0,
      status: { finished: true },
    });
    expect(computeStrictAllowed(state)).toBeNull();
  });

  it("turn 0, empty board → 45 allowlist entries (5 cards × 9 cells)", () => {
    const state = makeState({ turn: 0, firstPlayer: 0 });
    const result = computeStrictAllowed(state);
    expect(result).not.toBeNull();
    expect(result!.count).toBe(45);
    expect(result!.allowlist.length).toBe(45);
    expect(result!.toPlay).toBe(0);
  });

  it("hash is deterministic", () => {
    const state = makeState({ turn: 0, firstPlayer: 0 });
    const r1 = computeStrictAllowed(state);
    const r2 = computeStrictAllowed(state);
    expect(r1!.hash).toBe(r2!.hash);
  });

  it("reduces count with used cells and cards", () => {
    const state = makeState({
      turn: 2,
      firstPlayer: 0,
      usedCells: [0, 4],
      usedCardIndicesA: [0],
    });
    const result = computeStrictAllowed(state);
    expect(result).not.toBeNull();
    // Turn 2, firstPlayer 0 → toPlay = 0 (A)
    // 7 empty cells, 4 remaining cards → 28 entries
    expect(result!.count).toBe(28);
    expect(result!.toPlay).toBe(0);
  });

  it("includes warning mark candidates when marks remaining", () => {
    const state = makeState({ turn: 0, firstPlayer: 0 });
    const result = computeStrictAllowed(state);
    expect(result!.warningMark.remaining).toBe(3);
    expect(result!.warningMark.candidates.length).toBe(9);
  });
});

// ── P2-2-3: toViewerMoveText display unification ──────────────────

describe("toViewerMoveText display unification (P2-2-3)", () => {
  it("formats cell+cardIndex matching overlay display", () => {
    // cell 4 = B2, cardIndex 1 = slot A2 → "#triad A2->B2"
    expect(toViewerMoveText({ cell: 4, cardIndex: 1 })).toBe("#triad A2->B2");
  });

  it("formats edge cell", () => {
    // cell 0 = A1, cardIndex 0 = slot A1 → "#triad A1->A1"
    expect(toViewerMoveText({ cell: 0, cardIndex: 0 })).toBe("#triad A1->A1");
  });
});

// ── P2-2-4: computeStrictAllowed hash stability ───────────────────

describe("computeStrictAllowed hash stability (P2-2-4)", () => {
  it("hash format is 0x + 8 hex chars", () => {
    const result = computeStrictAllowed(makeState({ turn: 0, firstPlayer: 0 }));
    expect(result).not.toBeNull();
    expect(result!.hash).toMatch(/^0x[0-9a-f]{8}$/);
  });

  it("deterministic — same state produces same hash", () => {
    const s = makeState({ turn: 0, firstPlayer: 0 });
    const r1 = computeStrictAllowed(s);
    const r2 = computeStrictAllowed(s);
    expect(r1!.hash).toBe(r2!.hash);
  });

  it("allowlist entries are all parseable #triad format", () => {
    const result = computeStrictAllowed(makeState({ turn: 0, firstPlayer: 0 }));
    expect(result).not.toBeNull();
    for (const entry of result!.allowlist) {
      expect(entry).toMatch(/^#triad A[1-5]->[ABC][1-3]$/);
    }
  });
});
