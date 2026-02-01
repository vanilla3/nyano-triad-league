import crypto from "node:crypto";
import type { BoardCell, BoardState, CardData, Direction, Edges, MatchResult, PlayerIndex, TranscriptV1, Turn } from "./types.js";

/**
 * Core engine (Layer 1): triad compare + janken tie-break + chain flips.
 * - Deterministic given transcript + card data.
 * - No RNG.
 * - No blockchain calls inside: callers provide card data.
 */

const BOARD_SIZE = 3;

const DIRS: Array<{ dir: Direction; dx: number; dy: number; opp: Direction }> = [
  { dir: "up", dx: 0, dy: -1, opp: "down" },
  { dir: "right", dx: 1, dy: 0, opp: "left" },
  { dir: "down", dx: 0, dy: 1, opp: "up" },
  { dir: "left", dx: -1, dy: 0, opp: "right" },
];

function idxToXY(idx: number): { x: number; y: number } {
  return { x: idx % BOARD_SIZE, y: Math.floor(idx / BOARD_SIZE) };
}
function xyToIdx(x: number, y: number): number {
  return y * BOARD_SIZE + x;
}
function neighborIndex(idx: number, dir: Direction): number | null {
  const { x, y } = idxToXY(idx);
  const d = DIRS.find((d) => d.dir === dir)!;
  const nx = x + d.dx;
  const ny = y + d.dy;
  if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return null;
  return xyToIdx(nx, ny);
}

export function jankenOutcome(attacker: 0 | 1 | 2, defender: 0 | 1 | 2): 1 | 0 | -1 {
  // 0 Rock beats 2 Scissors; 1 Paper beats 0 Rock; 2 Scissors beats 1 Paper
  if (attacker === defender) return 0;
  if (attacker === 0 && defender === 2) return 1;
  if (attacker === 1 && defender === 0) return 1;
  if (attacker === 2 && defender === 1) return 1;
  return -1;
}

function validateTranscriptBasic(t: TranscriptV1): void {
  const { header, turns } = t;

  if (header.version !== 1) throw new Error(`unsupported transcript version: ${header.version}`);
  if (header.deckA.length !== 5 || header.deckB.length !== 5) throw new Error("deck must be length 5");
  if (turns.length !== 9) throw new Error("turns must be length 9");

  const cellSet = new Set<number>();
  for (const turn of turns) {
    if (!Number.isInteger(turn.cell) || turn.cell < 0 || turn.cell > 8) throw new Error("invalid cell");
    if (!Number.isInteger(turn.cardIndex) || turn.cardIndex < 0 || turn.cardIndex > 4) throw new Error("invalid cardIndex");
    if (cellSet.has(turn.cell)) throw new Error("duplicate cell in turns");
    cellSet.add(turn.cell);
  }
}

function hashTranscriptCanonical(t: TranscriptV1): `0x${string}` {
  // NOTE: This is a *placeholder* canonicalization for dev.
  // For production:
  // - Use exact field ordering and fixed-width encodings (or EIP-712 hash).
  // - Keep in sync with Solidity.
  const json = JSON.stringify(t, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  const h = crypto.createHash("sha256").update(json).digest("hex");
  return (`0x${h}` as const);
}

function getTurnPlayer(firstPlayer: PlayerIndex, turnIndex: number): PlayerIndex {
  return ((firstPlayer + (turnIndex % 2)) % 2) as PlayerIndex;
}

function compareAndMaybeFlip(board: BoardState, attackerIdx: number, defenderIdx: number): boolean {
  const attacker = board[attackerIdx];
  const defender = board[defenderIdx];
  if (!attacker || !defender) return false;
  if (attacker.owner === defender.owner) return false;

  // Determine direction from attacker to defender
  const axy = idxToXY(attackerIdx);
  const dxy = idxToXY(defenderIdx);
  const dx = dxy.x - axy.x;
  const dy = dxy.y - axy.y;

  let dir: Direction | null = null;
  if (dx === 0 && dy === -1) dir = "up";
  else if (dx === 1 && dy === 0) dir = "right";
  else if (dx === 0 && dy === 1) dir = "down";
  else if (dx === -1 && dy === 0) dir = "left";
  else return false;

  const opp = DIRS.find((d) => d.dir === dir)!.opp;

  const aEdge = attacker.card.edges[dir];
  const dEdge = defender.card.edges[opp];

  if (aEdge > dEdge) {
    board[defenderIdx] = { owner: attacker.owner, card: defender.card };
    return true;
  }
  if (aEdge < dEdge) return false;

  const j = jankenOutcome(attacker.card.jankenHand, defender.card.jankenHand);
  if (j === 1) {
    board[defenderIdx] = { owner: attacker.owner, card: defender.card };
    return true;
  }
  return false;
}

function applyChainFlips(board: BoardState, startIdx: number): void {
  const queue: number[] = [startIdx];
  const inQueue = new Set<number>([startIdx]);

  while (queue.length) {
    const attackerIdx = queue.shift()!;
    inQueue.delete(attackerIdx);

    for (const { dir } of DIRS) {
      const n = neighborIndex(attackerIdx, dir);
      if (n === null) continue;
      const flipped = compareAndMaybeFlip(board, attackerIdx, n);
      if (flipped && !inQueue.has(n)) {
        queue.push(n);
        inQueue.add(n);
      }
    }
  }
}

export function simulateMatchV1(t: TranscriptV1, cardsByTokenId: Map<bigint, CardData>): MatchResult {
  validateTranscriptBasic(t);

  const board: BoardState = Array.from({ length: 9 }, () => null);

  const usedA = new Set<number>();
  const usedB = new Set<number>();

  for (let i = 0; i < 9; i++) {
    const turn = t.turns[i];
    const p = getTurnPlayer(t.header.firstPlayer, i);

    const cardIndex = turn.cardIndex;
    const used = p === 0 ? usedA : usedB;
    if (used.has(cardIndex)) throw new Error(`cardIndex reused by player ${p}: ${cardIndex}`);
    used.add(cardIndex);

    const tokenId = p === 0 ? t.header.deckA[cardIndex] : t.header.deckB[cardIndex];
    const card = cardsByTokenId.get(tokenId);
    if (!card) throw new Error(`missing CardData for tokenId=${tokenId}`);

    if (board[turn.cell]) throw new Error("cell already occupied (should be prevented by validation)");
    board[turn.cell] = { owner: p, card };

    // chain flips (core rule)
    applyChainFlips(board, turn.cell);
  }

  // Count tiles
  let tilesA = 0;
  let tilesB = 0;
  for (const cell of board) {
    if (!cell) continue;
    if (cell.owner === 0) tilesA++;
    else tilesB++;
  }

  let winner: PlayerIndex | "draw" = tilesA > tilesB ? 0 : tilesB > tilesA ? 1 : "draw";
  let tieBreak: MatchResult["tieBreak"] = "none";

  if (winner === "draw") {
    // combatStatSum tie-break (sum controlled tiles)
    const sum = [0, 0] as [number, number];
    for (const cell of board) {
      if (!cell) continue;
      sum[cell.owner] += cell.card.combatStatSum;
    }
    if (sum[0] > sum[1]) {
      winner = 0;
      tieBreak = "combatStatSum";
    } else if (sum[1] > sum[0]) {
      winner = 1;
      tieBreak = "combatStatSum";
    } else {
      winner = t.header.firstPlayer;
      tieBreak = "firstPlayer";
    }
  }

  const matchId = hashTranscriptCanonical(t);

  return {
    winner,
    tiles: { A: tilesA, B: tilesB },
    tieBreak,
    board,
    matchId,
  };
}
