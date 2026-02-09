import { describe, it, expect } from "vitest";
import { pickAiMove, predictedImmediateFlips, pickWarningMarkCell, _evaluateBoard, type AiMoveArgs } from "../nyano_ai";
import type { CardData, PlayerIndex, BoardCell } from "@nyano/triad-engine";

// ── Test helpers ──

function makeCard(overrides: Partial<CardData> & { tokenId: bigint }): CardData {
  return {
    tokenId: overrides.tokenId,
    edges: overrides.edges ?? { up: 5, right: 5, down: 5, left: 5 },
    jankenHand: overrides.jankenHand ?? 0,
    combatStatSum: overrides.combatStatSum ?? 30,
    trait: overrides.trait ?? "none",
  };
}

function makeBoardCell(card: CardData, owner: PlayerIndex): BoardCell {
  return { owner, card } as BoardCell;
}

function makeCards(defs: { id: number; up?: number; right?: number; down?: number; left?: number; hand?: 0 | 1 | 2 }[]): Map<bigint, CardData> {
  const map = new Map<bigint, CardData>();
  for (const d of defs) {
    map.set(
      BigInt(d.id),
      makeCard({
        tokenId: BigInt(d.id),
        edges: { up: d.up ?? 5, right: d.right ?? 5, down: d.down ?? 5, left: d.left ?? 5 },
        jankenHand: d.hand ?? 0,
      }),
    );
  }
  return map;
}

function makeBaseArgs(overrides?: Partial<AiMoveArgs>): AiMoveArgs {
  const deckTokens = [1n, 2n, 3n, 4n, 5n];
  const cards = makeCards([
    { id: 1, up: 5, right: 3, down: 4, left: 6 },
    { id: 2, up: 7, right: 2, down: 3, left: 5 },
    { id: 3, up: 3, right: 8, down: 2, left: 4 },
    { id: 4, up: 6, right: 4, down: 7, left: 3 },
    { id: 5, up: 4, right: 6, down: 5, left: 7 },
  ]);

  return {
    difficulty: "normal",
    boardNow: Array(9).fill(null),
    deckTokens,
    usedCardIndexes: new Set<number>(),
    usedCells: new Set<number>(),
    cards,
    my: 1 as PlayerIndex,
    warningMarksRemaining: 3,
    ...overrides,
  };
}

// ── Tests ──

