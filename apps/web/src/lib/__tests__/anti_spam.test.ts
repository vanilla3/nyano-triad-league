import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateUsername,
  checkRateLimit,
  checkVoteChangeLimit,
  DEFAULT_ANTI_SPAM_CONFIG,
  type AntiSpamConfig,
} from "../anti_spam";

/* ------------------------------------------------------------------ */
/* Mock localStorage                                                   */
/* ------------------------------------------------------------------ */

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

// ---------------------------------------------------------------------------
// validateUsername
// ---------------------------------------------------------------------------

describe("validateUsername", () => {
  it("accepts valid alphanumeric username", () => {
    expect(validateUsername("viewer42")).toEqual({ ok: true });
  });

  it("accepts username with underscores and hyphens", () => {
    expect(validateUsername("cool_cat-99")).toEqual({ ok: true });
  });

  it("rejects empty string", () => {
    const r = validateUsername("");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid_username");
  });

  it("rejects username shorter than minUserNameLength", () => {
    const config: AntiSpamConfig = { ...DEFAULT_ANTI_SPAM_CONFIG, minUserNameLength: 3 };
    const r = validateUsername("ab", config);
    expect(r.ok).toBe(false);
    if (!r.ok && r.reason === "invalid_username") {
      expect(r.detail).toContain("too_short");
    } else {
      expect.unreachable("expected invalid_username");
    }
  });

  it("rejects username longer than maxUserNameLength", () => {
    const config: AntiSpamConfig = { ...DEFAULT_ANTI_SPAM_CONFIG, maxUserNameLength: 5 };
    const r = validateUsername("abcdef", config);
    expect(r.ok).toBe(false);
    if (!r.ok && r.reason === "invalid_username") {
      expect(r.detail).toContain("too_long");
    } else {
      expect.unreachable("expected invalid_username");
    }
  });

  it("rejects username with special characters", () => {
    const r = validateUsername("user name!"); // space + exclamation
    expect(r.ok).toBe(false);
    if (!r.ok && r.reason === "invalid_username") {
      expect(r.detail).toBe("invalid_chars");
    } else {
      expect.unreachable("expected invalid_username");
    }
  });

  it("rejects username with emoji", () => {
    const r = validateUsername("cool😎dude");
    expect(r.ok).toBe(false);
    if (!r.ok && r.reason === "invalid_username") expect(r.detail).toBe("invalid_chars");
  });

  it("respects custom userNamePattern", () => {
    const config: AntiSpamConfig = {
      ...DEFAULT_ANTI_SPAM_CONFIG,
      userNamePattern: /^[a-z]+$/,
    };
    expect(validateUsername("abc", config).ok).toBe(true);
    expect(validateUsername("ABC", config).ok).toBe(false);
    expect(validateUsername("a1", config).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkRateLimit
// ---------------------------------------------------------------------------

describe("checkRateLimit", () => {
  let map: Map<string, number>;

  beforeEach(() => {
    map = new Map();
  });

  it("allows first vote from a user", () => {
    expect(checkRateLimit("alice", 1000, map)).toEqual({ ok: true });
  });

  it("rejects vote within cooldown window", () => {
    map.set("alice", 1000);
    const r = checkRateLimit("alice", 2500, map); // 1500ms elapsed, need 2000
    expect(r.ok).toBe(false);
    if (!r.ok && r.reason === "rate_limited") {
      expect(r.waitMs).toBe(500); // 2000 - 1500
    } else {
      expect.unreachable("expected rate_limited");
    }
  });

  it("allows vote after cooldown expires", () => {
    map.set("alice", 1000);
    expect(checkRateLimit("alice", 3001, map)).toEqual({ ok: true });
  });

  it("returns correct waitMs in rejection", () => {
    map.set("bob", 5000);
    const r = checkRateLimit("bob", 5800, map); // 800ms elapsed
    expect(r.ok).toBe(false);
    if (!r.ok && r.reason === "rate_limited") expect(r.waitMs).toBe(1200);
  });

  it("respects configurable rateLimitMs", () => {
    const config: AntiSpamConfig = { ...DEFAULT_ANTI_SPAM_CONFIG, rateLimitMs: 5000 };
    map.set("alice", 1000);
    expect(checkRateLimit("alice", 5000, map, config).ok).toBe(false); // 4000ms < 5000ms
    expect(checkRateLimit("alice", 6001, map, config)).toEqual({ ok: true });
  });

  it("allows different users independently", () => {
    map.set("alice", 1000);
    expect(checkRateLimit("bob", 1500, map)).toEqual({ ok: true });
  });
});

// ---------------------------------------------------------------------------
// checkVoteChangeLimit
// ---------------------------------------------------------------------------

describe("checkVoteChangeLimit", () => {
  let countMap: Map<string, number>;

  beforeEach(() => {
    countMap = new Map();
  });

  it("always allows when maxVoteChangesPerRound is 0 (unlimited)", () => {
    countMap.set("alice", 100);
    expect(checkVoteChangeLimit("alice", countMap)).toEqual({ ok: true });
  });

  it("allows vote when under limit", () => {
    const config: AntiSpamConfig = { ...DEFAULT_ANTI_SPAM_CONFIG, maxVoteChangesPerRound: 3 };
    countMap.set("alice", 2);
    expect(checkVoteChangeLimit("alice", countMap, config)).toEqual({ ok: true });
  });

  it("rejects vote when limit is reached", () => {
    const config: AntiSpamConfig = { ...DEFAULT_ANTI_SPAM_CONFIG, maxVoteChangesPerRound: 3 };
    countMap.set("alice", 3);
    const r = checkVoteChangeLimit("alice", countMap, config);
    expect(r.ok).toBe(false);
    if (!r.ok && r.reason === "max_changes_exceeded") {
      expect(r.limit).toBe(3);
    } else {
      expect.unreachable("expected max_changes_exceeded");
    }
  });

  it("allows first vote for a user with no prior count", () => {
    const config: AntiSpamConfig = { ...DEFAULT_ANTI_SPAM_CONFIG, maxVoteChangesPerRound: 1 };
    expect(checkVoteChangeLimit("newuser", countMap, config)).toEqual({ ok: true });
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_ANTI_SPAM_CONFIG
// ---------------------------------------------------------------------------

describe("DEFAULT_ANTI_SPAM_CONFIG", () => {
  it("rateLimitMs is 2000", () => {
    expect(DEFAULT_ANTI_SPAM_CONFIG.rateLimitMs).toBe(2000);
  });

  it("maxVoteChangesPerRound is 0 (unlimited)", () => {
    expect(DEFAULT_ANTI_SPAM_CONFIG.maxVoteChangesPerRound).toBe(0);
  });

  it("has reasonable username constraints", () => {
    expect(DEFAULT_ANTI_SPAM_CONFIG.minUserNameLength).toBe(1);
    expect(DEFAULT_ANTI_SPAM_CONFIG.maxUserNameLength).toBe(50);
    expect(DEFAULT_ANTI_SPAM_CONFIG.userNamePattern).toBeInstanceOf(RegExp);
  });
});

// ---------------------------------------------------------------------------
// local_settings roundtrip (anti-spam specific)
// ---------------------------------------------------------------------------

describe("anti-spam local_settings roundtrip", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMockStorage());
  });

  it("readAntiSpamRateLimitMs / writeAntiSpamRateLimitMs roundtrip", async () => {
    const { readAntiSpamRateLimitMs, writeAntiSpamRateLimitMs } = await import("../local_settings");
    expect(readAntiSpamRateLimitMs()).toBe(2000); // default
    writeAntiSpamRateLimitMs(5000);
    expect(readAntiSpamRateLimitMs()).toBe(5000);
  });

  it("readAntiSpamMaxVoteChanges / writeAntiSpamMaxVoteChanges roundtrip", async () => {
    const { readAntiSpamMaxVoteChanges, writeAntiSpamMaxVoteChanges } = await import("../local_settings");
    expect(readAntiSpamMaxVoteChanges()).toBe(0); // default (unlimited)
    writeAntiSpamMaxVoteChanges(3);
    expect(readAntiSpamMaxVoteChanges()).toBe(3);
  });
});
