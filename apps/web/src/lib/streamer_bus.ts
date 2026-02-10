/**
 * Streamer/Overlay bus for OBS-style rendering.
 *
 * Goals:
 * - Keep the stream overlay usable without a backend.
 * - Work across tabs (Match tab -> Overlay tab).
 * - Degrade gracefully if BroadcastChannel is not available.
 */

/** Lightweight board cell for overlay transport (no engine import). */
export interface BoardCellLite {
  owner: 0 | 1;
  card: {
    tokenId: bigint | string | number;
    edges: { up: number; right: number; down: number; left: number };
    jankenHand: 0 | 1 | 2;
    trait?: string;
    combatStatSum?: number;
  };
  state?: { forestShield?: number };
}

export type OverlayStateV1 = {
  version: 1;
  updatedAtMs: number;

  /** "live" from Match page or "replay" from Replay page */
  mode: "live" | "replay";

  eventId?: string;
  eventTitle?: string;

  turn?: number; // 0..9
  firstPlayer?: 0 | 1;

  playerA?: string;
  playerB?: string;

  rulesetId?: string;
  seasonId?: number;

  deckA?: string[]; // decimal strings
  deckB?: string[]; // decimal strings


/**
 * Protocol snapshot (Transcript-like) for integrations.
 * JSON-friendly (tokenIds are strings).
 */
protocolV1?: {
  header: {
    version: number;
    rulesetId: string;
    seasonId: number;
    playerA: string;
    playerB: string;
    deckA: string[]; // tokenId decimal strings
    deckB: string[]; // tokenId decimal strings
    firstPlayer: 0 | 1;
    deadline: number;
    salt: string;
  };
  turns: Array<{
    cell: number;
    cardIndex: number;
    warningMarkCell?: number;
  }>;
};

  // Optional usage hints for stream tooling (best-effort).
  usedCells?: number[]; // 0..8
  usedCardIndicesA?: number[]; // 0..4
  usedCardIndicesB?: number[]; // 0..4
  warningMarksUsedA?: number;
  warningMarksUsedB?: number;

  /** Engine board cell objects for overlay transport. */
  board?: (BoardCellLite | null)[];

  lastMove?: {
    turnIndex: number;
    by: 0 | 1;
    cell: number;
    cardIndex: number;
    warningMarkCell?: number | null;
  };

/**
 * Optional: richer turn details from the engine (used for stream overlays).
 * Keep this as a small JSON-shape so overlay doesn't need to import engine types.
 */
lastTurnSummary?: {
  flipCount: number;
  comboCount: number;
  comboEffect: "none" | "momentum" | "domination" | "fever";
  triadPlus: number;
  ignoreWarningMark: boolean;
  warningTriggered: boolean;
  warningPlaced: number | null;

  /** Optional per-flip traces (small JSON). */
  flips?: Array<{
    from: number;
    to: number;
    isChain: boolean;
    kind: "ortho" | "diag";
    dir?: "up" | "right" | "down" | "left";
    vert?: "up" | "down";
    horiz?: "left" | "right";
    aVal: number;
    dVal: number;
    tieBreak: boolean;
  }>;
};

aiNote?: string;
aiReasonCode?: string;

  status?: {
    finished?: boolean;
    winner?: string;
    tilesA?: number;
    tilesB?: number;
    matchId?: string;
  };

  error?: string;

  /** RPC connection status (Phase 0 stability — propagated from Match.tsx). */
  rpcStatus?: {
    ok: boolean;
    message?: string;
    timestampMs: number;
  };

  /** External integration status (compatible extension, added commit-0084). */
  externalStatus?: {
    lastOk?: boolean;
    lastMessage?: string;
    lastTimestampMs?: number;
  };

  /** Board advantage assessment (added M16, Phase 1 spectator experience). */
  advantage?: {
    scoreA: number;
    levelA: string;
    labelJa: string;
    badgeColor: string;
  };
};

