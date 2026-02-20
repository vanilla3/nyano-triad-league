import { describe, expect, it } from "vitest";
import {
  assertReplayAttemptCanBeSaved,
  buildReplayEventAttempt,
} from "@/features/match/replayEventAttempts";

describe("features/match/replayEventAttempts", () => {
  it("rejects save when event id is missing", () => {
    expect(() => assertReplayAttemptCanBeSaved({
      eventId: "",
      replayReady: true,
      winner: 0,
    })).toThrow("eventId がありません");
  });

  it("rejects save when replay is not ready", () => {
    expect(() => assertReplayAttemptCanBeSaved({
      eventId: "evt_1",
      replayReady: false,
      winner: 0,
    })).toThrow("replay が未準備です");
  });

  it("rejects draw result for event attempts", () => {
    expect(() => assertReplayAttemptCanBeSaved({
      eventId: "evt_1",
      replayReady: true,
      winner: -1,
    })).toThrow("引き分けは event attempts の対象外です");
  });

  it("builds event attempt payload with optional points delta fields", () => {
    const attempt = buildReplayEventAttempt({
      createdAtIso: "2026-02-20T00:00:00.000Z",
      eventId: "evt_1",
      replayUrl: "https://example.invalid/replay?z=abc",
      matchId: "match_1",
      winner: 0,
      tilesA: 6,
      tilesB: 3,
      rulesetLabel: "Core Tactics v1",
      deckA: [1n, 2n],
      deckB: [3n, 4n],
      pointsDeltaA: 12,
    });

    expect(attempt).toEqual({
      id: "match_1",
      createdAt: "2026-02-20T00:00:00.000Z",
      eventId: "evt_1",
      replayUrl: "https://example.invalid/replay?z=abc",
      matchId: "match_1",
      winner: 0,
      tilesA: 6,
      tilesB: 3,
      rulesetLabel: "Core Tactics v1",
      deckA: ["1", "2"],
      deckB: ["3", "4"],
      pointsDeltaA: 12,
      pointsDeltaSource: "settled_attested",
    });
  });

  it("omits points delta metadata when points are not available", () => {
    const attempt = buildReplayEventAttempt({
      createdAtIso: "2026-02-20T00:00:00.000Z",
      eventId: "evt_1",
      replayUrl: "https://example.invalid/replay?z=abc",
      matchId: "match_1",
      winner: 1,
      tilesA: 4,
      tilesB: 5,
      rulesetLabel: "Core Tactics v2",
      deckA: [1n],
      deckB: [2n],
      pointsDeltaA: null,
    });

    expect(attempt.pointsDeltaA).toBeUndefined();
    expect(attempt.pointsDeltaSource).toBeUndefined();
  });
});
