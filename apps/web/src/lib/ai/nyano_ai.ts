// Nyano AI — standalone module for AI opponent logic.
//
// Difficulty levels:
// - easy:   first available cell + card
// - normal: maximize immediate flips, tiebreak by edge sum
// - hard:   minimax depth-2 (my move → opponent best response)
// - expert: alpha-beta depth-3 with move ordering

import type { CardData, PlayerIndex, BoardCell } from "@nyano/triad-engine";

export type AiDifficulty = "easy" | "normal" | "hard" | "expert";

export type AiReasonCode =
  | "FIRST_AVAILABLE"
  | "MAXIMIZE_FLIPS"
  | "BLOCK_CORNER"
  | "SET_WARNING"
  | "MINIMAX_D2"
  | "MINIMAX_D3"
  | "FALLBACK";

export type AiMoveResult = {
  cell: number;
  cardIndex: number;
  warningMarkCell?: number;
  reason: string;
  reasonCode: AiReasonCode;
};

export type AiMoveArgs = {
  difficulty: AiDifficulty;
  boardNow: (BoardCell | null)[];
  deckTokens: bigint[];
  usedCardIndexes: Set<number>;
  usedCells: Set<number>;
  cards: Map<bigint, CardData>;
  my: PlayerIndex;
  warningMarksRemaining: number;
};

// ────────────────────────────────────────────────────────────
// Core helpers
// ────────────────────────────────────────────────────────────

function jankenWins(a: number, b: number): boolean {
  if (a === b) return false;
  return (a === 0 && b === 2) || (a === 1 && b === 0) || (a === 2 && b === 1);
}

function edgeSum(card: CardData): number {
  return Number(card.edges.up) + Number(card.edges.right) + Number(card.edges.down) + Number(card.edges.left);
}

/**
 * Predict immediate orthogonal flips for placing `placed` at `cell`.
 * Does NOT account for chain flips, warning marks, or synergy — used for fast heuristics.
 */
export function predictedImmediateFlips(
  board: (BoardCell | null)[],
  cell: number,
  placed: CardData,
  my: PlayerIndex,
): number {
  const r = Math.floor(cell / 3);
  const c = cell % 3;

  const myHand = Number(placed.jankenHand);
  const edge = (dir: "up" | "right" | "down" | "left") => Number(placed.edges[dir]);

  const trySide = (
    nr: number,
    nc: number,
    myDir: "up" | "right" | "down" | "left",
    theirDir: "up" | "right" | "down" | "left",
  ): number => {
    if (nr < 0 || nr > 2 || nc < 0 || nc > 2) return 0;
    const idx = nr * 3 + nc;
    const other = board[idx];
    if (!other) return 0;
    if (other.owner === my) return 0;

    const myEdge = edge(myDir);
    const theirEdge = Number(other.card.edges[theirDir]);

    if (myEdge > theirEdge) return 1;
    if (myEdge < theirEdge) return 0;

    const theirHand = Number(other.card.jankenHand);
    return jankenWins(myHand, theirHand) ? 1 : 0;
  };

  let flips = 0;
  flips += trySide(r - 1, c, "up", "down");
  flips += trySide(r + 1, c, "down", "up");
  flips += trySide(r, c - 1, "left", "right");
  flips += trySide(r, c + 1, "right", "left");
  return flips;
}

// ────────────────────────────────────────────────────────────
// Board evaluation for minimax
// ────────────────────────────────────────────────────────────

type EdgeDir = "up" | "right" | "down" | "left";

/**
 * Board evaluation function: positive = good for `my`, negative = bad.
 *
 * Single-pass evaluation with 5 heuristics:
 * 1. Tile difference (primary signal) — ×10
 * 2. Edge sum bonus (both sides, reduced weight) — ×0.05
 * 3. Center control (cell 4 has 4 adjacencies) — ±3
 * 4. Corner control — ±2
 * 5. Vulnerability / edge exposure — penalty for weak edges facing strong opponents
 */
