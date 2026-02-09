import { describe, it, expect } from "vitest";
import type { BoardCell, CardData, PlayerIndex } from "@nyano/triad-engine";
import { assessBoardAdvantage } from "../board_advantage";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeCard(edges: { up: number; right: number; down: number; left: number }): CardData {
  return {
    tokenId: BigInt(1),
    edges,
    jankenHand: 0,
    combatStatSum: edges.up + edges.right + edges.down + edges.left,
    trait: "none",
  };
}

function makeCell(owner: PlayerIndex, edges: { up: number; right: number; down: number; left: number }): BoardCell {
  return {
    owner,
    card: makeCard(edges),
    state: { forestShield: 0 },
  };
}

function emptyBoard(): (BoardCell | null)[] {
  return Array(9).fill(null);
}

/* ------------------------------------------------------------------ */
/* assessBoardAdvantage                                                 */
/* ------------------------------------------------------------------ */

describe("assessBoardAdvantage", () => {
  it("empty board → even, scoreA = 0", () => {
    const result = assessBoardAdvantage(emptyBoard());
    expect(result.scoreA).toBe(0);
    expect(result.levelA).toBe("even");
    expect(result.levelB).toBe("even");
    expect(result.labelJa).toBe("互角");
    expect(result.badgeColor).toBe("slate");
  });

  it("single A tile at center → positive scoreA", () => {
    const board = emptyBoard();
    board[4] = makeCell(0, { up: 5, right: 5, down: 5, left: 5 });
    const result = assessBoardAdvantage(board);
    expect(result.scoreA).toBeGreaterThan(0);
    // 10 (tile diff) + 3 (center) + edge bonus ≈ 14
    expect(result.levelA).not.toBe("even");
  });

  it("single B tile at center → negative scoreA", () => {
    const board = emptyBoard();
    board[4] = makeCell(1, { up: 5, right: 5, down: 5, left: 5 });
    const result = assessBoardAdvantage(board);
    expect(result.scoreA).toBeLessThan(0);
    expect(result.levelB).not.toBe("even");
  });

  it("mirror: A at center vs B at center produce opposite scores", () => {
    const boardA = emptyBoard();
    boardA[4] = makeCell(0, { up: 5, right: 5, down: 5, left: 5 });
    const resultA = assessBoardAdvantage(boardA);

    const boardB = emptyBoard();
    boardB[4] = makeCell(1, { up: 5, right: 5, down: 5, left: 5 });
    const resultB = assessBoardAdvantage(boardB);

    expect(resultA.scoreA).toBeCloseTo(-resultB.scoreA, 5);
  });

  it("even range: small score within ±4 → even", () => {
    // Two tiles with balanced edges, one per player, no center
    const board = emptyBoard();
    board[0] = makeCell(0, { up: 5, right: 5, down: 5, left: 5 });
    board[8] = makeCell(1, { up: 5, right: 5, down: 5, left: 5 });
    const result = assessBoardAdvantage(board);
    // Both own a corner → tile diff = 0, corner bonus cancel
    expect(result.labelJa).toBe("互角");
    expect(result.levelA).toBe("even");
    expect(result.levelB).toBe("even");
  });

  it("dominant A: many A tiles → A圧倒", () => {
    const board = emptyBoard();
    const strong = { up: 8, right: 8, down: 8, left: 8 };
    // A owns 5 tiles including center and corners
    board[0] = makeCell(0, strong);
    board[2] = makeCell(0, strong);
    board[4] = makeCell(0, strong);
    board[6] = makeCell(0, strong);
    board[8] = makeCell(0, strong);
    const result = assessBoardAdvantage(board);
    // 50 (5 tiles × 10) + 3 (center) + 8 (4 corners × 2) = 61+
    expect(result.scoreA).toBeGreaterThanOrEqual(25);
    expect(result.levelA).toBe("dominant");
    expect(result.labelJa).toBe("A圧倒");
    expect(result.badgeColor).toBe("emerald");
  });

  it("dominant B: many B tiles → B圧倒", () => {
    const board = emptyBoard();
    const strong = { up: 8, right: 8, down: 8, left: 8 };
    board[0] = makeCell(1, strong);
    board[2] = makeCell(1, strong);
    board[4] = makeCell(1, strong);
    board[6] = makeCell(1, strong);
    board[8] = makeCell(1, strong);
    const result = assessBoardAdvantage(board);
    expect(result.scoreA).toBeLessThanOrEqual(-25);
    expect(result.levelB).toBe("dominant");
    expect(result.labelJa).toBe("B圧倒");
    expect(result.badgeColor).toBe("red");
  });

  it("strong A: A ahead with clear margin → A優勢", () => {
    const board = emptyBoard();
    // A has 2 tiles, B has 0 → tile diff = 20
    board[0] = makeCell(0, { up: 5, right: 5, down: 5, left: 5 });
    board[4] = makeCell(0, { up: 5, right: 5, down: 5, left: 5 });
    const result = assessBoardAdvantage(board);
    // 20 (tile diff) + 3 (center) + 4 (corner) ≈ 28
    expect(result.scoreA).toBeGreaterThanOrEqual(12);
    expect(["strong", "dominant"]).toContain(result.levelA);
    expect(result.badgeColor).toBe("emerald");
  });

  it("slight A: A ahead by small margin → Aやや有利", () => {
    const board = emptyBoard();
    // A has 1 tile at edge (not center, not corner), B has 0
    board[1] = makeCell(0, { up: 2, right: 2, down: 2, left: 2 });
    const result = assessBoardAdvantage(board);
    // 10 (tile diff) + 0.4 (edge sum 8 × 0.05) ≈ 10.4 — between 4 and 12
    expect(result.scoreA).toBeGreaterThanOrEqual(4);
    expect(result.scoreA).toBeLessThan(12);
    expect(result.levelA).toBe("slight");
    expect(result.labelJa).toBe("Aやや有利");
    expect(result.badgeColor).toBe("teal");
  });

  it("slight B: B ahead by small margin → Bやや有利", () => {
    const board = emptyBoard();
    board[1] = makeCell(1, { up: 2, right: 2, down: 2, left: 2 });
    const result = assessBoardAdvantage(board);
    expect(result.scoreA).toBeLessThanOrEqual(-4);
    expect(result.scoreA).toBeGreaterThan(-12);
    expect(result.levelB).toBe("slight");
    expect(result.labelJa).toBe("Bやや有利");
    expect(result.badgeColor).toBe("amber");
  });

  it("strong B: B clearly ahead → B優勢", () => {
    const board = emptyBoard();
    // B has 1 tile at edge (not center, not corner) + 1 at corner
    // score ≈ -20 (tile diff) -2 (corner) ≈ -22 → "strong" range
    board[1] = makeCell(1, { up: 3, right: 3, down: 3, left: 3 });
    board[2] = makeCell(1, { up: 3, right: 3, down: 3, left: 3 });
    const result = assessBoardAdvantage(board);
    expect(result.scoreA).toBeLessThanOrEqual(-12);
    expect(result.scoreA).toBeGreaterThan(-25);
    expect(result.levelB).toBe("strong");
    expect(result.labelJa).toBe("B優勢");
    expect(result.badgeColor).toBe("amber");
  });

  it("full board: 5A vs 4B → A advantage", () => {
    const board = emptyBoard();
    const mid = { up: 5, right: 5, down: 5, left: 5 };
    // A owns 5 cells
    board[0] = makeCell(0, mid);
    board[1] = makeCell(0, mid);
    board[2] = makeCell(0, mid);
    board[3] = makeCell(0, mid);
    board[4] = makeCell(0, mid);
    // B owns 4 cells
    board[5] = makeCell(1, mid);
    board[6] = makeCell(1, mid);
    board[7] = makeCell(1, mid);
    board[8] = makeCell(1, mid);
    const result = assessBoardAdvantage(board);
    // Tile diff: (5-4)*10 = 10, plus center +3, corner bonuses
    expect(result.scoreA).toBeGreaterThan(0);
    expect(result.levelA).not.toBe("even");
  });

  it("scoreA sign matches level direction", () => {
    const board = emptyBoard();
    board[4] = makeCell(0, { up: 7, right: 7, down: 7, left: 7 });
    const result = assessBoardAdvantage(board);
    if (result.scoreA > 0) {
      expect(result.levelA).not.toBe("even");
      expect(result.levelB).toBe("even");
    } else if (result.scoreA < 0) {
      expect(result.levelB).not.toBe("even");
      expect(result.levelA).toBe("even");
    } else {
      expect(result.levelA).toBe("even");
      expect(result.levelB).toBe("even");
    }
  });

  it("vulnerability effect: weak A card next to strong B card → lower A score", () => {
    const boardA = emptyBoard();
    // A alone
    boardA[4] = makeCell(0, { up: 2, right: 2, down: 2, left: 2 });
    const aloneScore = assessBoardAdvantage(boardA).scoreA;

    const boardB = emptyBoard();
    // A with a strong B neighbor
    boardB[4] = makeCell(0, { up: 2, right: 2, down: 2, left: 2 });
    boardB[1] = makeCell(1, { up: 9, right: 9, down: 9, left: 9 });
    const withEnemyScore = assessBoardAdvantage(boardB).scoreA;

    // The score with enemy neighbor should be lower (vulnerability + enemy tiles)
    expect(withEnemyScore).toBeLessThan(aloneScore);
  });

  it("return type has all required fields", () => {
    const result = assessBoardAdvantage(emptyBoard());
    expect(result).toHaveProperty("scoreA");
    expect(result).toHaveProperty("levelA");
    expect(result).toHaveProperty("levelB");
    expect(result).toHaveProperty("labelJa");
    expect(result).toHaveProperty("badgeColor");
    expect(typeof result.scoreA).toBe("number");
    expect(typeof result.labelJa).toBe("string");
    expect(typeof result.badgeColor).toBe("string");
  });
});
