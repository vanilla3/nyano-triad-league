import { describe, expect, it } from "vitest";
import type { MatchResultWithHistory } from "@nyano/triad-engine";
import {
  detectReplayHighlights,
  formatReplayWinnerLabel,
  replayHighlightKindLabel,
  summarizeReplayHighlights,
} from "../replay_highlights";

type ReplayTurn = MatchResultWithHistory["turns"][number];

function makeTurn(overrides: Partial<ReplayTurn> = {}): ReplayTurn {
  return {
    turnIndex: 0,
    player: 0,
    cell: 0,
    cardIndex: 0,
    tokenId: 1n,
    flipCount: 0,
    flipTraces: [],
    comboCount: 0,
    comboEffect: "none",
    appliedBonus: {
      triadPlus: 0,
      ignoreWarningMark: false,
    },
    warningPlaced: null,
    warningTriggered: false,
    ...overrides,
  } as ReplayTurn;
}

describe("detectReplayHighlights", () => {
  it("detects big flip, chain, combo, and warning highlights", () => {
    const turns: ReplayTurn[] = [
      makeTurn({ flipCount: 3 }),
      makeTurn({
        flipCount: 1,
        flipTraces: [{ isChain: true } as any],
        warningTriggered: true,
      }),
      makeTurn({ comboEffect: "momentum" }),
    ];

    const highlights = detectReplayHighlights({ turns });

    expect(highlights).toEqual([
      { step: 1, kind: "big_flip", label: "3 flips" },
      { step: 2, kind: "chain", label: "Chain" },
      { step: 2, kind: "warning", label: "Warning!" },
      { step: 3, kind: "combo", label: "momentum" },
    ]);
  });
});

describe("summarizeReplayHighlights", () => {
  it("counts per highlight kind", () => {
    const summary = summarizeReplayHighlights([
      { step: 1, kind: "big_flip", label: "3 flips" },
      { step: 2, kind: "chain", label: "Chain" },
      { step: 2, kind: "warning", label: "Warning!" },
      { step: 3, kind: "warning", label: "Warning!" },
    ]);

    expect(summary).toEqual({
      big_flip: 1,
      chain: 1,
      combo: 0,
      warning: 2,
    });
  });
});

describe("formatReplayWinnerLabel", () => {
  it("formats replay winner labels including draws", () => {
    expect(formatReplayWinnerLabel(0)).toBe("A");
    expect(formatReplayWinnerLabel(1)).toBe("B");
    expect(formatReplayWinnerLabel("draw")).toBe("DRAW");
    expect(formatReplayWinnerLabel(null)).toBe("DRAW");
  });
});

describe("replayHighlightKindLabel", () => {
  it("returns UI labels for every highlight kind", () => {
    expect(replayHighlightKindLabel("big_flip")).toBe("Big Flip");
    expect(replayHighlightKindLabel("chain")).toBe("Chain");
    expect(replayHighlightKindLabel("combo")).toBe("Combo");
    expect(replayHighlightKindLabel("warning")).toBe("Warning");
  });
});