function evaluateBoard(board: (BoardCell | null)[], my: PlayerIndex): number {
  const opp = (1 - my) as PlayerIndex;
  let myTiles = 0;
  let oppTiles = 0;
  let score = 0;

  const dirs: [number, number, EdgeDir, EdgeDir][] = [
    [-1, 0, "up", "down"],
    [1, 0, "down", "up"],
    [0, -1, "left", "right"],
    [0, 1, "right", "left"],
  ];

  for (let i = 0; i < 9; i++) {
    const cell = board[i];
    if (!cell) continue;
    const isMine = cell.owner === my;
    if (isMine) myTiles++;
    else oppTiles++;

    // Edge sum bonus (both sides, reduced weight)
    const es = edgeSum(cell.card);
    score += isMine ? es * 0.05 : -es * 0.05;

    // Center control bonus (cell 4 has 4 adjacencies)
    if (i === 4) score += isMine ? 3 : -3;

    // Vulnerability analysis: check each neighbor
    const r = Math.floor(i / 3);
    const c = i % 3;
    for (const [dr, dc, myDir, theirDir] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr > 2 || nc < 0 || nc > 2) continue;
      const neighbor = board[nr * 3 + nc];
      const myEdge = Number(cell.card.edges[myDir]);
      if (!neighbor) {
        // Exposed high edge facing empty → wasted offense
        if (myEdge >= 7) score += isMine ? -0.3 : 0.3;
      } else if (neighbor.owner !== cell.owner) {
        // Adjacent to enemy: vulnerable if their edge > mine
        const theirEdge = Number(neighbor.card.edges[theirDir]);
        if (theirEdge > myEdge) score += isMine ? -1.5 : 1.5;
      }
    }
  }

  // Tile difference (primary signal)
  score += (myTiles - oppTiles) * 10;

  // Corner control
  for (const ci of [0, 2, 6, 8]) {
    if (board[ci]?.owner === my) score += 2;
    else if (board[ci]?.owner === opp) score -= 2;
  }

  return score;
}

/**
 * Apply a move to a board copy. Returns the new board with flips applied.
 * This is a simplified simulation (orthogonal flips only, no chains/synergy).
 */
function applyMoveSimple(
  board: (BoardCell | null)[],
  cell: number,
  card: CardData,
  player: PlayerIndex,
): (BoardCell | null)[] {
  const newBoard = [...board];
  newBoard[cell] = { owner: player, card } as BoardCell;

  const r = Math.floor(cell / 3);
  const c = cell % 3;

  const tryFlip = (nr: number, nc: number, myDir: "up" | "right" | "down" | "left", theirDir: "up" | "right" | "down" | "left") => {
    if (nr < 0 || nr > 2 || nc < 0 || nc > 2) return;
    const idx = nr * 3 + nc;
    const other = newBoard[idx];
    if (!other || other.owner === player) return;

    const myEdge = Number(card.edges[myDir]);
    const theirEdge = Number(other.card.edges[theirDir]);

    let flips = false;
    if (myEdge > theirEdge) flips = true;
    else if (myEdge === theirEdge) flips = jankenWins(Number(card.jankenHand), Number(other.card.jankenHand));

    if (flips) {
      newBoard[idx] = { ...other, owner: player } as BoardCell;
    }
  };

  tryFlip(r - 1, c, "up", "down");
  tryFlip(r + 1, c, "down", "up");
  tryFlip(r, c - 1, "left", "right");
  tryFlip(r, c + 1, "right", "left");

  // Simple chain: check if flipped cells can flip further
  // (one pass of chain propagation for reasonable accuracy)
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < 9; i++) {
      const bc = newBoard[i];
      if (!bc || bc.owner !== player) continue;

      const ir = Math.floor(i / 3);
      const ic = i % 3;

      const chainFlip = (nr: number, nc: number, myDir: "up" | "right" | "down" | "left", theirDir: "up" | "right" | "down" | "left") => {
        if (nr < 0 || nr > 2 || nc < 0 || nc > 2) return;
        const idx = nr * 3 + nc;
        const other = newBoard[idx];
        if (!other || other.owner === player) return;

        const myEdge = Number(bc.card.edges[myDir]);
        const theirEdge = Number(other.card.edges[theirDir]);

        if (myEdge > theirEdge || (myEdge === theirEdge && jankenWins(Number(bc.card.jankenHand), Number(other.card.jankenHand)))) {
          newBoard[idx] = { ...other, owner: player } as BoardCell;
        }
      };

      chainFlip(ir - 1, ic, "up", "down");
      chainFlip(ir + 1, ic, "down", "up");
      chainFlip(ir, ic - 1, "left", "right");
      chainFlip(ir, ic + 1, "right", "left");
    }
  }

  return newBoard;
}

