/**
 * Streamer/Overlay bus for OBS-style rendering.
 *
 * Goals:
 * - Keep the stream overlay usable without a backend.
 * - Work across tabs (Match tab -> Overlay tab).
 * - Degrade gracefully if BroadcastChannel is not available.
 */

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

  // Optional usage hints for stream tooling (best-effort).
  usedCells?: number[]; // 0..8
  usedCardIndicesA?: number[]; // 0..4
  usedCardIndicesB?: number[]; // 0..4
  warningMarksUsedA?: number;
  warningMarksUsedB?: number;

  /** Engine board cell objects (kept as 'unknown' to avoid tight coupling). */
  board?: unknown;

  lastMove?: {
    turnIndex: number;
    by: 0 | 1;
    cell: number;
    cardIndex: number;
    warningMarkCell?: number | null;
  };

  aiNote?: string;

  status?: {
    finished?: boolean;
    winner?: string;
    tilesA?: number;
    tilesB?: number;
    matchId?: string;
  };

  error?: string;
};

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
    return safeParse<OverlayStateV1>(raw);
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
    if (typeof (window as any).BroadcastChannel !== "undefined") {
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
    if (typeof (window as any).BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (ev: MessageEvent) => {
        const data: any = ev.data;
        if (data?.type === "overlay_state_v1" && data?.state?.version === 1) {
          onState(data.state as OverlayStateV1);
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
      const s = safeParse<OverlayStateV1>(e.newValue);
      if (s && s.version === 1) onState(s);
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
    return safeParse<StreamVoteStateV1>(raw);
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
    if (typeof (window as any).BroadcastChannel !== "undefined") {
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
    if (typeof (window as any).BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(VOTE_CHANNEL_NAME);
      bc.onmessage = (ev: MessageEvent) => {
        const data: any = ev.data;
        if (data?.type === "stream_vote_state_v1" && data?.state?.version === 1) {
          onState(data.state as StreamVoteStateV1);
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
      const s = safeParse<StreamVoteStateV1>(e.newValue);
      if (s && s.version === 1) onState(s);
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
    if (typeof (window as any).BroadcastChannel !== "undefined") {
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
    if (typeof (window as any).BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(CMD_CHANNEL_NAME);
      bc.onmessage = (ev: MessageEvent) => {
        const data: any = ev.data;
        if (data?.type === "stream_command_v1" && data?.cmd?.version === 1) {
          onCmd(data.cmd as StreamCommandV1);
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
      const c = safeParse<StreamCommandV1>(e.newValue);
      if (c && c.version === 1) onCmd(c);
    }
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function readStoredStreamCommand(): StreamCommandV1 | null {
  try {
    const raw = localStorage.getItem(CMD_STORAGE_KEY);
    if (!raw) return null;
    return safeParse<StreamCommandV1>(raw);
  } catch {
    return null;
  }
}