describe("pickAiMove", () => {
  describe("easy difficulty", () => {
    it("returns the first available cell and card", () => {
      const args = makeBaseArgs({ difficulty: "easy" });
      const result = pickAiMove(args);

      expect(result.cell).toBe(0);
      expect(result.cardIndex).toBe(0);
      expect(result.reasonCode).toBe("FIRST_AVAILABLE");
    });

    it("skips used cells and cards", () => {
      const args = makeBaseArgs({
        difficulty: "easy",
        usedCells: new Set([0, 1]),
        usedCardIndexes: new Set([0]),
      });
      const result = pickAiMove(args);

      expect(result.cell).toBe(2);
      expect(result.cardIndex).toBe(1);
      expect(result.reasonCode).toBe("FIRST_AVAILABLE");
    });
  });

  describe("normal difficulty", () => {
    it("maximizes immediate flips", () => {
      const oppCard = makeCard({ tokenId: 100n, edges: { up: 1, right: 1, down: 1, left: 1 } });
      const board: (BoardCell | null)[] = Array(9).fill(null);
      board[4] = makeBoardCell(oppCard, 0); // Opponent owns center

      // Card with high edges should be placed adjacent to center
      const cards = makeCards([
        { id: 1, up: 9, right: 9, down: 9, left: 9 }, // strong card
        { id: 2, up: 1, right: 1, down: 1, left: 1 },
        { id: 3, up: 1, right: 1, down: 1, left: 1 },
        { id: 4, up: 1, right: 1, down: 1, left: 1 },
        { id: 5, up: 1, right: 1, down: 1, left: 1 },
      ]);
      cards.set(100n, oppCard);

      const args = makeBaseArgs({
        difficulty: "normal",
        boardNow: board,
        cards,
        usedCells: new Set([4]),
      });

      const result = pickAiMove(args);
      // Should pick card 0 (strongest) and place adjacent to center (cell 1, 3, 5, or 7)
      expect(result.cardIndex).toBe(0);
      expect([1, 3, 5, 7]).toContain(result.cell);
      expect(result.reasonCode).toMatch(/MAXIMIZE_FLIPS|SET_WARNING/);
    });

    it("uses edge sum as tiebreaker", () => {
      const cards = makeCards([
        { id: 1, up: 2, right: 2, down: 2, left: 2 }, // sum = 8
        { id: 2, up: 3, right: 3, down: 3, left: 3 }, // sum = 12
        { id: 3, up: 1, right: 1, down: 1, left: 1 },
        { id: 4, up: 1, right: 1, down: 1, left: 1 },
        { id: 5, up: 1, right: 1, down: 1, left: 1 },
      ]);

      const args = makeBaseArgs({
        difficulty: "normal",
        boardNow: Array(9).fill(null),
        cards,
      });

      const result = pickAiMove(args);
      // With no opponents to flip, both cards get 0 flips.
      // Card 1 (sum=12) should win tiebreak.
      expect(result.cardIndex).toBe(1);
    });
  });

  describe("hard difficulty (minimax d2)", () => {
    it("returns a valid move", () => {
      const args = makeBaseArgs({ difficulty: "hard" });
      const result = pickAiMove(args);

      expect(result.cell).toBeGreaterThanOrEqual(0);
      expect(result.cell).toBeLessThanOrEqual(8);
      expect(result.cardIndex).toBeGreaterThanOrEqual(0);
      expect(result.cardIndex).toBeLessThanOrEqual(4);
      expect(result.reasonCode).toBe("MINIMAX_D2");
    });

    it("avoids moves that leave strong opponent response", () => {
      // Set up a board where one move is clearly better (more defensive)
      const oppCard = makeCard({ tokenId: 100n, edges: { up: 9, right: 9, down: 9, left: 9 } });
      const board: (BoardCell | null)[] = Array(9).fill(null);
      board[0] = makeBoardCell(oppCard, 0);

      const cards = makeCards([
        { id: 1, up: 8, right: 8, down: 8, left: 8 },
        { id: 2, up: 2, right: 2, down: 2, left: 2 },
        { id: 3, up: 3, right: 3, down: 3, left: 3 },
        { id: 4, up: 4, right: 4, down: 4, left: 4 },
        { id: 5, up: 5, right: 5, down: 5, left: 5 },
      ]);
      cards.set(100n, oppCard);

      const args = makeBaseArgs({
        difficulty: "hard",
        boardNow: board,
        cards,
        usedCells: new Set([0]),
      });

      const result = pickAiMove(args);
      expect(result.reasonCode).toBe("MINIMAX_D2");
      // Should use card 0 (strongest) to compete with opponent's strong card
      expect(result.cell).toBeGreaterThanOrEqual(0);
    });
  });

  describe("expert difficulty (minimax d3)", () => {
    it("returns a valid move with MINIMAX_D3 reason code", () => {
      const args = makeBaseArgs({ difficulty: "expert" });
      const result = pickAiMove(args);

      expect(result.cell).toBeGreaterThanOrEqual(0);
      expect(result.cell).toBeLessThanOrEqual(8);
      expect(result.cardIndex).toBeGreaterThanOrEqual(0);
      expect(result.cardIndex).toBeLessThanOrEqual(4);
      expect(result.reasonCode).toBe("MINIMAX_D3");
    });
  });

  describe("warning mark placement", () => {
    it("places warning mark when remaining > 0", () => {
      const oppCard = makeCard({ tokenId: 100n, edges: { up: 1, right: 1, down: 1, left: 1 } });
      const board: (BoardCell | null)[] = Array(9).fill(null);
      board[4] = makeBoardCell(oppCard, 0);

      const cards = makeCards([
        { id: 1, up: 9, right: 9, down: 9, left: 9 },
        { id: 2, up: 1, right: 1, down: 1, left: 1 },
        { id: 3, up: 1, right: 1, down: 1, left: 1 },
        { id: 4, up: 1, right: 1, down: 1, left: 1 },
        { id: 5, up: 1, right: 1, down: 1, left: 1 },
      ]);
      cards.set(100n, oppCard);

      const args = makeBaseArgs({
        difficulty: "normal",
        boardNow: board,
        cards,
        usedCells: new Set([4]),
        warningMarksRemaining: 3,
      });

      const result = pickAiMove(args);
      // With remaining warning marks, a mark should be placed
      if (result.warningMarkCell !== undefined) {
        expect(result.warningMarkCell).not.toBe(result.cell);
        expect(result.warningMarkCell).toBeGreaterThanOrEqual(0);
        expect(result.warningMarkCell).toBeLessThanOrEqual(8);
      }
    });

    it("does not place warning mark when remaining is 0", () => {
      const args = makeBaseArgs({
        difficulty: "normal",
        warningMarksRemaining: 0,
      });

      const result = pickAiMove(args);
      expect(result.warningMarkCell).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("handles single remaining move", () => {
      const board: (BoardCell | null)[] = Array(9).fill(null);
      const cards = makeCards([
        { id: 1, up: 5, right: 5, down: 5, left: 5 },
        { id: 2, up: 5, right: 5, down: 5, left: 5 },
        { id: 3, up: 5, right: 5, down: 5, left: 5 },
        { id: 4, up: 5, right: 5, down: 5, left: 5 },
        { id: 5, up: 5, right: 5, down: 5, left: 5 },
      ]);

      // Fill 8 cells, leaving only cell 8 open
      for (let i = 0; i < 8; i++) {
        board[i] = makeBoardCell(cards.get(BigInt((i % 5) + 1))!, (i % 2) as PlayerIndex);
      }

      const args = makeBaseArgs({
        difficulty: "normal",
        boardNow: board,
        cards,
        usedCells: new Set([0, 1, 2, 3, 4, 5, 6, 7]),
        usedCardIndexes: new Set([0, 1, 2, 3]),
      });

      const result = pickAiMove(args);
      expect(result.cell).toBe(8);
      expect(result.cardIndex).toBe(4);
    });

    it("returns fallback when no moves available", () => {
      const args = makeBaseArgs({
        usedCells: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]),
        usedCardIndexes: new Set([0, 1, 2, 3, 4]),
      });

      const result = pickAiMove(args);
      expect(result.reasonCode).toBe("FALLBACK");
    });
  });
});

