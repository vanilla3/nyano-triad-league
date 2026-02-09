import { describe, it, expect } from "vitest";
import {
  cellIndexToCoord,
  cellCoordToIndex,
  formatViewerMoveText,
  parseViewerMoveText,
  parseViewerMoveTextLoose,
  normalizeViewerMoveText,
  parseChatMoveLoose,
} from "../triad_viewer_command";

/* ═══════════════════════════════════════════════════════════════════
   triad_viewer_command.test.ts
   Unit tests for the viewer command parser / normalizer.
   ═══════════════════════════════════════════════════════════════════ */

describe("cellIndexToCoord", () => {
  it("maps corners and center correctly", () => {
    expect(cellIndexToCoord(0)).toBe("A1");
    expect(cellIndexToCoord(4)).toBe("B2");
    expect(cellIndexToCoord(8)).toBe("C3");
  });

  it("maps all 9 indices to expected coords", () => {
    const expected = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"];
    for (let i = 0; i < 9; i++) {
      expect(cellIndexToCoord(i)).toBe(expected[i]);
    }
  });

  it("clamps NaN to A1", () => {
    expect(cellIndexToCoord(NaN)).toBe("A1");
  });

  it("clamps negative to A1", () => {
    expect(cellIndexToCoord(-1)).toBe("A1");
  });

  it("clamps out-of-range (row/col independently)", () => {
    // 99: row = floor(99/3)=33 clamped to 2, col = 99%3=0 clamped to 0 → A3
    expect(cellIndexToCoord(99)).toBe("A3");
  });
});

