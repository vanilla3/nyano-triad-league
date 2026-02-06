import type { Turn } from "./types.js";

/**
 * Hex helpers for protocol-friendly transcript serialization.
 * - Used by test-vectors and UI tooling.
 */

export function hexToBytes(hex: string): Uint8Array {
  let h = hex;
  if (h.startsWith("0x")) h = h.slice(2);
  if (h.length % 2 !== 0) throw new Error("hex must have even length");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = h.slice(i * 2, i * 2 + 2);
    out[i] = Number.parseInt(byte, 16);
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array, opts?: { prefix?: boolean }): string {
  const prefix = opts?.prefix ?? true;
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return prefix ? `0x${s}` : s;
}

/**
 * Decode 9-turn transcript segments.
 *
 * - moves: each byte encodes (cell<<4 | cardIndex)
 * - warningMarks: 0..8 or 255
 * - earthBoostEdges: 0..3 or 255 (on-chain subset requires all 255)
 */
export function decodeTurnsFromHex(input: {
  movesHex: string;
  warningMarksHex: string;
  earthBoostEdgesHex: string;
}): Turn[] {
  const moves = hexToBytes(input.movesHex);
  const marks = hexToBytes(input.warningMarksHex);
  const earth = hexToBytes(input.earthBoostEdgesHex);

  if (moves.length !== 9) throw new Error("moves must be 9 bytes");
  if (marks.length !== 9) throw new Error("warningMarks must be 9 bytes");
  if (earth.length !== 9) throw new Error("earthBoostEdges must be 9 bytes");

  const turns: Turn[] = [];
  for (let i = 0; i < 9; i++) {
    const m = moves[i];
    const cell = (m >> 4) & 0x0f;
    const cardIndex = m & 0x0f;

    turns.push({
      cell,
      cardIndex,
      warningMarkCell: marks[i],
      earthBoostEdge: earth[i],
    });
  }
  return turns;
}

/**
 * Encode 9 turns into the three canonical hex segments used by the protocol.
 *
 * NOTE:
 * - If warningMarkCell / earthBoostEdge are undefined, we encode as 255.
 */
export function encodeTurnsToHex(turns: Turn[], opts?: { prefix?: boolean }): {
  movesHex: string;
  warningMarksHex: string;
  earthBoostEdgesHex: string;
} {
  if (turns.length !== 9) throw new Error("turns must be length 9");
  const moves = new Uint8Array(9);
  const marks = new Uint8Array(9);
  const earth = new Uint8Array(9);

  for (let i = 0; i < 9; i++) {
    const t = turns[i];
    const cell = t.cell & 0x0f;
    const cardIndex = t.cardIndex & 0x0f;
    moves[i] = (cell << 4) | cardIndex;

    const mark = t.warningMarkCell ?? 255;
    const eb = t.earthBoostEdge ?? 255;

    marks[i] = mark & 0xff;
    earth[i] = eb & 0xff;
  }

  return {
    movesHex: bytesToHex(moves, { prefix: opts?.prefix ?? false }),
    warningMarksHex: bytesToHex(marks, { prefix: opts?.prefix ?? false }),
    earthBoostEdgesHex: bytesToHex(earth, { prefix: opts?.prefix ?? false }),
  };
}