// ────────────────────────────────────────────────────────────
// Minimax search
// ────────────────────────────────────────────────────────────

type MoveCandidate = { cell: number; cardIndex: number; immediateFlips: number };

function generateMoves(
  board: (BoardCell | null)[],
  deckTokens: bigint[],
  usedCards: Set<number>,
  usedCells: Set<number>,
  cards: Map<bigint, CardData>,
  player: PlayerIndex,
): MoveCandidate[] {
  const moves: MoveCandidate[] = [];
  for (let cell = 0; cell < 9; cell++) {
    if (usedCells.has(cell) || board[cell]) continue;
    for (let idx = 0; idx < 5; idx++) {
      if (usedCards.has(idx)) continue;
      const tid = deckTokens[idx];
      const card = tid !== undefined ? cards.get(tid) : undefined;
      if (!card) continue;
      const immediateFlips = predictedImmediateFlips(board, cell, card, player);
      moves.push({ cell, cardIndex: idx, immediateFlips });
    }
  }
  // Sort by immediateFlips descending for better alpha-beta pruning
  moves.sort((a, b) => b.immediateFlips - a.immediateFlips);
  return moves;
}

function minimax(
  board: (BoardCell | null)[],
  myDeckTokens: bigint[],
  oppDeckTokens: bigint[],
  myUsedCards: Set<number>,
  oppUsedCards: Set<number>,
  usedCells: Set<number>,
  cards: Map<bigint, CardData>,
  my: PlayerIndex,
  isMaximizing: boolean,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (depth <= 0) return evaluateBoard(board, my);

  const currentPlayer = isMaximizing ? my : ((1 - my) as PlayerIndex);
  const deckTokens = isMaximizing ? myDeckTokens : oppDeckTokens;
  const usedCards = isMaximizing ? myUsedCards : oppUsedCards;

  const moves = generateMoves(board, deckTokens, usedCards, usedCells, cards, currentPlayer);
  if (moves.length === 0) return evaluateBoard(board, my);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const card = cards.get(deckTokens[move.cardIndex])!;
      const newBoard = applyMoveSimple(board, move.cell, card, currentPlayer);
      const newUsedCards = new Set(usedCards);
      newUsedCards.add(move.cardIndex);
      const newUsedCells = new Set(usedCells);
      newUsedCells.add(move.cell);

      const val = minimax(
        newBoard, myDeckTokens, oppDeckTokens,
        newUsedCards, oppUsedCards,
        newUsedCells, cards, my,
        false, depth - 1, alpha, beta,
      );

      maxEval = Math.max(maxEval, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const card = cards.get(deckTokens[move.cardIndex])!;
      const newBoard = applyMoveSimple(board, move.cell, card, currentPlayer);
      const newUsedCards = new Set(usedCards);
      newUsedCards.add(move.cardIndex);
      const newUsedCells = new Set(usedCells);
      newUsedCells.add(move.cell);

      const val = minimax(
        newBoard, myDeckTokens, oppDeckTokens,
        myUsedCards, newUsedCards,
        newUsedCells, cards, my,
        true, depth - 1, alpha, beta,
      );

      minEval = Math.min(minEval, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// ────────────────────────────────────────────────────────────
// Warning mark selection
// ────────────────────────────────────────────────────────────

export function pickWarningMarkCell(
  board: (BoardCell | null)[],
  usedCells: Set<number>,
  placedCell: number,
  my: PlayerIndex,
): number | undefined {
  // Find the empty cell most likely to be used by opponent (adjacent to opponent cards)
  let bestCell = -1;
  let bestScore = -1;

  for (let cell = 0; cell < 9; cell++) {
    if (usedCells.has(cell) || cell === placedCell || board[cell]) continue;

    const r = Math.floor(cell / 3);
    const c = cell % 3;
    let adjacentOppCards = 0;

    const check = (nr: number, nc: number) => {
      if (nr < 0 || nr > 2 || nc < 0 || nc > 2) return;
      const idx = nr * 3 + nc;
      const bc = board[idx];
      if (bc && bc.owner !== my) adjacentOppCards++;
    };

    check(r - 1, c);
    check(r + 1, c);
    check(r, c - 1);
    check(r, c + 1);

    // Corners are strategically valuable
    const isCorner = (cell === 0 || cell === 2 || cell === 6 || cell === 8) ? 1 : 0;
    const score = adjacentOppCards * 2 + isCorner;

    if (score > bestScore) {
      bestScore = score;
      bestCell = cell;
    }
  }

  return bestCell >= 0 ? bestCell : undefined;
}

// ────────────────────────────────────────────────────────────
// Main AI entry point
// ────────────────────────────────────────────────────────────

export function pickAiMove(args: AiMoveArgs): AiMoveResult {
  const { difficulty, usedCardIndexes, usedCells } = args;

  const availableCells: number[] = [];
  for (let c = 0; c < 9; c++) if (!usedCells.has(c)) availableCells.push(c);

  const availableIdx: number[] = [];
  for (let i = 0; i < 5; i++) if (!usedCardIndexes.has(i)) availableIdx.push(i);

  if (availableCells.length === 0 || availableIdx.length === 0) {
    return { cell: 0, cardIndex: 0, reason: "fallback", reasonCode: "FALLBACK" };
  }

  // EASY: first available
  if (difficulty === "easy") {
    return {
      cell: availableCells[0],
      cardIndex: availableIdx[0],
      reason: "Easy mode: pick first available cell & card",
      reasonCode: "FIRST_AVAILABLE",
    };
  }

  // NORMAL: maximize immediate flips
  if (difficulty === "normal") {
    return pickNormalMove(args);
  }

  // HARD: minimax depth-2
  if (difficulty === "hard") {
    return pickMinimaxMove(args, 2);
  }

  // EXPERT: minimax depth-3
  return pickMinimaxMove(args, 3);
}

function pickNormalMove(args: AiMoveArgs): AiMoveResult {
  const { boardNow, deckTokens, usedCardIndexes, usedCells, cards, my, warningMarksRemaining } = args;

  let best: { cell: number; cardIndex: number; flips: number; sum: number } | null = null;

  for (let cell = 0; cell < 9; cell++) {
    if (usedCells.has(cell)) continue;
    for (let idx = 0; idx < 5; idx++) {
      if (usedCardIndexes.has(idx)) continue;
      const tid = deckTokens[idx];
      const card = tid !== undefined ? cards.get(tid) : undefined;
      if (!card) continue;

      const flips = predictedImmediateFlips(boardNow, cell, card, my);
      const sum = edgeSum(card);

      if (!best) {
        best = { cell, cardIndex: idx, flips, sum };
        continue;
      }

      if (flips > best.flips) best = { cell, cardIndex: idx, flips, sum };
      else if (flips === best.flips && sum > best.sum) best = { cell, cardIndex: idx, flips, sum };
      else if (flips === best.flips && sum === best.sum && cell < best.cell) best = { cell, cardIndex: idx, flips, sum };
    }
  }

  if (!best) {
    return { cell: 0, cardIndex: 0, reason: "fallback", reasonCode: "FALLBACK" };
  }

  const warningMarkCell = warningMarksRemaining > 0
    ? pickWarningMarkCell(boardNow, usedCells, best.cell, my)
    : undefined;

  return {
    cell: best.cell,
    cardIndex: best.cardIndex,
    warningMarkCell,
    reason: `Normal: maximize flips=${best.flips} (edgeSum=${best.sum})`,
    reasonCode: warningMarkCell !== undefined ? "SET_WARNING" : "MAXIMIZE_FLIPS",
  };
}

function pickMinimaxMove(args: AiMoveArgs, depth: number): AiMoveResult {
  const { boardNow, deckTokens, usedCardIndexes, usedCells, cards, my, warningMarksRemaining } = args;
  const opp = (1 - my) as PlayerIndex;

  // Determine opponent deck tokens
  const oppDeckTokens: bigint[] = [];
  for (const [tid] of cards) {
    if (!deckTokens.includes(tid)) oppDeckTokens.push(tid);
  }

  const oppUsedCards = new Set<number>();
  // Infer opponent's used cards from board state
  for (const bc of boardNow) {
    if (bc && bc.owner === opp) {
      const idx = oppDeckTokens.findIndex((t) => cards.get(t) === bc.card);
      if (idx >= 0) oppUsedCards.add(idx);
    }
  }

  const moves = generateMoves(boardNow, deckTokens, usedCardIndexes, usedCells, cards, my);

  let bestMove: MoveCandidate | null = null;
  let bestScore = -Infinity;

  const startTime = performance.now();
  const timeBudgetMs = depth >= 3 ? 200 : 100;

  for (const move of moves) {
    if (performance.now() - startTime > timeBudgetMs && bestMove) break;

    const card = cards.get(deckTokens[move.cardIndex])!;
    const newBoard = applyMoveSimple(boardNow, move.cell, card, my);
    const newUsedCards = new Set(usedCardIndexes);
    newUsedCards.add(move.cardIndex);
    const newUsedCells = new Set(usedCells);
    newUsedCells.add(move.cell);

    const score = minimax(
      newBoard, deckTokens, oppDeckTokens,
      newUsedCards, oppUsedCards,
      newUsedCells, cards, my,
      false, depth - 1, -Infinity, Infinity,
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  if (!bestMove) {
    return { cell: 0, cardIndex: 0, reason: "fallback", reasonCode: "FALLBACK" };
  }

  const warningMarkCell = warningMarksRemaining > 0
    ? pickWarningMarkCell(boardNow, usedCells, bestMove.cell, my)
    : undefined;

  const reasonCode: AiReasonCode = depth >= 3 ? "MINIMAX_D3" : "MINIMAX_D2";

  return {
    cell: bestMove.cell,
    cardIndex: bestMove.cardIndex,
    warningMarkCell,
    reason: `${depth >= 3 ? "Expert" : "Hard"}: minimax d${depth}, score=${bestScore.toFixed(1)}, flips=${bestMove.immediateFlips}`,
    reasonCode,
  };
}

/** Human-readable label for a reason code. */
export function reasonCodeLabel(code: AiReasonCode): string {
  switch (code) {
    case "FIRST_AVAILABLE": return "First Available";
    case "MAXIMIZE_FLIPS": return "Max Flips";
    case "BLOCK_CORNER": return "Block Corner";
    case "SET_WARNING": return "Set Warning";
    case "MINIMAX_D2": return "Minimax (d2)";
    case "MINIMAX_D3": return "Minimax (d3)";
    case "FALLBACK": return "Fallback";
  }
}

/** @internal Exported for unit testing only. */
export { evaluateBoard as _evaluateBoard };
