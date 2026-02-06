import { AbiCoder, keccak256 } from "ethers";
import type { TranscriptV1, Turn } from "./types.js";

/**
 * Transcript utilities
 *
 * Goals:
 * - Deterministic canonical encoding (stable across platforms).
 * - Keccak256 matchId compatible with Solidity `keccak256(abi.encode(...))`.
 *
 * NOTE:
 * - This hashing is for `matchId` / replay integrity.
 * - Signatures should use EIP-712 (separate implementation), but should hash the same logical fields.
 */

const ABI_TYPES_V1 = [
  // header
  "uint16", // version
  "bytes32", // rulesetId
  "uint32", // seasonId
  "address", // playerA
  "address", // playerB
  "uint256[5]", // deckA
  "uint256[5]", // deckB
  "uint8", // firstPlayer
  "uint64", // deadline
  "bytes32", // salt
  // turns (9)
  "uint8[9]", // cell
  "uint8[9]", // cardIndex
  "uint8[9]", // warningMarkCell (255 = none)
  "uint8[9]", // earthBoostEdge (255 = none)
  "uint8[9]", // reserved (0 recommended)
] as const;

const NONE_U8 = 255;

function toU8OrNone(v: number | undefined, noneValue: number = NONE_U8): number {
  if (v === undefined || v === null) return noneValue;
  return v;
}

function normalizeTurnsV1(turns: Turn[]): {
  cells: number[];
  cardIndexes: number[];
  warningMarkCells: number[];
  earthBoostEdges: number[];
  reserved: number[];
} {
  const cells: number[] = [];
  const cardIndexes: number[] = [];
  const warningMarkCells: number[] = [];
  const earthBoostEdges: number[] = [];
  const reserved: number[] = [];

  for (const t of turns) {
    cells.push(t.cell);
    cardIndexes.push(t.cardIndex);
    warningMarkCells.push(toU8OrNone(t.warningMarkCell));
    earthBoostEdges.push(toU8OrNone(t.earthBoostEdge));
    reserved.push(toU8OrNone(t.reserved, 0));
  }

  return { cells, cardIndexes, warningMarkCells, earthBoostEdges, reserved };
}

export function validateTranscriptV1(t: TranscriptV1): void {
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

    const wm = toU8OrNone(turn.warningMarkCell);
    if (!Number.isInteger(wm) || wm < 0 || wm > 255) throw new Error("invalid warningMarkCell");
    if (wm !== 255 && (wm < 0 || wm > 8)) throw new Error("warningMarkCell must be 0..8 or 255");

    const eb = toU8OrNone(turn.earthBoostEdge);
    if (!Number.isInteger(eb) || eb < 0 || eb > 255) throw new Error("invalid earthBoostEdge");
    if (eb !== 255 && (eb < 0 || eb > 3)) throw new Error("earthBoostEdge must be 0..3 or 255");
  }
}

export function encodeTranscriptV1(t: TranscriptV1): `0x${string}` {
  validateTranscriptV1(t);

  const { header, turns } = t;
  const n = normalizeTurnsV1(turns);

  const coder = AbiCoder.defaultAbiCoder();

  const encoded = coder.encode(
    [...ABI_TYPES_V1],
    [
      header.version,
      header.rulesetId,
      header.seasonId,
      header.playerA,
      header.playerB,
      header.deckA,
      header.deckB,
      header.firstPlayer,
      header.deadline,
      header.salt,
      n.cells,
      n.cardIndexes,
      n.warningMarkCells,
      n.earthBoostEdges,
      n.reserved,
    ],
  );

  return encoded as `0x${string}`;
}

export function hashTranscriptV1(t: TranscriptV1): `0x${string}` {
  return keccak256(encodeTranscriptV1(t)) as `0x${string}`;
}