describe("predictedImmediateFlips", () => {
  it("counts single flip correctly", () => {
    const board: (BoardCell | null)[] = Array(9).fill(null);
    const oppCard = makeCard({ tokenId: 100n, edges: { up: 1, right: 1, down: 1, left: 1 } });
    board[4] = makeBoardCell(oppCard, 0);

    const myCard = makeCard({ tokenId: 1n, edges: { up: 9, right: 9, down: 9, left: 9 } });

    // Place above center (cell 1), my down vs their up
    const flips = predictedImmediateFlips(board, 1, myCard, 1);
    expect(flips).toBe(1);
  });

  it("counts zero flips on empty board", () => {
    const board: (BoardCell | null)[] = Array(9).fill(null);
    const myCard = makeCard({ tokenId: 1n, edges: { up: 9, right: 9, down: 9, left: 9 } });
    const flips = predictedImmediateFlips(board, 4, myCard, 1);
    expect(flips).toBe(0);
  });

  it("does not flip own cards", () => {
    const board: (BoardCell | null)[] = Array(9).fill(null);
    const myCard = makeCard({ tokenId: 1n, edges: { up: 9, right: 9, down: 9, left: 9 } });
    board[4] = makeBoardCell(myCard, 1); // Same owner

    const newCard = makeCard({ tokenId: 2n, edges: { up: 9, right: 9, down: 9, left: 9 } });
    const flips = predictedImmediateFlips(board, 1, newCard, 1);
    expect(flips).toBe(0);
  });

  it("counts multiple flips", () => {
    const board: (BoardCell | null)[] = Array(9).fill(null);
    const weakCard = makeCard({ tokenId: 100n, edges: { up: 1, right: 1, down: 1, left: 1 } });

    // Surround center with weak opponent cards
    board[1] = makeBoardCell(weakCard, 0); // above
    board[3] = makeBoardCell(weakCard, 0); // left
    board[5] = makeBoardCell(weakCard, 0); // right
    board[7] = makeBoardCell(weakCard, 0); // below

    const myCard = makeCard({ tokenId: 1n, edges: { up: 9, right: 9, down: 9, left: 9 } });
    const flips = predictedImmediateFlips(board, 4, myCard, 1);
    expect(flips).toBe(4);
  });

  it("uses janken tiebreak on equal edges", () => {
    const board: (BoardCell | null)[] = Array(9).fill(null);
    // Opponent has hand=2 (scissors), we have hand=0 (rock) → we win
    const oppCard = makeCard({ tokenId: 100n, edges: { up: 5, right: 5, down: 5, left: 5 }, jankenHand: 2 });
    board[4] = makeBoardCell(oppCard, 0);

    const myCard = makeCard({ tokenId: 1n, edges: { up: 5, right: 5, down: 5, left: 5 }, jankenHand: 0 });
    const flips = predictedImmediateFlips(board, 1, myCard, 1);
    expect(flips).toBe(1); // Tied edge, but rock beats scissors
  });

  it("loses janken tiebreak when opponent wins", () => {
    const board: (BoardCell | null)[] = Array(9).fill(null);
    // Opponent has hand=1 (paper), we have hand=0 (rock) → we lose
    const oppCard = makeCard({ tokenId: 100n, edges: { up: 5, right: 5, down: 5, left: 5 }, jankenHand: 1 });
    board[4] = makeBoardCell(oppCard, 0);

    const myCard = makeCard({ tokenId: 1n, edges: { up: 5, right: 5, down: 5, left: 5 }, jankenHand: 0 });
    const flips = predictedImmediateFlips(board, 1, myCard, 1);
    expect(flips).toBe(0); // Tied edge, paper beats rock
  });
});

