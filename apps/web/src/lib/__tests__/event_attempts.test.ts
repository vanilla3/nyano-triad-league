import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listEventAttempts,
  listAllEventAttempts,
  hasEventAttempt,
  upsertEventAttempt,
  deleteEventAttempt,
  clearEventAttempts,
  clearAllEventAttempts,
  type EventAttemptV1,
} from "../event_attempts";

/* ------------------------------------------------------------------ */
/* localStorage mock — event_attempts.ts uses `window.localStorage`    */
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

let mockStorage: Storage;

beforeEach(() => {
  mockStorage = createMockStorage();
  // event_attempts.ts accesses `window.localStorage` (explicit window prefix)
  // In vitest node environment, window doesn't exist, so we stub it.
  vi.stubGlobal("window", { localStorage: mockStorage });
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function makeAttempt(eventId: string, matchId: string, createdAt?: string): EventAttemptV1 {
  return {
    id: matchId,
    createdAt: createdAt ?? new Date().toISOString(),
    eventId,
    replayUrl: "https://example.com/replay",
    matchId,
    winner: 0,
    tilesA: 5,
    tilesB: 4,
    rulesetLabel: "v1",
    deckA: ["1", "2", "3", "4", "5"],
    deckB: ["6", "7", "8", "9", "10"],
  };
}

/* ------------------------------------------------------------------ */
/* listEventAttempts                                                    */
/* ------------------------------------------------------------------ */

describe("listEventAttempts", () => {
  it("returns [] for empty eventId", () => {
    expect(listEventAttempts("")).toEqual([]);
  });

  it("returns [] when no attempts stored", () => {
    expect(listEventAttempts("some-event")).toEqual([]);
  });

  it("returns sorted by createdAt desc", () => {
    upsertEventAttempt(makeAttempt("ev1", "m1", "2025-01-01T00:00:00Z"));
    upsertEventAttempt(makeAttempt("ev1", "m2", "2025-06-01T00:00:00Z"));
    upsertEventAttempt(makeAttempt("ev1", "m3", "2025-03-01T00:00:00Z"));

    const list = listEventAttempts("ev1");
    expect(list.map((a) => a.matchId)).toEqual(["m2", "m3", "m1"]);
  });

  it("caps at 50 entries", () => {
    for (let i = 0; i < 55; i++) {
      upsertEventAttempt(makeAttempt("ev1", `m${i}`, `2025-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`));
    }
    const list = listEventAttempts("ev1");
    expect(list.length).toBeLessThanOrEqual(50);
  });
});

/* ------------------------------------------------------------------ */
/* hasEventAttempt                                                     */
/* ------------------------------------------------------------------ */

describe("hasEventAttempt", () => {
  it("returns false for empty eventId", () => {
    expect(hasEventAttempt("", "m1")).toBe(false);
  });

  it("returns false for empty matchId", () => {
    expect(hasEventAttempt("ev1", "")).toBe(false);
  });

  it("returns true when exists", () => {
    upsertEventAttempt(makeAttempt("ev1", "m1"));
    expect(hasEventAttempt("ev1", "m1")).toBe(true);
  });

  it("returns false when not exists", () => {
    expect(hasEventAttempt("ev1", "missing")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* upsertEventAttempt                                                  */
/* ------------------------------------------------------------------ */

describe("upsertEventAttempt", () => {
  it("inserts new attempt", () => {
    upsertEventAttempt(makeAttempt("ev1", "m1"));
    expect(listEventAttempts("ev1")).toHaveLength(1);
  });

  it("updates existing by matchId", () => {
    upsertEventAttempt(makeAttempt("ev1", "m1"));
    const updated = makeAttempt("ev1", "m1");
    updated.winner = 1;
    upsertEventAttempt(updated);

    const list = listEventAttempts("ev1");
    expect(list).toHaveLength(1);
    expect(list[0].winner).toBe(1);
  });

  it("no-op when eventId empty", () => {
    const attempt = makeAttempt("", "m1");
    upsertEventAttempt(attempt);
    // nothing stored since eventId is empty
    expect(mockStorage.getItem("nyano_triad_event_attempts_v1")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* deleteEventAttempt                                                  */
/* ------------------------------------------------------------------ */

describe("deleteEventAttempt", () => {
  it("removes by id", () => {
    upsertEventAttempt(makeAttempt("ev1", "m1"));
    upsertEventAttempt(makeAttempt("ev1", "m2"));
    expect(listEventAttempts("ev1")).toHaveLength(2);

    deleteEventAttempt("ev1", "m1");
    const list = listEventAttempts("ev1");
    expect(list).toHaveLength(1);
    expect(list[0].matchId).toBe("m2");
  });

  it("no-op for nonexistent", () => {
    upsertEventAttempt(makeAttempt("ev1", "m1"));
    deleteEventAttempt("ev1", "missing");
    expect(listEventAttempts("ev1")).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* clearEventAttempts                                                  */
/* ------------------------------------------------------------------ */

describe("clearEventAttempts", () => {
  it("clears all for eventId", () => {
    upsertEventAttempt(makeAttempt("ev1", "m1"));
    upsertEventAttempt(makeAttempt("ev1", "m2"));
    clearEventAttempts("ev1");
    expect(listEventAttempts("ev1")).toEqual([]);
  });

  it("does not affect other eventIds", () => {
    upsertEventAttempt(makeAttempt("ev1", "m1"));
    upsertEventAttempt(makeAttempt("ev2", "m2"));
    clearEventAttempts("ev1");
    expect(listEventAttempts("ev1")).toEqual([]);
    expect(listEventAttempts("ev2")).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* listAllEventAttempts / clearAllEventAttempts                        */
/* ------------------------------------------------------------------ */

describe("listAllEventAttempts", () => {
  it("returns merged attempts sorted by createdAt desc", () => {
    upsertEventAttempt(makeAttempt("ev1", "a", "2025-01-01T00:00:00Z"));
    upsertEventAttempt(makeAttempt("ev2", "b", "2025-03-01T00:00:00Z"));
    upsertEventAttempt(makeAttempt("ev1", "c", "2025-02-01T00:00:00Z"));

    const list = listAllEventAttempts();
    expect(list.map((a) => a.matchId)).toEqual(["b", "c", "a"]);
  });
});

describe("clearAllEventAttempts", () => {
  it("clears storage for all events", () => {
    upsertEventAttempt(makeAttempt("ev1", "m1"));
    upsertEventAttempt(makeAttempt("ev2", "m2"));
    expect(listAllEventAttempts()).toHaveLength(2);

    clearAllEventAttempts();
    expect(listAllEventAttempts()).toEqual([]);
    expect(mockStorage.getItem("nyano_triad_event_attempts_v1")).toBeNull();
  });
});