describe("cellCoordToIndex", () => {
  it("maps A1 to 0 and C3 to 8", () => {
    expect(cellCoordToIndex("A1")).toBe(0);
    expect(cellCoordToIndex("C3")).toBe(8);
  });

  it("is case-insensitive", () => {
    expect(cellCoordToIndex("b2")).toBe(4);
    expect(cellCoordToIndex("B2")).toBe(4);
  });

  it("returns null for invalid column", () => {
    expect(cellCoordToIndex("D1")).toBeNull();
  });

  it("returns null for invalid row", () => {
    expect(cellCoordToIndex("A4")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(cellCoordToIndex("")).toBeNull();
  });

  it("trims whitespace", () => {
    expect(cellCoordToIndex(" B2 ")).toBe(4);
  });

  it("all 9 indices roundtrip through cellIndexToCoord", () => {
    for (let i = 0; i < 9; i++) {
      expect(cellCoordToIndex(cellIndexToCoord(i))).toBe(i);
    }
  });
});

describe("formatViewerMoveText", () => {
  it("formats basic side A move", () => {
    expect(formatViewerMoveText({ side: 0, slot: 2, cell: 4 })).toBe("#triad A2->B2");
  });

  it("formats with warning mark", () => {
    expect(
      formatViewerMoveText({ side: 0, slot: 3, cell: 0, warningMarkCell: 8 }),
    ).toBe("#triad A3->A1 wm=C3");
  });

  it("formats side B move", () => {
    expect(formatViewerMoveText({ side: 1, slot: 1, cell: 0 })).toBe("#triad B1->A1");
  });
});

describe("parseViewerMoveText (strict)", () => {
  it("parses canonical #triad A2->B2", () => {
    const r = parseViewerMoveText("#triad A2->B2");
    expect(r).not.toBeNull();
    expect(r!.side).toBe(0);
    expect(r!.slot).toBe(2);
    expect(r!.cardIndex).toBe(1);
    expect(r!.cell).toBe(4);
    expect(r!.warningMarkCell).toBeNull();
  });

  it("parses with warning mark", () => {
    const r = parseViewerMoveText("#triad A2->B2 wm=C1");
    expect(r).not.toBeNull();
    expect(r!.warningMarkCell).toBe(2);
  });

  it("parses unicode arrow →", () => {
    const r = parseViewerMoveText("#triad A2→B2");
    expect(r).not.toBeNull();
    expect(r!.cell).toBe(4);
  });

  it("rejects extra text after command", () => {
    expect(parseViewerMoveText("#triad A2->B2 gg")).toBeNull();
  });

  it("is case-insensitive", () => {
    const r = parseViewerMoveText("#TRIAD a2->b2");
    expect(r).not.toBeNull();
    expect(r!.side).toBe(0);
    expect(r!.cell).toBe(4);
  });

  it("returns null for empty string", () => {
    expect(parseViewerMoveText("")).toBeNull();
  });
});

describe("parseViewerMoveTextLoose", () => {
  it("extracts from embedded text", () => {
    const r = parseViewerMoveTextLoose("hey #triad A2->B2 gg");
    expect(r).not.toBeNull();
    expect(r!.cell).toBe(4);
    expect(r!.cardIndex).toBe(1);
  });

  it("extracts side B with warning mark from chat noise", () => {
    const r = parseViewerMoveTextLoose("love this game #triad B3->C1 wm=A2 kappa");
    expect(r).not.toBeNull();
    expect(r!.side).toBe(1);
    expect(r!.slot).toBe(3);
    expect(r!.cell).toBe(2); // C1 = col 2, row 0 = index 2
    expect(r!.warningMarkCell).toBe(3); // A2 = col 0, row 1 = index 3
  });
});

describe("normalizeViewerMoveText", () => {
  it("normalizes loose by default", () => {
    expect(normalizeViewerMoveText("yo #triad a1->c3")).toBe("#triad A1->C3");
  });

  it("strict rejects extra text", () => {
    expect(normalizeViewerMoveText("yo #triad a1->c3", { strict: true })).toBeNull();
  });
});

describe("parseChatMoveLoose", () => {
  it("passes through canonical format", () => {
    const r = parseChatMoveLoose("#triad A2->B2");
    expect(r).not.toBeNull();
    expect(r!.side).toBe(0);
    expect(r!.cardIndex).toBe(1);
    expect(r!.cell).toBe(4);
  });

  it("parses legacy !move format", () => {
    // "!move 4 2" → strip prefix → "4 2"
    // cell-first: parseCellAny("4")=4, parseCardIndexHuman("2")=1 (slot 2 → index 1)
    const r = parseChatMoveLoose("!move 4 2");
    expect(r).not.toBeNull();
    expect(r!.cell).toBe(4);
    expect(r!.cardIndex).toBe(1);
  });

  it("parses arrow shorthand 3->B2", () => {
    const r = parseChatMoveLoose("3->B2", 0);
    expect(r).not.toBeNull();
    expect(r!.cardIndex).toBe(2); // slot 3 => cardIndex 2
    expect(r!.cell).toBe(4); // B2
  });

  it("parses space-separated cell-first: B2 3", () => {
    const r = parseChatMoveLoose("B2 3", 0);
    expect(r).not.toBeNull();
    expect(r!.cell).toBe(4);
    expect(r!.cardIndex).toBe(2);
  });

  it("parses warning mark in legacy format", () => {
    const r = parseChatMoveLoose("!move 1 0 wm=2");
    expect(r).not.toBeNull();
    expect(r!.cell).toBe(1);
    expect(r!.cardIndex).toBe(0);
    expect(r!.warningMarkCell).toBe(2);
  });

  it("handles fullwidth space (Japanese keyboard)", () => {
    // \u3000 is fullwidth space
    const r = parseChatMoveLoose("3\u30000", 0);
    expect(r).not.toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(parseChatMoveLoose("hello world")).toBeNull();
    expect(parseChatMoveLoose("")).toBeNull();
  });

  it("propagates side parameter for legacy format", () => {
    const rA = parseChatMoveLoose("!move 4 2", 0);
    const rB = parseChatMoveLoose("!move 4 2", 1);
    expect(rA).not.toBeNull();
    expect(rB).not.toBeNull();
    expect(rA!.normalizedText).toMatch(/^#triad A/);
    expect(rB!.normalizedText).toMatch(/^#triad B/);
  });
});

/* ------------------------------------------------------------------ */
/* format → parse roundtrip                                            */
/* ------------------------------------------------------------------ */

describe("format → parse roundtrip", () => {
  it("side A basic roundtrip", () => {
    const text = formatViewerMoveText({ side: 0, slot: 2, cell: 4 });
    const parsed = parseViewerMoveText(text);
    expect(parsed).not.toBeNull();
    expect(parsed!.side).toBe(0);
    expect(parsed!.slot).toBe(2);
    expect(parsed!.cardIndex).toBe(1);
    expect(parsed!.cell).toBe(4);
    expect(parsed!.warningMarkCell).toBeNull();
  });

  it("side B with warning mark roundtrip", () => {
    const text = formatViewerMoveText({ side: 1, slot: 3, cell: 0, warningMarkCell: 8 });
    const parsed = parseViewerMoveText(text);
    expect(parsed).not.toBeNull();
    expect(parsed!.side).toBe(1);
    expect(parsed!.slot).toBe(3);
    expect(parsed!.cardIndex).toBe(2);
    expect(parsed!.cell).toBe(0);
    expect(parsed!.warningMarkCell).toBe(8);
  });

  it("all 9 cells roundtrip", () => {
    for (let cell = 0; cell < 9; cell++) {
      const text = formatViewerMoveText({ side: 0, slot: 1, cell });
      const parsed = parseViewerMoveText(text);
      expect(parsed).not.toBeNull();
      expect(parsed!.cell).toBe(cell);
    }
  });

  it("canonical format is parse-stable", () => {
    const cases = [
      { side: 0 as const, slot: 1, cell: 0 },
      { side: 1 as const, slot: 5, cell: 8, warningMarkCell: 4 },
      { side: 0 as const, slot: 3, cell: 6 },
    ];
    for (const c of cases) {
      const text = formatViewerMoveText(c);
      const parsed = parseViewerMoveText(text);
      expect(parsed).not.toBeNull();
      expect(parsed!.normalizedText).toBe(text);
    }
  });
});
