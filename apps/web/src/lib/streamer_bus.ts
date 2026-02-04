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
