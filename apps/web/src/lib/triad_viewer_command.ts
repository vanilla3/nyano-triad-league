/**
 * triad_viewer_command.ts
 *
 * Viewer command specification + parser/normalizer for chat voting.
 *
 * Canonical format (case-insensitive):
 *   #triad A<slot>-><cell> wm=<cell>
 *   - wm=<cell> is optional
 *
 * Examples:
 *   #triad A2->B2
 *   #triad A2->B2 wm=C1
 *
 * Notes:
 * - This module is intentionally self-contained (no app imports) so it can be used in /stream,
 *   overlay HUD, and any future bot integration without circular deps.
 */
export type PlayerSide = 0 | 1;

export type ViewerMoveParsed = {
  side: PlayerSide; // 0: A, 1: B
  slot: number; // 1..5 (human)
  cardIndex: number; // 0..4 (0-based)
  cell: number; // 0..8 (0-based)
  warningMarkCell: number | null; // 0..8
  normalizedText: string; // canonical rendering
};

const RE_STRICT =
  /^#triad\s*([ab])\s*([1-5])\s*(?:->|→|⇒)\s*([abc][1-3])(?:\s+wm\s*=\s*([abc][1-3]))?\s*$/i;

const RE_LOOSE =
  /#triad\s*([ab])\s*([1-5])\s*(?:->|→|⇒)\s*([abc][1-3])(?:\s+wm\s*=\s*([abc][1-3]))?/i;

export function cellIndexToCoord(cell: number): string {
  const c = Number(cell);
  if (!Number.isFinite(c)) return "A1";
  const row = Math.max(0, Math.min(2, Math.floor(c / 3)));
  const col = Math.max(0, Math.min(2, c % 3));
  const letter = col === 0 ? "A" : col === 1 ? "B" : "C";
  return `${letter}${row + 1}`;
}

export function cellCoordToIndex(coord: string): number | null {
  const s = (coord ?? "").toString().trim().toUpperCase();
  if (!/^[ABC][1-3]$/.test(s)) return null;
  const col = s[0] === "A" ? 0 : s[0] === "B" ? 1 : 2;
  const row = Number(s[1]) - 1;
  if (!Number.isFinite(row) || row < 0 || row > 2) return null;
  return row * 3 + col;
}

export function formatViewerMoveText(args: {
  side: PlayerSide;
  slot: number;
  cell: number;
  warningMarkCell?: number | null;
}): string {
  const sideChar = args.side === 0 ? "A" : "B";
  const slot = Math.max(1, Math.min(5, Math.floor(Number(args.slot) || 1)));
  const cellCoord = cellIndexToCoord(args.cell);
  const wm =
    typeof args.warningMarkCell === "number" && Number.isFinite(args.warningMarkCell)
      ? ` wm=${cellIndexToCoord(args.warningMarkCell)}`
      : "";
  return `#triad ${sideChar}${slot}->${cellCoord}${wm}`;
}

function buildParsed(
  sideChar: string,
  slotChar: string,
  cellCoord: string,
  wmCoord?: string | null
): ViewerMoveParsed | null {
  const side: PlayerSide = sideChar.toUpperCase() === "B" ? 1 : 0;
  const slot = Number(slotChar);
  if (!Number.isFinite(slot) || slot < 1 || slot > 5) return null;
  const cardIndex = slot - 1;

  const cell = cellCoordToIndex(cellCoord);
  if (cell === null) return null;

  const warningMarkCell =
    wmCoord && wmCoord.trim().length > 0 ? cellCoordToIndex(wmCoord) : null;

  const normalizedText = formatViewerMoveText({
    side,
    slot,
    cell,
    warningMarkCell,
  });

  return { side, slot, cardIndex, cell, warningMarkCell, normalizedText };
}

/**
 * Strict parse: requires the whole message to be the command.
 */
export function parseViewerMoveText(input: string): ViewerMoveParsed | null {
  const s = (input ?? "").toString().trim();
  const m = s.match(RE_STRICT);
  if (!m) return null;
  return buildParsed(m[1], m[2], m[3], m[4] ?? null);
}

/**
 * Loose parse: extracts the first command-like substring from a longer chat message.
 */
export function parseViewerMoveTextLoose(input: string): ViewerMoveParsed | null {
  const s = (input ?? "").toString();
  const m = s.match(RE_LOOSE);
  if (!m) return null;
  return buildParsed(m[1], m[2], m[3], m[4] ?? null);
}

/**
 * Normalizer: returns canonical text if parse succeeds; otherwise null.
 *
 * - strict=false (default) is recommended for chat: "A2->B2 gg" still parses.
 * - strict=true enforces the whole message to be the command.
 */
export function normalizeViewerMoveText(
  input: string,
  opts: { strict?: boolean } = {}
): string | null {
  const strict = Boolean(opts.strict);
  const parsed = strict ? parseViewerMoveText(input) : parseViewerMoveTextLoose(input);
  return parsed?.normalizedText ?? null;
}
