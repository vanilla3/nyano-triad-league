import { describe, it, expect } from "vitest";
import { generateMoveTip, generateMoveTipWithNarrative } from "../move_tips";
import type { OverlayStateV1 } from "@/lib/streamer_bus";

/* ═══════════════════════════════════════════════════════════════════
   move_tips.test.ts
   Unit tests for the heuristic move tip generator (Phase 1 spectator).
   ═══════════════════════════════════════════════════════════════════ */

type TurnSummaryLite = NonNullable<OverlayStateV1["lastTurnSummary"]>;
type LastMoveLite = NonNullable<OverlayStateV1["lastMove"]>;

/* ─── helpers ─── */

function mkSummary(overrides: Partial<TurnSummaryLite> = {}): TurnSummaryLite {
  return {
    flipCount: 0,
    comboCount: 0,
    comboEffect: "none",
    triadPlus: 0,
    ignoreWarningMark: false,
    warningTriggered: false,
    warningPlaced: null,
    ...overrides,
  };
}

function mkMove(overrides: Partial<LastMoveLite> = {}): LastMoveLite {
  return {
    turnIndex: 0,
    by: 0,
    cell: 4,
    cardIndex: 0,
    ...overrides,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   Individual tip categories
   ═══════════════════════════════════════════════════════════════════ */

describe("generateMoveTip", () => {
  /* ─── edge cases ─── */

  it("returns null when lastMove is null", () => {
    expect(generateMoveTip(mkSummary(), null)).toBeNull();
  });

  it("returns null when summary is null and move has no noteworthy features", () => {
    // cell=1 (not corner, not center), no flips
    expect(generateMoveTip(null, mkMove({ cell: 1 }))).toBeNull();
  });

  /* ─── warning_dodge (priority 1) ─── */

  describe("warning_dodge", () => {
    it("returns warning_dodge when ignoreWarningMark is true", () => {
      const tip = generateMoveTip(
        mkSummary({ ignoreWarningMark: true }),
        mkMove(),
      );
      expect(tip).not.toBeNull();
      expect(tip!.key).toBe("warning_dodge");
      expect(tip!.labelJa).toBe("罠回避！");
      expect(tip!.labelEn).toBe("Trap dodged!");
    });
  });

  /* ─── warning_triggered (priority 2) ─── */

  describe("warning_triggered", () => {
    it("returns warning_triggered when warningTriggered is true", () => {
      const tip = generateMoveTip(
        mkSummary({ warningTriggered: true }),
        mkMove(),
      );
      expect(tip).not.toBeNull();
      expect(tip!.key).toBe("warning_triggered");
      expect(tip!.labelJa).toBe("罠発動！");
    });
  });

  /* ─── warning_trap (priority 3) ─── */

  describe("warning_trap", () => {
    it("returns warning_trap when warningPlaced is a number", () => {
      const tip = generateMoveTip(
        mkSummary({ warningPlaced: 5 }),
        mkMove(),
      );
      expect(tip).not.toBeNull();
      expect(tip!.key).toBe("warning_trap");
      expect(tip!.labelJa).toBe("罠設置！");
    });

    it("does not trigger when warningPlaced is null", () => {
      const tip = generateMoveTip(
        mkSummary({ warningPlaced: null }),
        mkMove({ cell: 1 }), // non-corner, non-center
      );
      // Should not be warning_trap
      expect(tip?.key).not.toBe("warning_trap");
    });
  });

  /* ─── domination_combo (priority 4) ─── */

  describe("domination_combo", () => {
    it("returns domination_combo when comboEffect is 'domination'", () => {
      const tip = generateMoveTip(
        mkSummary({ comboEffect: "domination" }),
        mkMove(),
      );
      expect(tip).not.toBeNull();
      expect(tip!.key).toBe("domination_combo");
      expect(tip!.labelJa).toBe("支配コンボ！");
    });

    it("returns domination_combo when comboEffect is 'fever'", () => {
      const tip = generateMoveTip(
        mkSummary({ comboEffect: "fever" }),
        mkMove(),
      );
      expect(tip).not.toBeNull();
      expect(tip!.key).toBe("domination_combo");
    });

    it("does not trigger for 'momentum' combo effect", () => {
      const tip = generateMoveTip(
        mkSummary({ comboEffect: "momentum", flipCount: 1, }),
        mkMove({ cell: 1 }),
      );
      expect(tip?.key).not.toBe("domination_combo");
    });
  });

  /* ─── big_swing (priority 5) ─── */

  describe("big_swing", () => {
    it("returns big_swing when flipCount >= 3", () => {
      const tip = generateMoveTip(
        mkSummary({ flipCount: 3 }),
        mkMove(),
      );
      expect(tip).not.toBeNull();
      expect(tip!.key).toBe("big_swing");
      expect(tip!.labelJa).toBe("大量奪取！(3枚)");
      expect(tip!.labelEn).toBe("Big swing! (3 flips)");
    });

    it("includes dynamic flip count in label", () => {
      const tip = generateMoveTip(
        mkSummary({ flipCount: 5 }),
        mkMove(),
      );
      expect(tip).not.toBeNull();
      expect(tip!.labelJa).toBe("大量奪取！(5枚)");
      expect(tip!.labelEn).toBe("Big swing! (5 flips)");
    });

    it("does not trigger for flipCount < 3", () => {
      const tip = generateMoveTip(
        mkSummary({ flipCount: 2 }),
        mkMove({ cell: 1 }),
      );
      expect(tip?.key).not.toBe("big_swing");
    });
  });

  /* ─── chain_combo (priority 6) ─── */

  describe("chain_combo", () => {
    it("returns chain_combo when flips array has isChain=true", () => {
      const tip = generateMoveTip(
        mkSummary({
          flipCount: 2,
          flips: [
            { from: 0, to: 1, isChain: false, kind: "ortho", aVal: 5, dVal: 3, tieBreak: false },
            { from: 0, to: 1, isChain: true, kind: "ortho", aVal: 5, dVal: 3, tieBreak: false },
          ],
        }),
        mkMove({ cell: 1 }),
      );
      expect(tip).not.toBeNull();
      expect(tip!.key).toBe("chain_combo");
      expect(tip!.labelJa).toBe("連鎖コンボ！");
    });

    it("does not trigger when all flips have isChain=false", () => {
      const tip = generateMoveTip(
        mkSummary({
          flipCount: 1,
          flips: [
            { from: 0, to: 1, isChain: false, kind: "ortho", aVal: 5, dVal: 3, tieBreak: false },
          ],
        }),
        mkMove({ cell: 1 }),
      );
      expect(tip?.key).not.toBe("chain_combo");
    });
  });

  /* ─── corner_control (priority 7) ─── */

  describe("corner_control", () => {
    const CORNERS = [0, 2, 6, 8];

    it.each(CORNERS)("returns corner_control for cell %i with flip", (cell) => {
      const tip = generateMoveTip(
        mkSummary({ flipCount: 1 }),
        mkMove({ cell }),
      );
      expect(tip).not.toBeNull();
      expect(tip!.key).toBe("corner_control");
      expect(tip!.labelJa).toBe("角を確保！");
    });

    it("does not trigger for corner cell with 0 flips", () => {
      const tip = generateMoveTip(
        mkSummary({ flipCount: 0 }),
        mkMove({ cell: 0 }),
      );
      expect(tip).toBeNull();
    });

    it("does not trigger for non-corner cell", () => {
      const tip = generateMoveTip(
        mkSummary({ flipCount: 1 }),
        mkMove({ cell: 1 }),
      );
      expect(tip?.key).not.toBe("corner_control");
    });
  });

  /* ─── center_hold (priority 8) ─── */

  describe("center_hold", () => {
    it("returns center_hold for cell 4 with flip", () => {
      const tip = generateMoveTip(
        mkSummary({ flipCount: 1 }),
        mkMove({ cell: 4 }),
      );
      expect(tip).not.toBeNull();
      expect(tip!.key).toBe("center_hold");
      expect(tip!.labelJa).toBe("中央確保");
    });

    it("does not trigger for cell 4 with 0 flips", () => {
      const tip = generateMoveTip(
        mkSummary({ flipCount: 0 }),
        mkMove({ cell: 4 }),
      );
      expect(tip).toBeNull();
    });
  });

  /* ─── no tip ─── */

  describe("no tip", () => {
    it("returns null for a plain edge cell with 1 flip and no special effects", () => {
      const tip = generateMoveTip(
        mkSummary({ flipCount: 1 }),
        mkMove({ cell: 1 }), // edge cell (not corner, not center)
      );
      expect(tip).toBeNull();
    });
  });

  /* ═══════════════════════════════════════════════════════════════════
     Priority ordering (first-match-wins)
     ═══════════════════════════════════════════════════════════════════ */

  describe("priority ordering", () => {
    it("warning_dodge beats big_swing", () => {
      const tip = generateMoveTip(
        mkSummary({ ignoreWarningMark: true, flipCount: 5 }),
        mkMove(),
      );
      expect(tip!.key).toBe("warning_dodge");
    });

    it("warning_triggered beats warning_trap", () => {
      const tip = generateMoveTip(
        mkSummary({ warningTriggered: true, warningPlaced: 3 }),
        mkMove(),
      );
      expect(tip!.key).toBe("warning_triggered");
    });

    it("domination_combo beats chain_combo", () => {
      const tip = generateMoveTip(
        mkSummary({
          comboEffect: "domination",
          flipCount: 2,
          flips: [
            { from: 0, to: 1, isChain: true, kind: "ortho", aVal: 5, dVal: 3, tieBreak: false },
          ],
        }),
        mkMove(),
      );
      expect(tip!.key).toBe("domination_combo");
    });

    it("big_swing beats corner_control", () => {
      const tip = generateMoveTip(
        mkSummary({ flipCount: 4 }),
        mkMove({ cell: 0 }), // corner cell
      );
      expect(tip!.key).toBe("big_swing");
    });

    it("chain_combo beats corner_control", () => {
      const tip = generateMoveTip(
        mkSummary({
          flipCount: 2,
          flips: [
            { from: 0, to: 1, isChain: false, kind: "ortho", aVal: 5, dVal: 3, tieBreak: false },
            { from: 0, to: 1, isChain: true, kind: "ortho", aVal: 5, dVal: 3, tieBreak: false },
          ],
        }),
        mkMove({ cell: 0 }), // corner cell
      );
      expect(tip!.key).toBe("chain_combo");
    });

    it("corner_control beats center_hold", () => {
      // This scenario can't naturally happen (cell can't be both corner and center)
      // but validates that corner_control (priority 7) > center_hold (priority 8)
      // We test separately that each fires correctly in its cell
      const cornerTip = generateMoveTip(
        mkSummary({ flipCount: 1 }),
        mkMove({ cell: 0 }),
      );
      const centerTip = generateMoveTip(
        mkSummary({ flipCount: 1 }),
        mkMove({ cell: 4 }),
      );
      expect(cornerTip!.key).toBe("corner_control");
      expect(centerTip!.key).toBe("center_hold");
      expect(cornerTip!.priority).toBeLessThan(centerTip!.priority);
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════
   generateMoveTipWithNarrative — Phase 1 Explainability
   ═══════════════════════════════════════════════════════════════════ */

describe("generateMoveTipWithNarrative", () => {
  it("returns null when base tip is null", () => {
    expect(generateMoveTipWithNarrative(null, mkMove({ cell: 1 }), null)).toBeNull();
  });

  it("returns null when lastMove is null", () => {
    expect(generateMoveTipWithNarrative(mkSummary(), null, null)).toBeNull();
  });

  it("big_swing + context → narrativeJa contains tile counts", () => {
    const tip = generateMoveTipWithNarrative(
      mkSummary({ flipCount: 3 }),
      mkMove(),
      { tilesA: 5, tilesB: 4 },
    );
    expect(tip).not.toBeNull();
    expect(tip!.key).toBe("big_swing");
    expect(tip!.narrativeJa).toBeDefined();
    expect(tip!.narrativeJa).toContain("3");
    expect(tip!.narrativeJa).toContain("5");
    expect(tip!.narrativeJa).toContain("4");
  });

  it("big_swing + context=null → narrativeJa without tile counts", () => {
    const tip = generateMoveTipWithNarrative(
      mkSummary({ flipCount: 4 }),
      mkMove(),
      null,
    );
    expect(tip).not.toBeNull();
    expect(tip!.key).toBe("big_swing");
    expect(tip!.narrativeJa).toBeDefined();
    expect(tip!.narrativeJa).toContain("4");
  });

  it("corner_control → strategic narrative", () => {
    const tip = generateMoveTipWithNarrative(
      mkSummary({ flipCount: 1 }),
      mkMove({ cell: 0 }),
      { tilesA: 3, tilesB: 2 },
    );
    expect(tip).not.toBeNull();
    expect(tip!.key).toBe("corner_control");
    expect(tip!.narrativeJa).toBeDefined();
    expect(tip!.narrativeJa!.length).toBeGreaterThan(0);
  });

  it("center_hold → strategic narrative about center", () => {
    const tip = generateMoveTipWithNarrative(
      mkSummary({ flipCount: 1 }),
      mkMove({ cell: 4 }),
      null,
    );
    expect(tip).not.toBeNull();
    expect(tip!.key).toBe("center_hold");
    expect(tip!.narrativeJa).toBeDefined();
  });

  it("warning_dodge → narrative about trap avoidance", () => {
    const tip = generateMoveTipWithNarrative(
      mkSummary({ ignoreWarningMark: true }),
      mkMove(),
      null,
    );
    expect(tip).not.toBeNull();
    expect(tip!.key).toBe("warning_dodge");
    expect(tip!.narrativeJa).toBeDefined();
  });

  it("preserves all base tip fields", () => {
    const tip = generateMoveTipWithNarrative(
      mkSummary({ flipCount: 3 }),
      mkMove(),
      { tilesA: 5, tilesB: 4 },
    );
    expect(tip).not.toBeNull();
    expect(tip!.key).toBe("big_swing");
    expect(tip!.labelJa).toContain("大量奪取");
    expect(tip!.labelEn).toContain("Big swing");
    expect(typeof tip!.priority).toBe("number");
    expect(tip!.narrativeJa).toBeDefined();
  });
});
