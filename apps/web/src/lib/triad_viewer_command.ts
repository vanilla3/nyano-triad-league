/**
 * triad_viewer_command.ts
 *
 * ── SINGLE SOURCE OF TRUTH ──
 * All viewer vote/command parsing for Nyano Triad League.
 *
 * Consumers:
 *   - Stream.tsx (vote input, chat simulation)
 *   - Overlay.tsx (vote display validation)
 *
 * If you need to parse viewer commands, import from THIS module.
 * Do NOT create parallel parsers elsewhere.
 *
 * Canonical format (case-insensitive):
 *   #triad A<slot>-><cell> wm=<cell>
 *   - wm=<cell> is optional
 *
 * Examples:
 *   #triad A2->B2
 *   #triad A2->B2 wm=C1
 *
 * Exports:
 *   - cellIndexToCoord / cellCoordToIndex — board coordinate mapping
 *   - formatViewerMoveText — canonical "#triad" format builder
 *   - parseViewerMoveText — strict parser
 *   - parseViewerMoveTextLoose — extracts from noisy chat text
 *   - normalizeViewerMoveText — loose → canonical
 *   - parseChatMoveLoose — legacy "!move" + arrow shorthand
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

// ---------------------------------------------------------------------------
// Chat move parsing (unified: canonical + legacy fallback)
// ---------------------------------------------------------------------------

/**
 * Parse a card index from human-friendly input.
 * Accepts: "1".."5" (viewer), "0".."4" (dev), "A1".."A5" (hand slot).
 */
function parseCardIndexHuman(raw: string): number | null {
  const t = raw.trim().replace(/^#/, "");
  const m = t.match(/^A?([0-9]+)$/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  if (n >= 1 && n <= 5) return n - 1;
  if (n >= 0 && n <= 4) return n;
  return null;
}

/**
 * Parse a cell from either a digit "0".."8" or a coordinate "A1".."C3".
 */
function parseCellAny(raw: string): number | null {
  const t = raw.trim();
  if (/^\d$/.test(t)) {
    const n = Number(t);
    if (n >= 0 && n <= 8) return n;
    return null;
  }
  return cellCoordToIndex(t);
}

/**
 * Parse chat input that may use canonical #triad format, legacy "!move" format,
 * or various chat-friendly shorthand. Always returns a ViewerMoveParsed with
 * normalizedText for consistent vote keying.
 *
 * Returns null if input cannot be parsed.
 *
 * Supported formats:
 *   - Canonical: "#triad A2->B2", "#triad A2->B2 wm=C1"
 *   - Legacy numeric: "!move 4 2", "4 2 wm=6"
 *   - Viewer-friendly: "#triad B2 3", "#triad 3->B2", "B2 3 wm=C1"
 *
 * The `side` parameter sets the player side for non-canonical formats
 * (legacy formats do not encode side).
 */
export function parseChatMoveLoose(
  input: string,
  side: PlayerSide = 0,
): ViewerMoveParsed | null {
  // 1. Try canonical parser first (highest fidelity)
  const canonical = parseViewerMoveTextLoose(input);
  if (canonical) return canonical;

  // 2. Legacy / shorthand fallback
  const raw = (input ?? "").toString().trim();
  if (!raw) return null;

  // Normalize separators
  const t = raw
    .replace(/^(?:#|!)(?:triad|move|m)\s+/i, "")
    .trim()
    .replace(/\u3000/g, " ") // fullwidth space
    .replace(/[→➡⇒➔⟶⟹⮕]/g, "->")
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/＝/g, "=");

  // Extract optional wm (accept coord or digit)
  let main = t;
  let wm: number | null = null;
  const wmRe = /\s+(?:wm|w)\s*=?\s*([A-C][1-3]|\d)\s*$/i;
  const wmM = main.match(wmRe);
  if (wmM) {
    const c = parseCellAny(wmM[1]);
    if (c === null) return null;
    wm = c;
    main = main.replace(wmRe, "").trim();
  }

  // Arrow style: "<card>-><cell>"
  const arrow = main.match(/^(.*?)\s*->\s*([A-C][1-3]|\d)\s*$/i);
  if (arrow) {
    const cardIndex = parseCardIndexHuman(arrow[1]);
    const cell = parseCellAny(arrow[2]);
    if (cardIndex === null || cell === null) return null;
    return buildParsedFromLegacy(side, cardIndex, cell, wm);
  }

  // Space style: "<cell> <card>" or "<card> <cell>"
  const parts = main.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    // cell first
    const cell = parseCellAny(parts[0]);
    const cardIndex = parseCardIndexHuman(parts[1]);
    if (cell !== null && cardIndex !== null) return buildParsedFromLegacy(side, cardIndex, cell, wm);

    // card first
    const cardIndex2 = parseCardIndexHuman(parts[0]);
    const cell2 = parseCellAny(parts[1]);
    if (cell2 !== null && cardIndex2 !== null) return buildParsedFromLegacy(side, cardIndex2, cell2, wm);

    return null;
  }

  // Single-token fallback: legacy "cell card" without space (unlikely but safe)
  const legacy = raw.match(/^(?<cell>\d)\s+(?<card>\d)(?:\s+(?:wm|w)\s*=?\s*(?<wm>\d))?$/i);
  if (legacy?.groups) {
    const cell = Number(legacy.groups.cell);
    const cardIndex = Number(legacy.groups.card);
    if (!Number.isFinite(cell) || cell < 0 || cell > 8) return null;
    if (!Number.isFinite(cardIndex) || cardIndex < 0 || cardIndex > 4) return null;
    const wmRaw = legacy.groups.wm;
    const w = typeof wmRaw === "string" && wmRaw.length > 0 ? Number(wmRaw) : null;
    if (w !== null && (!Number.isFinite(w) || w < 0 || w > 8)) return null;
    return buildParsedFromLegacy(side, cardIndex, cell, w);
  }

  return null;
}

function buildParsedFromLegacy(
  side: PlayerSide,
  cardIndex: number,
  cell: number,
  warningMarkCell: number | null,
): ViewerMoveParsed {
  const slot = cardIndex + 1;
  const normalizedText = formatViewerMoveText({ side, slot, cell, warningMarkCell });
  return { side, slot, cardIndex, cell, warningMarkCell, normalizedText };
}