// ---------------------------------------------------------------------------
// Runtime validators (Phase 3 — API contract testing)
// ---------------------------------------------------------------------------

/** Helper: check integer in range [min, max] inclusive. */
function isIntInRange(v: unknown, min: number, max: number): boolean {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

/**
 * Runtime validator for BoardCellLite shape.
 * Checks owner, card structure, and edge values.
 */
export function isValidBoardCellLite(c: unknown): c is BoardCellLite {
  if (typeof c !== "object" || c === null) return false;
  const r = c as Record<string, unknown>;

  // owner must be 0 or 1
  if (r.owner !== 0 && r.owner !== 1) return false;

  // card must be object with edges and jankenHand
  if (typeof r.card !== "object" || r.card === null) return false;
  const card = r.card as Record<string, unknown>;

  // tokenId must exist (string or number after JSON roundtrip — bigint is not preserved)
  if (card.tokenId === undefined || card.tokenId === null) return false;
  const tidType = typeof card.tokenId;
  if (tidType !== "string" && tidType !== "number" && tidType !== "bigint") return false;

  // edges must have up/right/down/left as numbers
  if (typeof card.edges !== "object" || card.edges === null) return false;
  const edges = card.edges as Record<string, unknown>;
  if (typeof edges.up !== "number" || typeof edges.right !== "number" ||
      typeof edges.down !== "number" || typeof edges.left !== "number") return false;

  // jankenHand must be 0, 1, or 2
  if (card.jankenHand !== 0 && card.jankenHand !== 1 && card.jankenHand !== 2) return false;

  return true;
}

/**
 * Runtime validator for OverlayStateV1 shape.
 * Validates required fields and type-checks optional fields when present.
 * Follows the isValidEventV1() pattern from events.ts.
 */
export function isValidOverlayStateV1(s: unknown): s is OverlayStateV1 {
  if (typeof s !== "object" || s === null) return false;
  const r = s as Record<string, unknown>;

  // Required fields
  if (r.version !== 1) return false;
  if (typeof r.updatedAtMs !== "number" || !Number.isFinite(r.updatedAtMs)) return false;
  if (r.mode !== "live" && r.mode !== "replay") return false;

  // Optional: turn must be integer 0-9
  if (r.turn !== undefined && !isIntInRange(r.turn, 0, 9)) return false;

  // Optional: firstPlayer must be 0 or 1
  if (r.firstPlayer !== undefined && r.firstPlayer !== 0 && r.firstPlayer !== 1) return false;

  // Optional: playerA/playerB must be strings
  if (r.playerA !== undefined && typeof r.playerA !== "string") return false;
  if (r.playerB !== undefined && typeof r.playerB !== "string") return false;

  // Optional: deckA/deckB must be string[] of length 5
  if (r.deckA !== undefined) {
    if (!Array.isArray(r.deckA) || r.deckA.length !== 5) return false;
    if (!r.deckA.every((x: unknown) => typeof x === "string")) return false;
  }
  if (r.deckB !== undefined) {
    if (!Array.isArray(r.deckB) || r.deckB.length !== 5) return false;
    if (!r.deckB.every((x: unknown) => typeof x === "string")) return false;
  }

  // Optional: board must be array of length 9, each null or valid BoardCellLite
  if (r.board !== undefined) {
    if (!Array.isArray(r.board) || r.board.length !== 9) return false;
    for (const cell of r.board) {
      if (cell !== null && !isValidBoardCellLite(cell)) return false;
    }
  }

  // Optional: lastMove must have valid structure
  if (r.lastMove !== undefined) {
    if (typeof r.lastMove !== "object" || r.lastMove === null) return false;
    const lm = r.lastMove as Record<string, unknown>;
    if (!isIntInRange(lm.turnIndex, 0, 8)) return false;
    if (lm.by !== 0 && lm.by !== 1) return false;
    if (!isIntInRange(lm.cell, 0, 8)) return false;
    if (!isIntInRange(lm.cardIndex, 0, 4)) return false;
  }

  // Optional: lastTurnSummary
  if (r.lastTurnSummary !== undefined) {
    if (typeof r.lastTurnSummary !== "object" || r.lastTurnSummary === null) return false;
    const lts = r.lastTurnSummary as Record<string, unknown>;
    if (typeof lts.flipCount !== "number") return false;
    const validEffects = ["none", "momentum", "domination", "fever"];
    if (!validEffects.includes(lts.comboEffect as string)) return false;
  }

  return true;
}

/**
 * Runtime validator for StreamVoteStateV1 shape.
 */
export function isValidStreamVoteStateV1(s: unknown): s is StreamVoteStateV1 {
  if (typeof s !== "object" || s === null) return false;
  const r = s as Record<string, unknown>;

  // Required fields
  if (r.version !== 1) return false;
  if (typeof r.updatedAtMs !== "number" || !Number.isFinite(r.updatedAtMs)) return false;
  if (r.status !== "open" && r.status !== "closed") return false;

  // Optional: turn must be integer 0-8
  if (r.turn !== undefined && !isIntInRange(r.turn, 0, 8)) return false;

  // Optional: controlledSide must be 0 or 1
  if (r.controlledSide !== undefined && r.controlledSide !== 0 && r.controlledSide !== 1) return false;

  // Optional: top must be valid array of vote entries
  if (r.top !== undefined) {
    if (!Array.isArray(r.top)) return false;
    for (const entry of r.top) {
      if (typeof entry !== "object" || entry === null) return false;
      const e = entry as Record<string, unknown>;
      if (typeof e.count !== "number") return false;
      if (typeof e.move !== "object" || e.move === null) return false;
      const m = e.move as Record<string, unknown>;
      if (!isIntInRange(m.cell, 0, 8)) return false;
      if (!isIntInRange(m.cardIndex, 0, 4)) return false;
      // warningMarkCell: null or undefined OK, number must be 0-8
      if (m.warningMarkCell !== undefined && m.warningMarkCell !== null) {
        if (!isIntInRange(m.warningMarkCell, 0, 8)) return false;
      }
    }
  }

  return true;
}

/**
 * Runtime validator for StreamCommandV1 shape.
 */
export function isValidStreamCommandV1(c: unknown): c is StreamCommandV1 {
  if (typeof c !== "object" || c === null) return false;
  const r = c as Record<string, unknown>;

  // Required fields
  if (r.version !== 1) return false;
  if (typeof r.id !== "string" || r.id.length === 0) return false;
  if (typeof r.issuedAtMs !== "number" || !Number.isFinite(r.issuedAtMs)) return false;
  if (r.type !== "commit_move_v1") return false;
  if (r.by !== 0 && r.by !== 1) return false;
  if (!isIntInRange(r.forTurn, 0, 8)) return false;

  // move must have valid cell and cardIndex
  if (typeof r.move !== "object" || r.move === null) return false;
  const m = r.move as Record<string, unknown>;
  if (!isIntInRange(m.cell, 0, 8)) return false;
  if (!isIntInRange(m.cardIndex, 0, 4)) return false;
  // warningMarkCell: null or undefined OK, number must be 0-8
  if (m.warningMarkCell !== undefined && m.warningMarkCell !== null) {
    if (!isIntInRange(m.warningMarkCell, 0, 8)) return false;
  }

  return true;
}

function hasBroadcastChannel(): boolean {
  return typeof BroadcastChannel !== "undefined";
}

const CHANNEL_NAME = "nyano-triad-league.overlay.v1";
const STORAGE_KEY = "nyano_triad_league.overlay_state_v1";

function safeStringify(x: unknown): string {
  return JSON.stringify(x, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
}

function safeParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function readStoredOverlayState(): OverlayStateV1 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeParse<unknown>(raw);
    if (!isValidOverlayStateV1(parsed)) {
      if (parsed !== null) console.warn("[streamer_bus] Invalid OverlayStateV1 in localStorage, ignoring");
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function publishOverlayState(state: OverlayStateV1): void {
  // store (so overlay can recover after refresh)
  try {
    localStorage.setItem(STORAGE_KEY, safeStringify(state));
  } catch {
    // ignore
  }

  // broadcast
  try {
    if (hasBroadcastChannel()) {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type: "overlay_state_v1", state });
      bc.close();
      return;
    }
  } catch {
    // ignore and fallback
  }

  // fallback for older environments: storage event across tabs
  try {
    localStorage.setItem(STORAGE_KEY + ":tick", String(Date.now()));
  } catch {
    // ignore
  }
}

export function subscribeOverlayState(onState: (s: OverlayStateV1) => void): () => void {
  // First, try BroadcastChannel
  try {
    if (hasBroadcastChannel()) {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (ev: MessageEvent) => {
        const data: any = ev.data;
        if (data?.type === "overlay_state_v1" && isValidOverlayStateV1(data?.state)) {
          onState(data.state);
        }
      };
      return () => bc.close();
    }
  } catch {
    // ignore and fallback
  }

  // Fallback: listen for localStorage changes (cross-tab)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && typeof e.newValue === "string") {
      const s = safeParse<unknown>(e.newValue);
      if (isValidOverlayStateV1(s)) onState(s);
    }
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}


