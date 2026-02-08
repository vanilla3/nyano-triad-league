import type { OverlayStateV1 } from "@/lib/streamer_bus";
import { formatViewerMoveText } from "@/lib/triad_viewer_command";

/**
 * triad_vote_utils.ts
 *
 * Shared helpers for:
 * - Cell coordinate conversion (0..8 <-> A1..C3)
 * - Viewer command format (#triad A2->B2 wm=C1)
 * - strictAllowed (allowlist count + hash) computation
 *
 * Motivation:
 * - Keep /stream, StreamOperationsHUD, /overlay consistent.
 * - Avoid subtle mismatches in allowlist hashing.
 */

export type PlayerSide = 0 | 1;

// ---------------------------------------------------------------------------
// Hash (FNV-1a 32-bit)
// ---------------------------------------------------------------------------

export function fnv1a32Hex(input: string): string {
  // Non-cryptographic stable hash for allowlists (for strictAllowed dedupe).
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // 32-bit multiply: h *= 16777619
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return "0x" + h.toString(16).padStart(8, "0");
}

// ---------------------------------------------------------------------------
// Cell coordinate conversion
// ---------------------------------------------------------------------------

// Board coordinates (viewer-friendly):
//   A1 B1 C1
//   A2 B2 C2
//   A3 B3 C3

export function cellCoordToIndex(coord: string): number | null {
  const t = coord.trim().toUpperCase();
  const m = t.match(/^([ABC])([123])$/);
  if (!m) return null;
  const col = m[1] === "A" ? 0 : m[1] === "B" ? 1 : 2;
  const row = Number(m[2]) - 1; // 0..2
  return row * 3 + col; // 0..8
}

export function cellIndexToCoord(cell: number): string {
  const c = Math.max(0, Math.min(8, Math.floor(cell)));
  const row = Math.floor(c / 3); // 0..2
  const col = c % 3; // 0..2
  const colCh = col === 0 ? "A" : col === 1 ? "B" : "C";
  return `${colCh}${row + 1}`;
}

export function parseCellAny(raw: string): number | null {
  const t = raw.trim();
  if (/^\d$/.test(t)) {
    const n = Number(t);
    if (n >= 0 && n <= 8) return n;
    return null;
  }
  return cellCoordToIndex(t);
}

// ---------------------------------------------------------------------------
// Viewer command format
// ---------------------------------------------------------------------------

export type ViewerMove = {
  cell: number;
  cardIndex: number;
  warningMarkCell?: number | null;
};

export function toViewerMoveText(m: ViewerMove): string {
  return formatViewerMoveText({
    side: 0,
    slot: m.cardIndex + 1,
    cell: m.cell,
    warningMarkCell: typeof m.warningMarkCell === "number" ? m.warningMarkCell : null,
  });
}

// ---------------------------------------------------------------------------
// Overlay-derived game state helpers
// ---------------------------------------------------------------------------

export function computeToPlay(state: OverlayStateV1 | null): PlayerSide | null {
  if (!state) return null;
  if (state?.status?.finished) return null;
  if (typeof state.turn !== "number") return null;
  if (typeof state.firstPlayer !== "number") return null;
  if (state.turn >= 9) return null;
  return ((state.firstPlayer + (state.turn % 2)) % 2) as PlayerSide;
}

export function computeEmptyCells(state: OverlayStateV1 | null): number[] {
  if (!state) return [];

  // Prefer explicit usedCells (Match publishes this).
  if (Array.isArray(state.usedCells)) {
    const used = new Set(state.usedCells.map((x) => Number(x)).filter((n) => Number.isFinite(n)));
    return Array.from({ length: 9 }, (_, i) => i).filter((i) => !used.has(i));
  }

  // Fallback: derive from board occupancy.
  if (Array.isArray(state.board)) {
    const b = state.board;
    return Array.from({ length: 9 }, (_, i) => i).filter((i) => b[i] == null);
  }

  return Array.from({ length: 9 }, (_, i) => i);
}

