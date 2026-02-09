/**
 * stream_recovery.ts
 *
 * One-click recovery helpers for the Stream Studio.
 * Clears specific localStorage keys to reset overlay / vote / lock state.
 *
 * All functions are pure (no React) and safe to call from any context.
 */

// ── Storage key constants (mirror streamer_bus.ts + local_settings.ts) ──────

export const RECOVERY_KEYS = {
  overlay: "nyano_triad_league.overlay_state_v1",
  overlayTick: "nyano_triad_league.overlay_state_v1:tick",
  vote: "nyano_triad_league.stream_vote_state_v1",
  voteTick: "nyano_triad_league.stream_vote_state_v1:tick",
  cmd: "nyano_triad_league.stream_cmd_v1",
  cmdTick: "nyano_triad_league.stream_cmd_v1:tick",
  settingsLock: "stream.settingsLocked",
} as const;

export type RecoveryAction = "clear_overlay" | "clear_votes" | "clear_lock" | "full_reset";

// ── Action → keys mapping ───────────────────────────────────────────────────

/**
 * Returns the list of localStorage keys that will be cleared for a given action.
 */
export function getRecoveryKeys(action: RecoveryAction): string[] {
  switch (action) {
    case "clear_overlay":
      return [RECOVERY_KEYS.overlay, RECOVERY_KEYS.overlayTick];
    case "clear_votes":
      return [
        RECOVERY_KEYS.vote,
        RECOVERY_KEYS.voteTick,
        RECOVERY_KEYS.cmd,
        RECOVERY_KEYS.cmdTick,
      ];
    case "clear_lock":
      return [RECOVERY_KEYS.settingsLock];
    case "full_reset":
      return [
        RECOVERY_KEYS.overlay,
        RECOVERY_KEYS.overlayTick,
        RECOVERY_KEYS.vote,
        RECOVERY_KEYS.voteTick,
        RECOVERY_KEYS.cmd,
        RECOVERY_KEYS.cmdTick,
        RECOVERY_KEYS.settingsLock,
      ];
  }
}

// ── Recovery result type ────────────────────────────────────────────────────

export type RecoveryResult = {
  action: RecoveryAction;
  cleared: string[];
  timestampMs: number;
};

/**
 * Execute a recovery action: remove the specified localStorage keys.
 *
 * Returns an audit trail of what was cleared.
 * Silently ignores errors from localStorage.
 */
export function executeRecovery(action: RecoveryAction): RecoveryResult {
  const keys = getRecoveryKeys(action);
  const cleared: string[] = [];

  for (const key of keys) {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        cleared.push(key);
      }
    } catch {
      // ignore (storage unavailable, etc.)
    }
  }

  return {
    action,
    cleared,
    timestampMs: Date.now(),
  };
}

/**
 * Human-readable label for a recovery action (Japanese).
 */
export function recoveryActionLabel(action: RecoveryAction): string {
  switch (action) {
    case "clear_overlay":
      return "Overlay Reset";
    case "clear_votes":
      return "Vote Reset";
    case "clear_lock":
      return "Lock Reset";
    case "full_reset":
      return "Full Reset";
  }
}
