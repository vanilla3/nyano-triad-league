import { describe, it, expect, vi, afterEach } from "vitest";
import { EVENTS, getEventById, getEventStatus, formatEventPeriod, fetchEventConfig, isValidEventV1, type EventV1 } from "../events";

/* ------------------------------------------------------------------ */
/* Helper                                                              */
/* ------------------------------------------------------------------ */

function makeEvent(overrides: Partial<EventV1> = {}): EventV1 {
  return {
    id: "test",
    title: "Test",
    description: "desc",
    kind: "nyano_ai_challenge",
    rulesetKey: "v1",
    seasonId: 1,
    firstPlayer: 0,
    aiDifficulty: "normal",
    nyanoDeckTokenIds: ["1", "2", "3", "4", "5"],
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* getEventStatus                                                      */
/* ------------------------------------------------------------------ */

describe("getEventStatus", () => {
  const NOW = Date.parse("2025-06-01T00:00:00Z");

  it('returns "always" when no dates', () => {
    expect(getEventStatus(makeEvent(), NOW)).toBe("always");
  });

  it('returns "upcoming" when now < startAt', () => {
    const e = makeEvent({ startAt: "2025-07-01T00:00:00Z" });
    expect(getEventStatus(e, NOW)).toBe("upcoming");
  });

  it('returns "active" when startAt ≤ now ≤ endAt', () => {
    const e = makeEvent({ startAt: "2025-01-01T00:00:00Z", endAt: "2025-12-31T00:00:00Z" });
    expect(getEventStatus(e, NOW)).toBe("active");
  });

  it('returns "ended" when now > endAt', () => {
    const e = makeEvent({ endAt: "2025-01-01T00:00:00Z" });
    expect(getEventStatus(e, NOW)).toBe("ended");
  });

  it('returns "active" when startAt passed, no endAt', () => {
    const e = makeEvent({ startAt: "2025-01-01T00:00:00Z" });
    expect(getEventStatus(e, NOW)).toBe("active");
  });

  it('returns "active" when no startAt, endAt in future', () => {
    const e = makeEvent({ endAt: "2025-12-31T00:00:00Z" });
    expect(getEventStatus(e, NOW)).toBe("active");
  });

  it('treats invalid ISO string as null (→ "always")', () => {
    const e = makeEvent({ startAt: "not-a-date", endAt: "also-bad" });
    expect(getEventStatus(e, NOW)).toBe("always");
  });
});

/* ------------------------------------------------------------------ */
/* getEventById                                                        */
/* ------------------------------------------------------------------ */

describe("getEventById", () => {
  it('finds known event "nyano-open-challenge"', () => {
    const e = getEventById("nyano-open-challenge");
    expect(e).not.toBeNull();
    expect(e!.id).toBe("nyano-open-challenge");
  });

  it("returns null for unknown id", () => {
    expect(getEventById("nonexistent")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* formatEventPeriod                                                   */
/* ------------------------------------------------------------------ */

describe("formatEventPeriod", () => {
  it('"Always" when no dates', () => {
    expect(formatEventPeriod(makeEvent())).toBe("Always");
  });

  it('"From ..." when only startAt', () => {
    const e = makeEvent({ startAt: "2025-06-01" });
    expect(formatEventPeriod(e)).toBe("From 2025-06-01");
  });

  it('"Until ..." when only endAt', () => {
    const e = makeEvent({ endAt: "2025-12-31" });
    expect(formatEventPeriod(e)).toBe("Until 2025-12-31");
  });

  it('"start → end" when both dates', () => {
    const e = makeEvent({ startAt: "2025-06-01", endAt: "2025-12-31" });
    expect(formatEventPeriod(e)).toBe("2025-06-01 → 2025-12-31");
  });
});

/* ------------------------------------------------------------------ */
/* EVENTS (hardcoded array)                                            */
/* ------------------------------------------------------------------ */

describe("EVENTS", () => {
  it("has at least 1 entry", () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(1);
  });

  it("every event has required fields", () => {
    for (const e of EVENTS) {
      expect(typeof e.id).toBe("string");
      expect(e.id.length).toBeGreaterThan(0);
      expect(typeof e.title).toBe("string");
      expect(typeof e.kind).toBe("string");
      expect(Array.isArray(e.nyanoDeckTokenIds)).toBe(true);
      expect(e.nyanoDeckTokenIds.length).toBe(5);
    }
  });
});

/* ------------------------------------------------------------------ */
/* fetchEventConfig                                                    */
/* ------------------------------------------------------------------ */

describe("fetchEventConfig", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns hardcoded EVENTS on network error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network error"));
    const result = await fetchEventConfig();
    expect(result.length).toBe(EVENTS.length);
    expect(result[0].id).toBe(EVENTS[0].id);
  });

  it("returns hardcoded EVENTS on 404 response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const result = await fetchEventConfig();
    expect(result.length).toBe(EVENTS.length);
  });

  it("returns hardcoded EVENTS on non-array response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ not: "an array" }),
    });
    const result = await fetchEventConfig();
    expect(result.length).toBe(EVENTS.length);
  });

  it("returns hardcoded EVENTS when all entries are invalid", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ bad: true }, { also: "bad" }]),
    });
    const result = await fetchEventConfig();
    expect(result.length).toBe(EVENTS.length);
  });

  it("returns fetched events on valid response", async () => {
    const mockEvents: EventV1[] = [makeEvent({ id: "fetched-event", title: "Fetched" })];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEvents),
    });
    const result = await fetchEventConfig();
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("fetched-event");
  });
});

