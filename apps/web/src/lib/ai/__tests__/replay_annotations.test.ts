import { describe, it, expect } from "vitest";
import { annotateReplayMoves } from "../replay_annotations";
import type { MatchResultWithHistory, BoardCell, BoardState, TurnSummary } from "@nyano/triad-engine";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeCard(edges: [number, number, number, number], jankenHand: 0 | 1 | 2 = 0): BoardCell["card"] {
  return {
    tokenId: 1n,
    edges: { up: edges[0], right: edges[1], down: edges[2], left: edges[3] },
    jankenHand,
    combatStatSum: edges[0] + edges[1] + edges[2] + edges[3],
  } as BoardCell["card"];
}

function makeCell(owner: 0 | 1, edges: [number, number, number, number] = [5, 5, 5, 5]): BoardCell {
  return { owner, card: makeCard(edges) } as BoardCell;
}

function emptyBoard(): BoardState {
  return Array.from({ length: 9 }, () => null) as BoardState;
}

function makeTurn(turnIndex: number): TurnSummary {
  return {
    turnIndex,
    player: 0,
    cell: turnIndex,
    cardIndex: turnIndex % 5,
    tokenId: BigInt(turnIndex + 1),
    flipTraces: [],
    flipCount: 0,
    warningPlaced: null,
    warningTriggered: false,
    appliedBonus: { triadPlus: 0, ignoreWarningMark: false },
    comboCount: 1,
    comboEffect: "none",
  } as TurnSummary;
}

function makeResult(
  boardHistory: BoardState[],
  turnCount: number,
): MatchResultWithHistory {
  return {
    boardHistory,
    turns: Array.from({ length: turnCount }, (_, i) => makeTurn(i)),
    winner: 0,
    tiles: { A: 5, B: 4 },
    tieBreak: "none",
    board: boardHistory[boardHistory.length - 1],
    matchId: "0xabc" as `0x${string}`,
    formations: { A: [], B: [] },
  } as MatchResultWithHistory;
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe("annotateReplayMoves", () => {
  it("returns empty for empty boardHistory", () => {
    const result = makeResult([], 0);
    expect(annotateReplayMoves(result, 0)).toEqual([]);
  });

  it("returns empty for single-element boardHistory (no moves)", () => {
    const result = makeResult([emptyBoard()], 0);
    expect(annotateReplayMoves(result, 0)).toEqual([]);
  });

  it("returns 9 annotations for full game", () => {
    // Build a realistic-ish boardHistory with 10 snapshots (9 turns)
    const history: BoardState[] = [emptyBoard()];
    for (let i = 0; i < 9; i++) {
      const prev = history[i].slice() as BoardState;
      const owner = (i % 2) as 0 | 1;
      prev[i] = makeCell(owner, [3, 3, 3, 3]);
      history.push(prev);
    }

    const result = makeResult(history, 9);
    const annotations = annotateReplayMoves(result, 0);

    expect(annotations).toHaveLength(9);
    for (let i = 0; i < 9; i++) {
      expect(annotations[i].turnIndex).toBe(i);
    }
  });

  it("alternates player correctly based on firstPlayer", () => {
    const history: BoardState[] = [emptyBoard()];
    for (let i = 0; i < 4; i++) {
      const prev = history[i].slice() as BoardState;
      prev[i] = makeCell((i % 2) as 0 | 1);
      history.push(prev);
    }

    // firstPlayer = 0: sequence 0, 1, 0, 1
    const annot0 = annotateReplayMoves(makeResult(history, 4), 0);
    expect(annot0.map((a) => a.player)).toEqual([0, 1, 0, 1]);

    // firstPlayer = 1: sequence 1, 0, 1, 0
    const annot1 = annotateReplayMoves(makeResult(history, 4), 1);
    expect(annot1.map((a) => a.player)).toEqual([1, 0, 1, 0]);
  });

  it("classifies quality based on delta sign and magnitude", () => {
    // Place a strong card (high edges) on centre → should score big positive for player
    const b0 = emptyBoard();
    const b1 = emptyBoard();
    b1[4] = makeCell(0, [9, 9, 9, 9]); // player 0 takes centre with strong card

    const result = makeResult([b0, b1], 1);
    const [ann] = annotateReplayMoves(result, 0);

    expect(ann.delta).toBeGreaterThan(0);
    // A centre place with all-9 edges should score well — at least "Good"
    expect(["Excellent", "Great", "Good"]).toContain(ann.quality);
  });
});
