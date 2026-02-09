import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  RECOVERY_KEYS,
  getRecoveryKeys,
  executeRecovery,
  recoveryActionLabel,
  type RecoveryAction,
} from "../stream_recovery";

/* ═══════════════════════════════════════════════════════════════════
   stream_recovery.ts — Test Coverage
   ═══════════════════════════════════════════════════════════════════ */

/* Mock localStorage */
function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createMockStorage());
});

describe("RECOVERY_KEYS", () => {
  it("has all expected keys", () => {
    expect(RECOVERY_KEYS.overlay).toBe("nyano_triad_league.overlay_state_v1");
    expect(RECOVERY_KEYS.vote).toBe("nyano_triad_league.stream_vote_state_v1");
    expect(RECOVERY_KEYS.cmd).toBe("nyano_triad_league.stream_cmd_v1");
    expect(RECOVERY_KEYS.settingsLock).toBe("stream.settingsLocked");
  });
});

describe("getRecoveryKeys", () => {
  it("clear_overlay returns overlay keys", () => {
    const keys = getRecoveryKeys("clear_overlay");
    expect(keys).toContain(RECOVERY_KEYS.overlay);
    expect(keys).toContain(RECOVERY_KEYS.overlayTick);
    expect(keys).not.toContain(RECOVERY_KEYS.vote);
    expect(keys).not.toContain(RECOVERY_KEYS.settingsLock);
  });

  it("clear_votes returns vote + command keys", () => {
    const keys = getRecoveryKeys("clear_votes");
    expect(keys).toContain(RECOVERY_KEYS.vote);
    expect(keys).toContain(RECOVERY_KEYS.voteTick);
    expect(keys).toContain(RECOVERY_KEYS.cmd);
    expect(keys).toContain(RECOVERY_KEYS.cmdTick);
    expect(keys).not.toContain(RECOVERY_KEYS.overlay);
  });

  it("clear_lock returns settings lock key", () => {
    const keys = getRecoveryKeys("clear_lock");
    expect(keys).toEqual([RECOVERY_KEYS.settingsLock]);
  });

  it("full_reset returns all keys", () => {
    const keys = getRecoveryKeys("full_reset");
    expect(keys).toContain(RECOVERY_KEYS.overlay);
    expect(keys).toContain(RECOVERY_KEYS.overlayTick);
    expect(keys).toContain(RECOVERY_KEYS.vote);
    expect(keys).toContain(RECOVERY_KEYS.voteTick);
    expect(keys).toContain(RECOVERY_KEYS.cmd);
    expect(keys).toContain(RECOVERY_KEYS.cmdTick);
    expect(keys).toContain(RECOVERY_KEYS.settingsLock);
  });
});

describe("executeRecovery", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("clears overlay keys from localStorage", () => {
    localStorage.setItem(RECOVERY_KEYS.overlay, "test-data");
    localStorage.setItem(RECOVERY_KEYS.overlayTick, "123");

    const result = executeRecovery("clear_overlay");
    expect(result.cleared).toContain(RECOVERY_KEYS.overlay);
    expect(result.cleared).toContain(RECOVERY_KEYS.overlayTick);
    expect(localStorage.getItem(RECOVERY_KEYS.overlay)).toBeNull();
    expect(localStorage.getItem(RECOVERY_KEYS.overlayTick)).toBeNull();
  });

  it("only reports keys that existed", () => {
    // Only set one key
    localStorage.setItem(RECOVERY_KEYS.overlay, "test-data");

    const result = executeRecovery("clear_overlay");
    expect(result.cleared).toContain(RECOVERY_KEYS.overlay);
    expect(result.cleared).not.toContain(RECOVERY_KEYS.overlayTick);
  });

  it("returns empty cleared array when no keys exist", () => {
    const result = executeRecovery("clear_overlay");
    expect(result.cleared).toEqual([]);
  });

  it("returns correct action in result", () => {
    const result = executeRecovery("clear_votes");
    expect(result.action).toBe("clear_votes");
  });

  it("returns a valid timestamp", () => {
    const before = Date.now();
    const result = executeRecovery("full_reset");
    const after = Date.now();
    expect(result.timestampMs).toBeGreaterThanOrEqual(before);
    expect(result.timestampMs).toBeLessThanOrEqual(after);
  });

  it("full_reset clears everything", () => {
    // Set all keys
    for (const key of Object.values(RECOVERY_KEYS)) {
      localStorage.setItem(key, "test-data");
    }

    const result = executeRecovery("full_reset");
    expect(result.cleared.length).toBe(Object.values(RECOVERY_KEYS).length);

    // Verify all cleared
    for (const key of Object.values(RECOVERY_KEYS)) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });

  it("does not affect unrelated localStorage keys", () => {
    localStorage.setItem("unrelated.key", "keep-this");
    localStorage.setItem(RECOVERY_KEYS.overlay, "remove-this");

    executeRecovery("full_reset");
    expect(localStorage.getItem("unrelated.key")).toBe("keep-this");
  });
});

describe("recoveryActionLabel", () => {
  it("returns human-readable labels", () => {
    const actions: RecoveryAction[] = ["clear_overlay", "clear_votes", "clear_lock", "full_reset"];
    for (const action of actions) {
      const label = recoveryActionLabel(action);
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
