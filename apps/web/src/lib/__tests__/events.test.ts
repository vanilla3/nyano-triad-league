import { describe, it, expect } from "vitest";
import { getEventById, getEventStatus, formatEventPeriod, type EventV1 } from "../events";

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