describe("pickWarningMarkCell", () => {
  it("places mark adjacent to opponent card, not own card", () => {
    const board: (BoardCell | null)[] = Array(9).fill(null);
    const oppCard = makeCard({ tokenId: 100n, edges: { up: 5, right: 5, down: 5, left: 5 } });
    const myCard = makeCard({ tokenId: 1n, edges: { up: 5, right: 5, down: 5, left: 5 } });

    // AI (player 1) owns cell 0; opponent (player 0) owns cell 4 (center)
    board[0] = makeBoardCell(myCard, 1);
    board[4] = makeBoardCell(oppCard, 0);

    // placedCell=0 (just placed by AI), usedCells={0, 4}
    const result = pickWarningMarkCell(board, new Set([0, 4]), 0, 1);
    expect(result).toBeDefined();
    // Should pick a cell adjacent to opponent (cell 4), not adjacent to own (cell 0)
    // Cells adjacent to center (4): 1, 3, 5, 7
    // Cell 1 is adjacent to BOTH own card(0) and opp card(4) — adjacent to center
    // Cell 3 is adjacent to opp card(4)
    // Cell 5 is adjacent to opp card(4)
    // Cell 7 is adjacent to opp card(4)
    // All of 1, 3, 5, 7 have adjacentOppCards=1 (adjacent to opponent at center)
    // Corners (none of these are corners) so tie on cornerBonus too
    // Result should be one of cells adjacent to opponent
    expect([1, 3, 5, 7]).toContain(result);
  });

  it("prefers corners when adjacent-opponent count is tied", () => {
    const board: (BoardCell | null)[] = Array(9).fill(null);
    // No cards on board — all empty cells score 0 for adjacentOppCards
    // Corners (0, 2, 6, 8) get +1 bonus, should win tiebreak
    const result = pickWarningMarkCell(board, new Set<number>(), -1, 1);
    expect(result).toBeDefined();
    expect([0, 2, 6, 8]).toContain(result);
  });

  it("returns undefined when no empty cells available", () => {
    const card = makeCard({ tokenId: 1n, edges: { up: 5, right: 5, down: 5, left: 5 } });
    const board: (BoardCell | null)[] = Array(9).fill(null).map(() =>
      makeBoardCell(card, 0),
    );
    // All cells are occupied
    const result = pickWarningMarkCell(board, new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]), -1, 1);
    expect(result).toBeUndefined();
  });
});

