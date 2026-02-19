import { describe, expect, it } from "vitest";
import type { BoardState, MatchResultWithHistory } from "@nyano/triad-engine";
import {
  resolveBoardImpactBurstDurationMs,
  resolveBoardImpactBurstState,
  resolveMatchNyanoReactionImpact,
  resolveMatchNyanoReactionInput,
  resolveStageImpactBurstDurationMs,
  shouldTriggerStageImpactBurst,
} from "@/features/match/matchStageReaction";

type MatchPreviewTurn = MatchResultWithHistory["turns"][number];

function makePreviewTurn(overrides: Partial<MatchPreviewTurn> = {}): MatchPreviewTurn {
  return {
    turnIndex: overrides.turnIndex ?? 0,
    player: overrides.player ?? 0,
    cell: overrides.cell ?? 4,
    cardIndex: overrides.cardIndex ?? 0,
    tokenId: overrides.tokenId ?? 1n,
    flipCount: overrides.flipCount ?? 0,
    flipTraces: overrides.flipTraces ?? [],
    comboEffect: overrides.comboEffect ?? "none",
    warningTriggered: overrides.warningTriggered ?? false,
  } as MatchPreviewTurn;
}

describe("features/match/matchStageReaction", () => {
  it("returns null reaction input when simulation is not ready", () => {
    const result = resolveMatchNyanoReactionInput({
      simOk: false,
      previewTurns: [],
      winner: null,
      turnCount: 0,
      boardNow: Array.from({ length: 9 }, () => null),
    });
    expect(result).toBeNull();
  });

  it("builds reaction input from latest preview turn and board tiles", () => {
    const board: BoardState = [
      { owner: 0 } as BoardState[number],
      { owner: 1 } as BoardState[number],
      null,
      { owner: 1 } as BoardState[number],
      { owner: 0 } as BoardState[number],
      null,
      null,
      null,
      null,
    ];
    const previewTurns: MatchPreviewTurn[] = [
      makePreviewTurn(),
      makePreviewTurn(),
      makePreviewTurn(),
      makePreviewTurn(),
      makePreviewTurn(),
      makePreviewTurn(),
      makePreviewTurn(),
      makePreviewTurn(),
      makePreviewTurn({
        flipCount: 2,
        flipTraces: [{ from: 4, to: 1, kind: "ortho", isChain: true, aVal: 8, dVal: 3, tieBreak: false }],
        comboEffect: "fever",
        warningTriggered: true,
      }),
    ];
    const result = resolveMatchNyanoReactionInput({
      simOk: true,
      previewTurns,
      winner: 0,
      turnCount: 9,
      boardNow: board,
      perspective: 0,
    });
    expect(result).toMatchObject({
      flipCount: 2,
      hasChain: true,
      comboEffect: "fever",
      warningTriggered: true,
      tilesA: 2,
      tilesB: 2,
      perspective: 0,
      finished: true,
      winner: 0,
    });
  });

  it("resolves reaction impact and stage burst gating", () => {
    const lowImpact = resolveMatchNyanoReactionImpact({
      nyanoReactionInput: null,
      currentAiReasonCode: undefined,
    });
    expect(lowImpact).toBe("low");
    expect(
      shouldTriggerStageImpactBurst({
        isEngineFocus: true,
        nyanoReactionInput: null,
        nyanoReactionImpact: "high",
      }),
    ).toBe(false);

    const highImpact = resolveMatchNyanoReactionImpact({
      nyanoReactionInput: {
        flipCount: 0,
        hasChain: false,
        comboEffect: "none",
        warningTriggered: false,
        tilesA: 5,
        tilesB: 4,
        perspective: 0,
        finished: true,
        winner: 0,
      },
      currentAiReasonCode: undefined,
    });
    expect(highImpact).toBe("high");
    expect(
      shouldTriggerStageImpactBurst({
        isEngineFocus: true,
        nyanoReactionInput: {
          flipCount: 0,
          hasChain: false,
          comboEffect: "none",
          warningTriggered: false,
          tilesA: 5,
          tilesB: 4,
          perspective: 0,
          finished: true,
          winner: 0,
        },
        nyanoReactionImpact: highImpact,
      }),
    ).toBe(true);
    expect(resolveStageImpactBurstDurationMs("high")).toBe(960);
    expect(resolveStageImpactBurstDurationMs("mid")).toBe(760);
  });

  it("gates board burst by animation, flipped count and cooldown", () => {
    const noAnim = resolveBoardImpactBurstState({
      useMintUi: true,
      boardAnimIsAnimating: false,
      flippedCellCount: 3,
      nowMs: 1000,
      lastBoardImpactAtMs: 0,
    });
    expect(noAnim).toEqual({ trigger: false, nextLastBoardImpactAtMs: 0 });

    const underCooldown = resolveBoardImpactBurstState({
      useMintUi: true,
      boardAnimIsAnimating: true,
      flippedCellCount: 3,
      nowMs: 1500,
      lastBoardImpactAtMs: 1000,
      cooldownMs: 600,
    });
    expect(underCooldown).toEqual({ trigger: false, nextLastBoardImpactAtMs: 1000 });

    const triggered = resolveBoardImpactBurstState({
      useMintUi: true,
      boardAnimIsAnimating: true,
      flippedCellCount: 3,
      nowMs: 3000,
      lastBoardImpactAtMs: 1000,
    });
    expect(triggered).toEqual({ trigger: true, nextLastBoardImpactAtMs: 3000 });
    expect(resolveBoardImpactBurstDurationMs()).toBe(560);
  });
});
