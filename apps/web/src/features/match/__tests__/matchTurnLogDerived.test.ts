import { describe, expect, it } from "vitest";
import type { CardData, MatchResultWithHistory } from "@nyano/triad-engine";
import {
  resolveMatchLastFlipSummaryText,
  resolveMatchLastFlipTraces,
  resolveMatchRpgLogEntries,
} from "@/features/match/matchTurnLogDerived";

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

function makeCard(tokenId: bigint, jankenHand: 0 | 1 | 2): CardData {
  return {
    tokenId,
    edges: { up: 1, right: 2, down: 3, left: 4 },
    jankenHand,
    combatStatSum: 10,
    trait: "none",
  };
}

describe("features/match/matchTurnLogDerived", () => {
  it("returns null summary when simulation is not ready", () => {
    const result = resolveMatchLastFlipSummaryText({
      simOk: false,
      previewTurns: [],
      turnCount: 0,
    });
    expect(result).toBeNull();
  });

  it("summarizes flip traces from the latest turn", () => {
    const previewTurns = [
      makePreviewTurn(),
      makePreviewTurn({
        flipTraces: [{ from: 4, to: 1, kind: "diag", isChain: true, aVal: 8, dVal: 3, tieBreak: false }],
      }),
    ];
    const result = resolveMatchLastFlipSummaryText({
      simOk: true,
      previewTurns,
      turnCount: 2,
      summarizeFlipTraces: (traces) => `summary:${traces.length}`,
    });
    expect(result).toBe("summary:1");
  });

  it("maps last flip traces into overlay arrows", () => {
    const previewTurns = [
      makePreviewTurn({
        flipTraces: [{ from: 2, to: 5, kind: "diag", isChain: false, aVal: 6, dVal: 4, tieBreak: true }],
      }),
    ];
    const result = resolveMatchLastFlipTraces({
      useMintUi: true,
      simOk: true,
      previewTurns,
      turnCount: 1,
    });
    expect(result).toEqual([
      {
        from: 2,
        to: 5,
        isChain: false,
        kind: "diag",
        aVal: 6,
        dVal: 4,
        tieBreak: true,
      },
    ]);
  });

  it("returns null arrows for non-mint UI", () => {
    const result = resolveMatchLastFlipTraces({
      useMintUi: false,
      simOk: true,
      previewTurns: [makePreviewTurn()],
      turnCount: 1,
    });
    expect(result).toBeNull();
  });

  it("builds RPG log entries with janken fallback", () => {
    const previewTurns = [
      makePreviewTurn({ turnIndex: 0, player: 0, cell: 2, tokenId: 1n, flipCount: 0 }),
      makePreviewTurn({ turnIndex: 1, player: 1, cell: 4, tokenId: 99n, flipCount: 2 }),
    ];
    const cards = new Map<bigint, CardData>([[1n, makeCard(1n, 2)]]);
    const result = resolveMatchRpgLogEntries({
      simOk: true,
      previewTurns,
      cards,
    });
    expect(result).toEqual([
      { turnIndex: 0, player: 0, cell: 2, janken: 2, flipCount: 0 },
      { turnIndex: 1, player: 1, cell: 4, janken: 0, flipCount: 2 },
    ]);
  });
});