/* ------------------------------------------------------------------ */
/* isValidEventV1 (P2-360)                                             */
/* ------------------------------------------------------------------ */

describe("isValidEventV1 (P2-360)", () => {
  it("accepts a valid event", () => {
    expect(isValidEventV1(makeEvent())).toBe(true);
  });

  it("accepts event with optional fields (startAt, endAt, tags)", () => {
    const e = makeEvent({
      startAt: "2025-06-01T00:00:00Z",
      endAt: "2025-12-31T00:00:00Z",
      tags: ["ai", "featured"],
    });
    expect(isValidEventV1(e)).toBe(true);
  });

  it("rejects empty id", () => {
    expect(isValidEventV1(makeEvent({ id: "" }))).toBe(false);
  });

  it("rejects unknown rulesetKey", () => {
    const e = { ...makeEvent(), rulesetKey: "v99" };
    expect(isValidEventV1(e)).toBe(false);
  });

  it("rejects nyanoDeckTokenIds of wrong length", () => {
    const e = { ...makeEvent(), nyanoDeckTokenIds: ["1", "2", "3"] };
    expect(isValidEventV1(e)).toBe(false);
  });

  it("rejects firstPlayer: 2", () => {
    const e = { ...makeEvent(), firstPlayer: 2 };
    expect(isValidEventV1(e)).toBe(false);
  });

  it('rejects aiDifficulty "impossible"', () => {
    const e = { ...makeEvent(), aiDifficulty: "impossible" };
    expect(isValidEventV1(e)).toBe(false);
  });

  it("rejects null", () => {
    expect(isValidEventV1(null)).toBe(false);
  });

  it("rejects non-object", () => {
    expect(isValidEventV1("string")).toBe(false);
  });

  it("rejects missing description", () => {
    const e = { ...makeEvent() };
    delete (e as Record<string, unknown>).description;
    expect(isValidEventV1(e)).toBe(false);
  });

  it('rejects wrong kind "other_challenge"', () => {
    const e = { ...makeEvent(), kind: "other_challenge" };
    expect(isValidEventV1(e)).toBe(false);
  });

  it("rejects non-integer seasonId", () => {
    const e = { ...makeEvent(), seasonId: 1.5 };
    expect(isValidEventV1(e)).toBe(false);
  });

  // ── New optional fields (Sprint 22) ──

  it("accepts event with voteTimeSeconds", () => {
    const e = makeEvent({ voteTimeSeconds: 30 });
    expect(isValidEventV1(e)).toBe(true);
  });

  it("rejects voteTimeSeconds <= 0", () => {
    const e = { ...makeEvent(), voteTimeSeconds: 0 };
    expect(isValidEventV1(e)).toBe(false);
  });

  it("accepts event with maxAttempts", () => {
    const e = makeEvent({ maxAttempts: 10 });
    expect(isValidEventV1(e)).toBe(true);
  });

  it("rejects non-integer maxAttempts", () => {
    const e = { ...makeEvent(), maxAttempts: 2.5 };
    expect(isValidEventV1(e)).toBe(false);
  });

  it("accepts event with deckRestriction", () => {
    const e = makeEvent({ deckRestriction: "mint_only" });
    expect(isValidEventV1(e)).toBe(true);
  });

  it("rejects empty deckRestriction", () => {
    const e = { ...makeEvent(), deckRestriction: "" };
    expect(isValidEventV1(e)).toBe(false);
  });
});
