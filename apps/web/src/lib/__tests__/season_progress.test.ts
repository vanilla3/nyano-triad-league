import { describe, expect, it } from "vitest";
import type { SeasonArchiveSummary } from "../season_archive";
import {
  buildSeasonProgressSummary,
  formatSeasonProgressMarkdown,
  DEFAULT_SEASON_SCORING_RULE,
  DEFAULT_SEASON_REWARD_TIERS,
} from "../season_progress";

function makeSeason(overrides: Partial<SeasonArchiveSummary> = {}): SeasonArchiveSummary {
  return {
    seasonId: 1,
    totalAttempts: 5,
    totalWins: 3,
    totalLosses: 2,
    winRatePercent: 60,
    latestAttemptAt: "2026-02-12T00:00:00.000Z",
    events: [
      {
        eventId: "event-a",
        eventTitle: "Event A",
        status: "active",
        attemptCount: 3,
        winCount: 2,
        lossCount: 1,
        winRatePercent: 66.7,
        bestTileDiff: 3,
        latestAttemptAt: "2026-02-12T00:00:00.000Z",
        latestReplayUrl: "https://example.com/a",
        pointsDeltaTotal: null,
        pointsDeltaAttemptCount: 0,
        pointsDeltaCoveragePercent: 0,
      },
      {
        eventId: "event-b",
        eventTitle: "Event B",
        status: "active",
        attemptCount: 2,
        winCount: 0,
        lossCount: 2,
        winRatePercent: 0,
        bestTileDiff: -2,
        latestAttemptAt: "2026-02-11T00:00:00.000Z",
        latestReplayUrl: "https://example.com/b",
        pointsDeltaTotal: null,
        pointsDeltaAttemptCount: 0,
        pointsDeltaCoveragePercent: 0,
      },
    ],
    ...overrides,
  };
}

describe("buildSeasonProgressSummary", () => {
  it("computes points with deterministic ranking and tier progress", () => {
    const season = makeSeason();
    const progress = buildSeasonProgressSummary(season);

    // Event A: 2*3 + 1*1 + clear bonus 2 = 9
    // Event B: 0*3 + 2*1 + clear bonus 0 = 2
    expect(progress.totalPoints).toBe(11);
    expect(progress.clearCount).toBe(1);
    expect(progress.currentTier.id).toBe("rookie");
    expect(progress.nextTier?.id).toBe("bronze");
    expect(progress.pointsToNextTier).toBe(1);
    expect(progress.progressToNextTier).toBeCloseTo(11 / 12, 5);
    expect(progress.pointsDeltaEvents).toBe(0);
    expect(progress.provisionalEvents).toBe(2);
    expect(progress.rankedEvents.map((x) => `${x.rank}:${x.eventId}:${x.points}`)).toEqual([
      "1:event-a:9",
      "2:event-b:2",
    ]);
    expect(progress.rankedEvents.map((x) => x.pointsSource)).toEqual(["provisional", "provisional"]);
  });

  it("resolves max tier and no next-tier requirement", () => {
    const season = makeSeason({
      events: [
        {
          eventId: "event-max",
          eventTitle: "Event Max",
          status: "active",
          attemptCount: 40,
          winCount: 30,
          lossCount: 10,
          winRatePercent: 75,
          bestTileDiff: 5,
          latestAttemptAt: "2026-02-13T00:00:00.000Z",
          latestReplayUrl: "https://example.com/max",
          pointsDeltaTotal: null,
          pointsDeltaAttemptCount: 0,
          pointsDeltaCoveragePercent: 0,
        },
      ],
    });
    const progress = buildSeasonProgressSummary(season);
    expect(progress.totalPoints).toBe(102);
    expect(progress.currentTier.id).toBe("legend");
    expect(progress.nextTier).toBeNull();
    expect(progress.pointsToNextTier).toBe(0);
    expect(progress.progressToNextTier).toBe(1);
  });

  it("uses latestAttemptAt and eventId as deterministic tie-break", () => {
    const season = makeSeason({
      events: [
        {
          eventId: "event-b",
          eventTitle: "Event B",
          status: "active",
          attemptCount: 1,
          winCount: 1,
          lossCount: 0,
          winRatePercent: 100,
          bestTileDiff: 1,
          latestAttemptAt: "2026-02-10T00:00:00.000Z",
          latestReplayUrl: null,
          pointsDeltaTotal: null,
          pointsDeltaAttemptCount: 0,
          pointsDeltaCoveragePercent: 0,
        },
        {
          eventId: "event-a",
          eventTitle: "Event A",
          status: "active",
          attemptCount: 1,
          winCount: 1,
          lossCount: 0,
          winRatePercent: 100,
          bestTileDiff: 1,
          latestAttemptAt: "2026-02-10T00:00:00.000Z",
          latestReplayUrl: null,
          pointsDeltaTotal: null,
          pointsDeltaAttemptCount: 0,
          pointsDeltaCoveragePercent: 0,
        },
      ],
    });
    const progress = buildSeasonProgressSummary(season);
    expect(progress.rankedEvents.map((x) => x.eventId)).toEqual(["event-a", "event-b"]);
  });

  it("uses pointsDelta when an event has full delta coverage", () => {
    const season = makeSeason({
      events: [
        {
          eventId: "event-delta",
          eventTitle: "Event Delta",
          status: "active",
          attemptCount: 2,
          winCount: 1,
          lossCount: 1,
          winRatePercent: 50,
          bestTileDiff: 2,
          latestAttemptAt: "2026-02-12T00:00:00.000Z",
          latestReplayUrl: null,
          pointsDeltaTotal: 14,
          pointsDeltaAttemptCount: 2,
          pointsDeltaCoveragePercent: 100,
        },
      ],
    });
    const progress = buildSeasonProgressSummary(season);
    expect(progress.totalPoints).toBe(14);
    expect(progress.rankedEvents[0]?.pointsSource).toBe("points_delta");
    expect(progress.pointsDeltaEvents).toBe(1);
    expect(progress.provisionalEvents).toBe(0);
  });

  it("keeps provisional scoring when pointsDelta coverage is partial", () => {
    const season = makeSeason({
      events: [
        {
          eventId: "event-partial",
          eventTitle: "Event Partial",
          status: "active",
          attemptCount: 2,
          winCount: 1,
          lossCount: 1,
          winRatePercent: 50,
          bestTileDiff: 1,
          latestAttemptAt: "2026-02-12T00:00:00.000Z",
          latestReplayUrl: null,
          pointsDeltaTotal: 10,
          pointsDeltaAttemptCount: 1,
          pointsDeltaCoveragePercent: 50,
        },
      ],
    });
    const progress = buildSeasonProgressSummary(season);
    expect(progress.totalPoints).toBe(6);
    expect(progress.rankedEvents[0]?.pointsSource).toBe("provisional");
    expect(progress.pointsDeltaEvents).toBe(0);
    expect(progress.provisionalEvents).toBe(1);
  });
});

describe("formatSeasonProgressMarkdown", () => {
  it("formats points/tier summary and ranking table", () => {
    const progress = buildSeasonProgressSummary(
      makeSeason(),
      DEFAULT_SEASON_SCORING_RULE,
      DEFAULT_SEASON_REWARD_TIERS,
    );
    const md = formatSeasonProgressMarkdown(progress);
    expect(md).toContain("### Local season progress (provisional)");
    expect(md).toContain("- Tier: Rookie");
    expect(md).toContain("| # | Event | Points | Source | W/L | Win rate | Clear |");
    expect(md).toContain("| 1 | Event A |");
  });
});
