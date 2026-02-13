import { describe, it, expect } from "vitest";
import { buildSeasonArchiveSummaries, formatSeasonArchiveMarkdown } from "../season_archive";
import type { EventV1 } from "../events";
import type { EventAttemptV1 } from "../event_attempts";

function makeEvent(overrides: Partial<EventV1>): EventV1 {
  return {
    id: "ev-default",
    title: "Default Event",
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

function makeAttempt(overrides: Partial<EventAttemptV1>): EventAttemptV1 {
  return {
    id: "a1",
    createdAt: "2026-02-10T00:00:00.000Z",
    eventId: "ev-default",
    replayUrl: "https://example.com/replay",
    matchId: "0xmatch",
    winner: 0,
    tilesA: 6,
    tilesB: 3,
    rulesetLabel: "v2",
    deckA: ["1", "2", "3", "4", "5"],
    deckB: ["6", "7", "8", "9", "10"],
    ...overrides,
  };
}

describe("buildSeasonArchiveSummaries", () => {
  it("builds season summaries and includes zero-attempt events", () => {
    const events: EventV1[] = [
      makeEvent({ id: "ev-s1-a", title: "S1 A", seasonId: 1 }),
      makeEvent({ id: "ev-s1-b", title: "S1 B", seasonId: 1 }),
      makeEvent({ id: "ev-s2-a", title: "S2 A", seasonId: 2 }),
    ];
    const attempts: EventAttemptV1[] = [
      makeAttempt({ id: "x1", eventId: "ev-s1-a", winner: 0, tilesA: 5, tilesB: 4, createdAt: "2026-02-10T00:00:00.000Z" }),
      makeAttempt({ id: "x2", eventId: "ev-s1-a", winner: 1, tilesA: 3, tilesB: 6, createdAt: "2026-02-11T00:00:00.000Z" }),
      makeAttempt({ id: "x3", eventId: "ev-s2-a", winner: 0, tilesA: 7, tilesB: 2, pointsDeltaA: 8, createdAt: "2026-02-12T00:00:00.000Z" }),
    ];

    const seasons = buildSeasonArchiveSummaries(events, attempts, Date.parse("2026-02-12T12:00:00.000Z"));
    expect(seasons.map((s) => s.seasonId)).toEqual([2, 1]);

    const s2 = seasons[0];
    expect(s2.totalAttempts).toBe(1);
    expect(s2.totalWins).toBe(1);
    expect(s2.winRatePercent).toBe(100);
    expect(s2.latestAttemptAt).toBe("2026-02-12T00:00:00.000Z");
    expect(s2.events[0]?.pointsDeltaTotal).toBe(8);
    expect(s2.events[0]?.pointsDeltaAttemptCount).toBe(1);
    expect(s2.events[0]?.pointsDeltaCoveragePercent).toBe(100);

    const s1 = seasons[1];
    expect(s1.totalAttempts).toBe(2);
    expect(s1.totalWins).toBe(1);
    expect(s1.totalLosses).toBe(1);
    expect(s1.winRatePercent).toBe(50);
    expect(s1.events).toHaveLength(2);

    const s1A = s1.events.find((e) => e.eventId === "ev-s1-a");
    expect(s1A).toBeTruthy();
    expect(s1A?.attemptCount).toBe(2);
    expect(s1A?.bestTileDiff).toBe(1);
    expect(s1A?.pointsDeltaTotal).toBeNull();
    expect(s1A?.pointsDeltaAttemptCount).toBe(0);
    expect(s1A?.pointsDeltaCoveragePercent).toBe(0);

    const s1B = s1.events.find((e) => e.eventId === "ev-s1-b");
    expect(s1B).toBeTruthy();
    expect(s1B?.attemptCount).toBe(0);
    expect(s1B?.bestTileDiff).toBeNull();
    expect(s1B?.pointsDeltaTotal).toBeNull();
    expect(s1B?.pointsDeltaAttemptCount).toBe(0);
    expect(s1B?.pointsDeltaCoveragePercent).toBe(0);
  });
});

describe("formatSeasonArchiveMarkdown", () => {
  it("formats markdown table with season totals", () => {
    const [summary] = buildSeasonArchiveSummaries(
      [makeEvent({ id: "ev1", title: "Event One", seasonId: 1 })],
      [makeAttempt({ eventId: "ev1", winner: 0, tilesA: 6, tilesB: 3, createdAt: "2026-02-10T00:00:00.000Z" })],
      Date.parse("2026-02-12T00:00:00.000Z"),
    );

    const md = formatSeasonArchiveMarkdown(summary);
    expect(md).toContain("### Season 1 (local archive)");
    expect(md).toContain("| Event | Status | Attempts | Win rate | Best diff | Delta A | Delta cov | Latest |");
    expect(md).toContain("| Event One |");
    expect(md).toContain("Win rate: 100.0%");
  });
});
