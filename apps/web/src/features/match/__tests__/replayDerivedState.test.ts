import { describe, expect, it } from "vitest";
import type { BoardCell, MatchResultWithHistory } from "@nyano/triad-engine";
import {
  replayBoardEquals,
  resolveReplayBoardDelta,
  resolveReplayNyanoReactionInput,
} from "@/features/match/replayDerivedState";

type ReplayTurn = MatchResultWithHistory["turns"][number];

function makeTurn(overrides: Partial<ReplayTurn> = {}): ReplayTurn {
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
  } as ReplayTurn;
}

function makeBoard(cells: Array<{ owner: 0 | 1; tokenId: bigint } | null>): Array<BoardCell | null> {
  return cells.map((cell) => {
    if (!cell) return null;
    return {
      owner: cell.owner,
      card: { tokenId: cell.tokenId },
    } as BoardCell;
  });
}

describe("features/match/replayDerivedState", () => {
  it("compares replay boards by owner and token id", () => {
    const boardA = makeBoard([
      { owner: 0, tokenId: 1n },
      { owner: 1, tokenId: 2n },
      null,
    ]);
    const boardB = makeBoard([
      { owner: 0, tokenId: 1n },
      { owner: 1, tokenId: 2n },
      null,
    ]);
    const boardC = makeBoard([
      { owner: 0, tokenId: 1n },
      { owner: 1, tokenId: 3n },
      null,
    ]);

    expect(replayBoardEquals(boardA, boardB)).toBe(true);
    expect(replayBoardEquals(boardA, boardC)).toBe(false);
  });

  it("derives placed cell and flipped cells from board delta", () => {
    const boardPrev = makeBoard([
      { owner: 0, tokenId: 11n },
      { owner: 0, tokenId: 22n },
      null,
    ]);
    const boardNow = makeBoard([
      { owner: 0, tokenId: 11n },
      { owner: 1, tokenId: 22n },
      { owner: 1, tokenId: 33n },
    ]);

    expect(resolveReplayBoardDelta({ boardPrev, boardNow })).toEqual({
      placedCell: 2,
      flippedCells: [1],
    });
  });

  it("returns null reaction input at step 0 or when turns are missing", () => {
    const resultWithoutTurns = {
      turns: [],
      boardHistory: [makeBoard([null, null, null])],
      board: makeBoard([null, null, null]),
      winner: null,
    } as unknown as MatchResultWithHistory;

    expect(resolveReplayNyanoReactionInput({ result: resultWithoutTurns, step: 0 })).toBeNull();
    expect(resolveReplayNyanoReactionInput({ result: resultWithoutTurns, step: 1 })).toBeNull();
  });

  it("builds replay reaction input from last executed turn and board fallback", () => {
    const result = {
      turns: [
        makeTurn({ turnIndex: 0, flipCount: 1 }),
        makeTurn({
          turnIndex: 1,
          flipCount: 2,
          flipTraces: [{ from: 4, to: 1, kind: "ortho", isChain: true, aVal: 8, dVal: 3, tieBreak: false }],
          comboEffect: "fever",
          warningTriggered: true,
        }),
      ],
      boardHistory: [
        makeBoard([null, null, null]),
        makeBoard([{ owner: 0, tokenId: 11n }, null, null]),
        makeBoard([{ owner: 0, tokenId: 11n }, { owner: 1, tokenId: 22n }, null]),
      ],
      board: makeBoard([{ owner: 0, tokenId: 11n }, { owner: 0, tokenId: 44n }, { owner: 1, tokenId: 22n }]),
      winner: 0,
    } as unknown as MatchResultWithHistory;

    expect(resolveReplayNyanoReactionInput({ result, step: 2 })).toMatchObject({
      flipCount: 2,
      hasChain: true,
      comboEffect: "fever",
      warningTriggered: true,
      tilesA: 1,
      tilesB: 1,
      perspective: null,
      finished: false,
      winner: null,
    });
    expect(resolveReplayNyanoReactionInput({ result, step: 9 })).toMatchObject({
      tilesA: 2,
      tilesB: 1,
      finished: true,
      winner: 0,
    });
  });
});
