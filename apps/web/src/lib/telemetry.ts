/* ═══════════════════════════════════════════════════════════════════════════
   TELEMETRY — Minimal UX Measurement (NIN-UX-003)

   Privacy-first: localStorage only, no network calls.
   Tracks the "Nintendo UX" quality metrics:
   - first_interaction_ms: Time to first user interaction
   - first_place_ms: Time to first card placement
   - invalid_action_count: Number of invalid action attempts
   ═══════════════════════════════════════════════════════════════════════════ */

export interface SessionTelemetry {
  /** ms from page load to first user interaction (click/tap) */
  first_interaction_ms: number | null;
  /** ms from page load to first card placement */
  first_place_ms: number | null;
  /** ms from Home quick-play click to first card placement */
  quickplay_to_first_place_ms: number | null;
  /** Count of invalid action attempts in this session */
  invalid_action_count: number;
}

const STORAGE_PREFIX = "nytl.telemetry.";

// ── Persistence helpers ────────────────────────────────────────────────

function readNumber(key: string): number | null {
  try {
    const v = localStorage.getItem(STORAGE_PREFIX + key);
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeNumber(key: string, value: number): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, String(value));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function removeNumber(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // localStorage unavailable — silently ignore
  }
}

// ── Cumulative stats ───────────────────────────────────────────────────

export interface CumulativeStats {
  sessions: number;
  avg_first_interaction_ms: number | null;
  avg_first_place_ms: number | null;
  avg_quickplay_to_first_place_ms: number | null;
  total_invalid_actions: number;
}

const CUMULATIVE_KEYS = [
  "cum.sessions",
  "cum.sum_first_interaction_ms",
  "cum.sum_first_place_ms",
  "cum.sum_quickplay_to_first_place_ms",
  "cum.count_first_interaction",
  "cum.count_first_place",
  "cum.count_quickplay_to_first_place",
  "cum.total_invalid_actions",
] as const;

export function readCumulativeStats(): CumulativeStats {
  const sessions = readNumber("cum.sessions") ?? 0;
  const sumInteraction = readNumber("cum.sum_first_interaction_ms");
  const sumPlace = readNumber("cum.sum_first_place_ms");
  const sumQuickPlayToFirstPlace = readNumber("cum.sum_quickplay_to_first_place_ms");
  const countInteraction = readNumber("cum.count_first_interaction") ?? 0;
  const countPlace = readNumber("cum.count_first_place") ?? 0;
  const countQuickPlayToFirstPlace = readNumber("cum.count_quickplay_to_first_place") ?? 0;
  const totalInvalid = readNumber("cum.total_invalid_actions") ?? 0;

  return {
    sessions,
    avg_first_interaction_ms:
      countInteraction > 0 && sumInteraction !== null
        ? Math.round(sumInteraction / countInteraction)
        : null,
    avg_first_place_ms:
      countPlace > 0 && sumPlace !== null ? Math.round(sumPlace / countPlace) : null,
    avg_quickplay_to_first_place_ms:
      countQuickPlayToFirstPlace > 0 && sumQuickPlayToFirstPlace !== null
        ? Math.round(sumQuickPlayToFirstPlace / countQuickPlayToFirstPlace)
        : null,
    total_invalid_actions: totalInvalid,
  };
}

export function clearCumulativeStats(): void {
  for (const key of CUMULATIVE_KEYS) {
    removeNumber(key);
  }
}

