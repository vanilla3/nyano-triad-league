import { describe, expect, it, vi } from "vitest";
import type { TurnSummary } from "@nyano/triad-engine";
import {
  resolveReplayOverlayLastMove,
  resolveReplayOverlayLastTurnSummary,
} from "@/features/match/replayOverlaySummary";

function makeTurnSummary(overrides: Partial<TurnSummary> = {}): TurnSummary {
  return {
    turnIndex: overrides.turnIndex ?? 0,
    player: overrides.player ?? 0,
    cell: overrides.cell ?? 4,
    cardIndex: overrides.cardIndex ?? 0,
    tokenId: overrides.tokenId ?? 1n,
    flipCount: overrides.flipCount ?? 0,
    flipTraces: overrides.flipTraces ?? [],
    comboEffect: overrides.comboEffect ?? "none",
    comboCount: overrides.comboCount ?? 0,
    warningTriggered: overrides.warningTriggered ?? false,
    warningPlaced: overrides.warningPlaced,
    appliedBonus: overrides.appliedBonus,
  } as TurnSummary;
}

describe("features/match/replayOverlaySummary", () => {
  it("returns undefined lastMove when turn summary is unavailable", () => {
    expect(resolveReplayOverlayLastMove({
      last: null,
      lastIndex: 0,
      firstPlayer: 0,
    })).toBeUndefined();
  });

  it("builds lastMove with resolved turn owner and warning mark", () => {
    const turnPlayerFn = vi.fn(() => 1 as const);
    const lastMove = resolveReplayOverlayLastMove({
      last: makeTurnSummary({ cell: 6, cardIndex: 2, warningPlaced: 1 }),
      lastIndex: 3,
      firstPlayer: 0,
      turnPlayerFn,
    });

    expect(turnPlayerFn).toHaveBeenCalledWith(0, 3);
    expect(lastMove).toEqual({
      turnIndex: 3,
      by: 1,
      cell: 6,
      cardIndex: 2,
      warningMarkCell: 1,
    });
  });

  it("builds lastTurnSummary including flip traces", () => {
    const summary = resolveReplayOverlayLastTurnSummary(makeTurnSummary({
      flipCount: 2,
      comboCount: 1,
      comboEffect: "momentum",
      warningTriggered: true,
      warningPlaced: 8,
      appliedBonus: { triadPlus: 1, ignoreWarningMark: true },
      flipTraces: [{ from: 4, to: 1, kind: "ortho", isChain: true, aVal: 8, dVal: 3, tieBreak: false }],
    }));

    expect(summary).toMatchObject({
      flipCount: 2,
      comboCount: 1,
      comboEffect: "momentum",
      triadPlus: 1,
      ignoreWarningMark: true,
      warningTriggered: true,
      warningPlaced: 8,
      flips: [{ from: 4, to: 1, kind: "ortho", isChain: true }],
    });
  });

  it("returns undefined summary when turn summary is unavailable", () => {
    expect(resolveReplayOverlayLastTurnSummary(null)).toBeUndefined();
  });
});
