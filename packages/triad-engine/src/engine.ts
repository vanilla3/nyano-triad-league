import { AbiCoder, keccak256 } from "ethers";
import type { BoardCell, BoardState, CardData, Direction, Edges, MatchResult, PlayerIndex, TranscriptV1, Turn } from "./types.js";

/**
 * Core engine (Layer 1): triad compare + janken tie-break + chain flips.
 * - Deterministic given transcript + card data.
 * - No RNG.
 * - No blockchain calls inside: callers provide card data.
 */

const BOARD_SIZE = 3;
const NONE_U8 = 255;
const EDGE_MIN = 0;
const EDGE_MAX = 10;

interface WarningMark {
  cell: number; // 0..8
  owner: PlayerIndex;
  expiresAtTurn: number; // turn index at which the mark is removed (start of owner's turn)
}

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

    // Optional actions are encoded as uint8 with 255 as "none".
    if (turn.warningMarkCell !== undefined) {
      if (!Number.isInteger(turn.warningMarkCell)) throw new Error("invalid warningMarkCell");
      if (!((turn.warningMarkCell >= 0 && turn.warningMarkCell <= 8) || turn.warningMarkCell === NONE_U8)) {
        throw new Error("invalid warningMarkCell range");
      }
    }
    if (turn.earthBoostEdge !== undefined) {
      if (!Number.isInteger(turn.earthBoostEdge)) throw new Error("invalid earthBoostEdge");
      if (!((turn.earthBoostEdge >= 0 && turn.earthBoostEdge <= 3) || turn.earthBoostEdge === NONE_U8)) {
        throw new Error("invalid earthBoostEdge range");
      }
    }
    if (turn.reserved !== undefined) {
      if (!Number.isInteger(turn.reserved) || turn.reserved < 0 || turn.reserved > NONE_U8) throw new Error("invalid reserved");
    }
    if (cellSet.has(turn.cell)) throw new Error("duplicate cell in turns");
    cellSet.add(turn.cell);
  }
}

function hashTranscriptCanonical(t: TranscriptV1): `0x${string}` {
  // Solidity-compatible keccak256 over a fixed ABI encoding.
  // This avoids JSON canonicalization pitfalls and keeps official settlement verifiable.
  const coder = AbiCoder.defaultAbiCoder();

  const normU8 = (v: number | undefined): number => (v === undefined ? NONE_U8 : v);
  const cells = t.turns.map((x) => x.cell);
  const cardIndexes = t.turns.map((x) => x.cardIndex);
  const warningCells = t.turns.map((x) => normU8(x.warningMarkCell));
  const earthEdges = t.turns.map((x) => normU8(x.earthBoostEdge));
  const reserved = t.turns.map((x) => normU8(x.reserved));

  const encoded = coder.encode(
    [
      "uint16",
      "bytes32",
      "uint32",
      "address",
      "address",
      "uint256[5]",
      "uint256[5]",
      "uint8",
      "uint64",
      "bytes32",
      "uint8[9]",
      "uint8[9]",
      "uint8[9]",
      "uint8[9]",
      "uint8[9]",
    ],
    [
      t.header.version,
      t.header.rulesetId,
      t.header.seasonId,
      t.header.playerA,
      t.header.playerB,
      t.header.deckA,
      t.header.deckB,
      t.header.firstPlayer,
      t.header.deadline,
      t.header.salt,
      cells,
      cardIndexes,
      warningCells,
      earthEdges,
      reserved,
    ]
  );

  return keccak256(encoded) as `0x${string}`;
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

  // Layer 2 (TACTICS): Warning marks (警戒マーク)
  // - After placing a card, a player may mark an empty cell.
  // - If the opponent places a card onto that marked cell, the placed card's edges are reduced by 1.
  // - A mark disappears at the start of the marker owner's next turn (i+2), and is limited to 3 uses per match.
  const warningMarks: WarningMark[] = [];
  const warningUsed: [number, number] = [0, 0];
  const WARNING_MAX_PER_PLAYER = 3;

  const usedA = new Set<number>();
  const usedB = new Set<number>();

  const clampEdge = (v: number): number => Math.max(EDGE_MIN, Math.min(EDGE_MAX, v));
  const applyEdgeDelta = (card: CardData, delta: number): CardData => {
    const edges: Edges = {
      up: clampEdge(card.edges.up + delta),
      right: clampEdge(card.edges.right + delta),
      down: clampEdge(card.edges.down + delta),
      left: clampEdge(card.edges.left + delta),
    };
    return { ...card, edges };
  };

  const takeWarningMarkAtCell = (cell: number, currentPlayer: PlayerIndex): WarningMark | null => {
    const idx = warningMarks.findIndex((m) => m.cell === cell && m.owner !== currentPlayer);
    if (idx === -1) return null;
    const [m] = warningMarks.splice(idx, 1);
    return m;
  };

  for (let i = 0; i < 9; i++) {
    const turn = t.turns[i];
    const p = getTurnPlayer(t.header.firstPlayer, i);

    // Expire marks owned by the current player at the start of their turn.
    for (let k = warningMarks.length - 1; k >= 0; k--) {
      const m = warningMarks[k];
      if (m.owner === p && m.expiresAtTurn === i) warningMarks.splice(k, 1);
    }

    const cardIndex = turn.cardIndex;
    const used = p === 0 ? usedA : usedB;
    if (used.has(cardIndex)) throw new Error(`cardIndex reused by player ${p}: ${cardIndex}`);
    used.add(cardIndex);

    const tokenId = p === 0 ? t.header.deckA[cardIndex] : t.header.deckB[cardIndex];
    const card = cardsByTokenId.get(tokenId);
    if (!card) throw new Error(`missing CardData for tokenId=${tokenId}`);

    if (board[turn.cell]) throw new Error("cell already occupied (should be prevented by validation)");

    // Warning mark trigger: placing on an opponent-marked cell debuffs this placed card.
    const triggered = takeWarningMarkAtCell(turn.cell, p);
    const placedCard = triggered ? applyEdgeDelta(card, -1) : card;
    board[turn.cell] = { owner: p, card: placedCard };

    // chain flips (core rule)
    applyChainFlips(board, turn.cell);

    // Optional action: place a warning mark after placement.
    const wm = turn.warningMarkCell;
    if (wm !== undefined && wm !== NONE_U8) {
      if (warningUsed[p] >= WARNING_MAX_PER_PLAYER) throw new Error(`warning mark limit exceeded by player ${p}`);
      if (!Number.isInteger(wm) || wm < 0 || wm > 8) throw new Error("invalid warning mark cell");
      if (board[wm]) throw new Error("warning mark must be placed on an empty cell");
      if (wm === turn.cell) throw new Error("warning mark cell must differ from placed cell");
      // Don't allow multiple marks on the same cell.
      if (warningMarks.some((m) => m.cell === wm)) throw new Error("warning mark already exists on cell");

      warningUsed[p] += 1;
      warningMarks.push({ cell: wm, owner: p, expiresAtTurn: i + 2 });
    }
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