function persistSession(session: SessionTelemetry): void {
  const sessions = (readNumber("cum.sessions") ?? 0) + 1;
  writeNumber("cum.sessions", sessions);

  if (session.first_interaction_ms !== null) {
    const sum = (readNumber("cum.sum_first_interaction_ms") ?? 0) + session.first_interaction_ms;
    const count = (readNumber("cum.count_first_interaction") ?? 0) + 1;
    writeNumber("cum.sum_first_interaction_ms", sum);
    writeNumber("cum.count_first_interaction", count);
  }

  if (session.first_place_ms !== null) {
    const sum = (readNumber("cum.sum_first_place_ms") ?? 0) + session.first_place_ms;
    const count = (readNumber("cum.count_first_place") ?? 0) + 1;
    writeNumber("cum.sum_first_place_ms", sum);
    writeNumber("cum.count_first_place", count);
  }

  if (session.quickplay_to_first_place_ms !== null) {
    const sum =
      (readNumber("cum.sum_quickplay_to_first_place_ms") ?? 0) +
      session.quickplay_to_first_place_ms;
    const count = (readNumber("cum.count_quickplay_to_first_place") ?? 0) + 1;
    writeNumber("cum.sum_quickplay_to_first_place_ms", sum);
    writeNumber("cum.count_quickplay_to_first_place", count);
  }

  const totalInvalid =
    (readNumber("cum.total_invalid_actions") ?? 0) + session.invalid_action_count;
  writeNumber("cum.total_invalid_actions", totalInvalid);
}

// ── Cross-page quick play marker (Home -> Match) ──────────────────────

const QUICKPLAY_START_KEY = `${STORAGE_PREFIX}ephemeral.quickplay_start_epoch_ms`;

function getTransientStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> | null {
  try {
    if (typeof sessionStorage !== "undefined") return sessionStorage;
  } catch {
    // ignore
  }
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Called from Home quick-play CTA to mark "start match flow".
 * Stored only locally (sessionStorage preferred).
 */
export function markQuickPlayStart(epochMs: number = Date.now()): void {
  const storage = getTransientStorage();
  if (!storage || !Number.isFinite(epochMs)) return;
  try {
    storage.setItem(QUICKPLAY_START_KEY, String(Math.round(epochMs)));
  } catch {
    // storage unavailable/full
  }
}

function consumeQuickPlayStart(): number | null {
  const storage = getTransientStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(QUICKPLAY_START_KEY);
    storage.removeItem(QUICKPLAY_START_KEY);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

// ── Session tracker ────────────────────────────────────────────────────

export interface TelemetryTracker {
  /** Call on first user interaction (click/tap anywhere) */
  recordInteraction: () => void;
  /** Call when a card is successfully placed */
  recordPlace: () => void;
  /** Call when an invalid action is attempted */
  recordInvalidAction: () => void;
  /** Get current session data */
  getSession: () => SessionTelemetry;
  /** Flush session to cumulative stats (call on unmount / game end) */
  flush: () => void;
}

export function createTelemetryTracker(): TelemetryTracker {
  const startTime = performance.now();
  let flushed = false;

  const session: SessionTelemetry = {
    first_interaction_ms: null,
    first_place_ms: null,
    quickplay_to_first_place_ms: null,
    invalid_action_count: 0,
  };

  return {
    recordInteraction() {
      if (session.first_interaction_ms === null) {
        session.first_interaction_ms = Math.round(performance.now() - startTime);
      }
    },

    recordPlace() {
      // Also counts as an interaction
      if (session.first_interaction_ms === null) {
        session.first_interaction_ms = Math.round(performance.now() - startTime);
      }
      if (session.first_place_ms === null) {
        session.first_place_ms = Math.round(performance.now() - startTime);
        const quickPlayStartedAt = consumeQuickPlayStart();
        if (quickPlayStartedAt !== null) {
          const elapsed = Date.now() - quickPlayStartedAt;
          if (Number.isFinite(elapsed) && elapsed >= 0) {
            session.quickplay_to_first_place_ms = Math.round(elapsed);
          }
        }
      }
    },

    recordInvalidAction() {
      session.invalid_action_count += 1;
    },

    getSession() {
      return { ...session };
    },

    flush() {
      if (flushed) return;
      flushed = true;
      persistSession(session);

      if (import.meta.env.DEV && typeof console !== "undefined" && console.debug) {
        console.debug("[nytl-telemetry] session:", session);
      }
    },
  };
}