function computeUsedCardIndicesFromProtocolV1(state: OverlayStateV1 | null, side: PlayerSide): number[] {
  const p = state?.protocolV1;
  if (!p?.header || !Array.isArray(p.turns)) return [];
  const firstPlayer = typeof p.header.firstPlayer === "number" ? (p.header.firstPlayer as PlayerSide) : null;
  if (firstPlayer === null) return [];

  const used: number[] = [];
  for (let i = 0; i < p.turns.length; i++) {
    const by = ((firstPlayer + (i % 2)) % 2) as PlayerSide;
    if (by !== side) continue;
    const ci = Number(p.turns[i]?.cardIndex);
    if (Number.isFinite(ci)) used.push(ci);
  }
  return used;
}

export function computeUsedCardIndices(state: OverlayStateV1 | null, side: PlayerSide): number[] {
  if (!state) return [];
  const arr = side === 0 ? state.usedCardIndicesA : state.usedCardIndicesB;
  if (Array.isArray(arr)) return arr.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  return computeUsedCardIndicesFromProtocolV1(state, side);
}

export function computeRemainingCardIndices(state: OverlayStateV1 | null, side: PlayerSide): number[] {
  const used = new Set(computeUsedCardIndices(state, side));
  return [0, 1, 2, 3, 4].filter((i) => !used.has(i));
}

export function computeWarningMarksUsed(state: OverlayStateV1 | null, side: PlayerSide): number {
  if (!state) return 0;

  const v = side === 0 ? state.warningMarksUsedA : state.warningMarksUsedB;
  if (typeof v === "number" && Number.isFinite(v)) return v;

  // Fallback: derive from protocolV1
  const p = state?.protocolV1;
  if (!p?.header || !Array.isArray(p.turns)) return 0;
  const firstPlayer = typeof p.header.firstPlayer === "number" ? (p.header.firstPlayer as PlayerSide) : null;
  if (firstPlayer === null) return 0;

  let used = 0;
  for (let i = 0; i < p.turns.length; i++) {
    const by = ((firstPlayer + (i % 2)) % 2) as PlayerSide;
    if (by !== side) continue;
    if (typeof p.turns[i]?.warningMarkCell === "number") used += 1;
  }
  return used;
}

export function computeWarningMarksRemaining(state: OverlayStateV1 | null, side: PlayerSide, maxUses = 3): number {
  const used = computeWarningMarksUsed(state, side);
  return Math.max(0, maxUses - used);
}

export type StrictAllowedComputed = {
  toPlay: PlayerSide;
  turn: number;

  allowlist: string[];
  count: number;
  hash: string;

  warningMark: {
    used: number;
    remaining: number;
    candidates: string[];
  };
};

export function computeStrictAllowed(state: OverlayStateV1 | null): StrictAllowedComputed | null {
  if (!state) return null;
  if (typeof state.turn !== "number") return null;

  const toPlay = computeToPlay(state);
  if (toPlay === null) return null;

  const emptyCells = computeEmptyCells(state);
  const remainCards = computeRemainingCardIndices(state, toPlay);

  const allowlist: string[] = [];
  for (const cell of emptyCells) {
    for (const cardIndex of remainCards) {
      allowlist.push(toViewerMoveText({ cell, cardIndex }));
    }
  }

  allowlist.sort();

  const hash = fnv1a32Hex(allowlist.join("\n"));

  const wUsed = computeWarningMarksUsed(state, toPlay);
  const wRemain = computeWarningMarksRemaining(state, toPlay);
  const wmCandidates = wRemain > 0 ? emptyCells.map(cellIndexToCoord) : [];

  return {
    toPlay,
    turn: state.turn,
    allowlist,
    count: allowlist.length,
    hash,
    warningMark: {
      used: wUsed,
      remaining: wRemain,
      candidates: wmCandidates,
    },
  };
}