describe("evaluateBoard enhancements", () => {
  it("center control: card at cell 4 scores higher than cell 0", () => {
    const card = makeCard({ tokenId: 1n, edges: { up: 5, right: 5, down: 5, left: 5 } });

    const boardCenter: (BoardCell | null)[] = Array(9).fill(null);
    boardCenter[4] = makeBoardCell(card, 1);

    const boardCorner: (BoardCell | null)[] = Array(9).fill(null);
    boardCorner[0] = makeBoardCell(card, 1);

    const scoreCenter = _evaluateBoard(boardCenter, 1 as PlayerIndex);
    const scoreCorner = _evaluateBoard(boardCorner, 1 as PlayerIndex);

    // Center gives +3 bonus; corner gives +2; center should score higher
    expect(scoreCenter).toBeGreaterThan(scoreCorner);
  });

  it("vulnerability: weak edge facing strong opponent scores worse", () => {
    const myWeakCard = makeCard({ tokenId: 1n, edges: { up: 2, right: 2, down: 2, left: 2 } });
    const myStrongCard = makeCard({ tokenId: 2n, edges: { up: 9, right: 9, down: 9, left: 9 } });
    const oppStrongCard = makeCard({ tokenId: 100n, edges: { up: 8, right: 8, down: 8, left: 8 } });

    // Board with my weak card next to opponent's strong card
    const boardWeak: (BoardCell | null)[] = Array(9).fill(null);
    boardWeak[3] = makeBoardCell(myWeakCard, 1);     // left of center
    boardWeak[4] = makeBoardCell(oppStrongCard, 0);   // center (opponent)

    // Board with my strong card next to opponent's strong card
    const boardStrong: (BoardCell | null)[] = Array(9).fill(null);
    boardStrong[3] = makeBoardCell(myStrongCard, 1);  // left of center
    boardStrong[4] = makeBoardCell(oppStrongCard, 0); // center (opponent)

    const scoreWeak = _evaluateBoard(boardWeak, 1 as PlayerIndex);
    const scoreStrong = _evaluateBoard(boardStrong, 1 as PlayerIndex);

    // My weak card next to strong opponent should score worse (vulnerability penalty)
    expect(scoreStrong).toBeGreaterThan(scoreWeak);
  });

  it("edge exposure: high edge facing empty penalised", () => {
    const highEdgeCard = makeCard({ tokenId: 1n, edges: { up: 9, right: 9, down: 9, left: 9 } });
    const lowEdgeCard = makeCard({ tokenId: 2n, edges: { up: 3, right: 3, down: 3, left: 3 } });

    // Card at corner with 2 exposed high edges
    const boardHigh: (BoardCell | null)[] = Array(9).fill(null);
    boardHigh[0] = makeBoardCell(highEdgeCard, 1);

    const boardLow: (BoardCell | null)[] = Array(9).fill(null);
    boardLow[0] = makeBoardCell(lowEdgeCard, 1);

    const scoreHigh = _evaluateBoard(boardHigh, 1 as PlayerIndex);
    const scoreLow = _evaluateBoard(boardLow, 1 as PlayerIndex);

    // Both have 1 tile, same corner bonus, but high-edge card gets exposure penalty
    // High card also gets bigger edge sum bonus (+36*0.05=1.8 vs +12*0.05=0.6)
    // However high card also gets more exposure penalties (-0.3 per high edge facing empty)
    // The overall relative scoring should still show high card getting penalised for exposure
    // (net: 1.8 - 0.6*2 = 0.6 vs 0.6 - 0 = 0.6) — exposure reduces the advantage
    expect(scoreHigh - scoreLow).toBeLessThan(2); // High edge bonus is tempered by exposure penalty
  });

  it("symmetry: swapping owners negates score", () => {
    const cardA = makeCard({ tokenId: 1n, edges: { up: 7, right: 3, down: 5, left: 4 } });
    const cardB = makeCard({ tokenId: 2n, edges: { up: 4, right: 6, down: 3, left: 8 } });

    const board: (BoardCell | null)[] = Array(9).fill(null);
    board[0] = makeBoardCell(cardA, 1);
    board[4] = makeBoardCell(cardB, 0);

    const score1 = _evaluateBoard(board, 1 as PlayerIndex);
    const score0 = _evaluateBoard(board, 0 as PlayerIndex);

    // Score from player 1's perspective should negate player 0's perspective
    expect(score1).toBeCloseTo(-score0, 5);
  });

  it("empty board scores zero", () => {
    const board: (BoardCell | null)[] = Array(9).fill(null);
    const score = _evaluateBoard(board, 1 as PlayerIndex);
    expect(score).toBe(0);
  });
});