// ---------------------------------------------------------------------------
// Stream vote state (Prototype)
// ---------------------------------------------------------------------------

/**
 * Vote status sent from Stream Studio (/stream) to the overlay (and optionally other tabs).
 *
 * This is used to show "Chat is voting now" with a countdown + top votes on the OBS overlay.
 * Twitch integration will later replace /stream's simulated chat, but this bus contract can remain.
 */
export type StreamVoteStateV1 = {
  version: 1;
  updatedAtMs: number;

  status: "open" | "closed";

  eventId?: string;
  eventTitle?: string;

  /** 0..8 (turn index) */
  turn?: number;

  /** Which side the chat controls */
  controlledSide?: 0 | 1;

  /** Vote closing time (ms since epoch). Present when status="open". */
  endsAtMs?: number;

  totalVotes?: number;

  top?: Array<{
    move: {
      cell: number; // 0..8
      cardIndex: number; // 0..4
      warningMarkCell?: number | null;
    };
    count: number;
  }>;

  note?: string;
};

const VOTE_CHANNEL_NAME = "nyano-triad-league.stream_vote.v1";
const VOTE_STORAGE_KEY = "nyano_triad_league.stream_vote_state_v1";

export function readStoredStreamVoteState(): StreamVoteStateV1 | null {
  try {
    const raw = localStorage.getItem(VOTE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeParse<unknown>(raw);
    if (!isValidStreamVoteStateV1(parsed)) {
      if (parsed !== null) console.warn("[streamer_bus] Invalid StreamVoteStateV1 in localStorage, ignoring");
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function publishStreamVoteState(state: StreamVoteStateV1): void {
  // store (so overlay can recover after refresh)
  try {
    localStorage.setItem(VOTE_STORAGE_KEY, safeStringify(state));
  } catch {
    // ignore
  }

  // broadcast
  try {
    if (hasBroadcastChannel()) {
      const bc = new BroadcastChannel(VOTE_CHANNEL_NAME);
      bc.postMessage({ type: "stream_vote_state_v1", state });
      bc.close();
      return;
    }
  } catch {
    // ignore and fallback
  }

  // fallback for older environments: storage event across tabs
  try {
    localStorage.setItem(VOTE_STORAGE_KEY + ":tick", String(Date.now()));
  } catch {
    // ignore
  }
}

export function subscribeStreamVoteState(onState: (s: StreamVoteStateV1) => void): () => void {
  // BroadcastChannel
  try {
    if (hasBroadcastChannel()) {
      const bc = new BroadcastChannel(VOTE_CHANNEL_NAME);
      bc.onmessage = (ev: MessageEvent) => {
        const data: any = ev.data;
        if (data?.type === "stream_vote_state_v1" && isValidStreamVoteStateV1(data?.state)) {
          onState(data.state);
        }
      };
      return () => bc.close();
    }
  } catch {
    // ignore and fallback
  }

  // Fallback: listen for localStorage changes (cross-tab)
  const onStorage = (e: StorageEvent) => {
    if (e.key === VOTE_STORAGE_KEY && typeof e.newValue === "string") {
      const s = safeParse<unknown>(e.newValue);
      if (isValidStreamVoteStateV1(s)) onState(s);
    }
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}


// ---------------------------------------------------------------------------
// Stream commands (Prototype)
// ---------------------------------------------------------------------------

/**
 * Commands sent from Stream Studio (/stream) to the live Match tab.
 *
 * Notes:
 * - This is intentionally minimal and "best-effort".
 * - Match side must explicitly opt-in (stream=1) before applying commands.
 * - This bus is designed so we can later replace the Stream Studio input source with
 *   a Twitch Bridge process (EventSub/IRC) without changing the Match UI contract.
 */
export type StreamCommandV1 = {
  version: 1;
  id: string;
  issuedAtMs: number;

  type: "commit_move_v1";

  /** Which player is trying to commit the move. */
  by: 0 | 1;

  /** Must match the current turn index (0..8) on the Match side. */
  forTurn: number;

  move: {
    cell: number; // 0..8
    cardIndex: number; // 0..4
    warningMarkCell?: number | null;
  };

  /** Optional metadata for debugging. */
  source?: string;
};

const CMD_CHANNEL_NAME = "nyano-triad-league.stream_cmd.v1";
const CMD_STORAGE_KEY = "nyano_triad_league.stream_cmd_v1";

export function makeStreamCommandId(prefix = "cmd"): string {
  try {
    const b = new Uint8Array(8);
    crypto.getRandomValues(b);
    const hex = Array.from(b)
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
    return `${prefix}_${hex}`;
  } catch {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
  }
}

export function publishStreamCommand(cmd: StreamCommandV1): void {
  // store (so other tabs can read the latest)
  try {
    localStorage.setItem(CMD_STORAGE_KEY, safeStringify(cmd));
  } catch {
    // ignore
  }

  // broadcast
  try {
    if (hasBroadcastChannel()) {
      const bc = new BroadcastChannel(CMD_CHANNEL_NAME);
      bc.postMessage({ type: "stream_command_v1", cmd });
      bc.close();
      return;
    }
  } catch {
    // ignore and fallback
  }

  // fallback for older environments: storage event across tabs
  try {
    localStorage.setItem(CMD_STORAGE_KEY + ":tick", String(Date.now()));
  } catch {
    // ignore
  }
}

export function subscribeStreamCommand(onCmd: (c: StreamCommandV1) => void): () => void {
  // BroadcastChannel
  try {
    if (hasBroadcastChannel()) {
      const bc = new BroadcastChannel(CMD_CHANNEL_NAME);
      bc.onmessage = (ev: MessageEvent) => {
        const data: any = ev.data;
        if (data?.type === "stream_command_v1" && isValidStreamCommandV1(data?.cmd)) {
          onCmd(data.cmd);
        }
      };
      return () => bc.close();
    }
  } catch {
    // ignore and fallback
  }

  // Fallback: localStorage (cross-tab)
  const onStorage = (e: StorageEvent) => {
    if (e.key === CMD_STORAGE_KEY && typeof e.newValue === "string") {
      const c = safeParse<unknown>(e.newValue);
      if (isValidStreamCommandV1(c)) onCmd(c);
    }
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function readStoredStreamCommand(): StreamCommandV1 | null {
  try {
    const raw = localStorage.getItem(CMD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeParse<unknown>(raw);
    if (!isValidStreamCommandV1(parsed)) {
      if (parsed !== null) console.warn("[streamer_bus] Invalid StreamCommandV1 in localStorage, ignoring");
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
