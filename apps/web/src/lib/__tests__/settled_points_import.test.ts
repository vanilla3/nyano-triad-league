import { describe, expect, it } from "vitest";
import type { EventAttemptV1 } from "../event_attempts";
import {
  applySettledPointsToAttempts,
  parseSettledPointsImportJson,
  type NormalizedSettledPointsEvent,
} from "../settled_points_import";

function bytes32(fill: string): `0x${string}` {
  return `0x${fill.repeat(64)}` as `0x${string}`;
}

function makeSettled(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    matchId: bytes32("a"),
    rulesetId: bytes32("b"),
    seasonId: 1,
    playerA: "0x00000000000000000000000000000000000000a1",
    playerB: "0x00000000000000000000000000000000000000b2",
    winner: "0x00000000000000000000000000000000000000a1",
    tilesA: 6,
    tilesB: 3,
    pointsDeltaA: 12,
    pointsDeltaB: -12,
    replayHash: bytes32("c"),
    settledAt: 1_700_000_000,
    source: {
      chainId: 8453,
      blockNumber: 12_345,
      txHash: bytes32("d"),
      logIndex: 1,
    },
    ...overrides,
  };
}

function makeAttempt(matchId: string, winner: 0 | 1, tilesA: number, tilesB: number): EventAttemptV1 {
  return {
    id: matchId,
    createdAt: "2026-02-13T00:00:00.000Z",
    eventId: "nyano-open-challenge",
    replayUrl: "https://example.com/replay",
    matchId,
    winner,
    tilesA,
    tilesB,
    rulesetLabel: "v2",
    deckA: ["1", "2", "3", "4", "5"],
    deckB: ["6", "7", "8", "9", "10"],
  };
}

describe("parseSettledPointsImportJson", () => {
  it("parses settled event array", () => {
    const settled = makeSettled();
    const parsed = parseSettledPointsImportJson(JSON.stringify([settled]));
    expect(parsed.inputCount).toBe(1);
    expect(parsed.events).toHaveLength(1);
    expect(parsed.events[0]).toMatchObject({
      matchId: (settled.matchId as string).toLowerCase(),
      pointsDeltaA: 12,
      winner: 0,
      tilesA: 6,
      tilesB: 3,
    });
    expect(parsed.issues).toEqual([]);
  });

  it("parses records[].settled schema", () => {
    const settled = makeSettled({ pointsDeltaA: 8, pointsDeltaB: -8 });
    const payload = { records: [{ settled }] };
    const parsed = parseSettledPointsImportJson(JSON.stringify(payload));
    expect(parsed.events).toHaveLength(1);
    expect(parsed.events[0]?.pointsDeltaA).toBe(8);
    expect(parsed.issues).toEqual([]);
  });

  it("reports duplicate conflict for same matchId with different deltas", () => {
    const a = makeSettled({ pointsDeltaA: 6, pointsDeltaB: -6 });
    const b = makeSettled({ pointsDeltaA: 9, pointsDeltaB: -9 });
    const parsed = parseSettledPointsImportJson(JSON.stringify([a, b]));
    expect(parsed.events).toHaveLength(1);
    expect(parsed.issues.some((x) => x.code === "duplicate_conflict")).toBe(true);
  });
});

describe("applySettledPointsToAttempts", () => {
  it("updates matching attempt pointsDelta when winner/tiles are consistent", () => {
    const matchId = bytes32("e");
    const attempts = [makeAttempt(matchId, 0, 6, 3)];
    const settledEvents: NormalizedSettledPointsEvent[] = [{
      matchId: matchId.toLowerCase(),
      pointsDeltaA: 11,
      winner: 0,
      tilesA: 6,
      tilesB: 3,
    }];

    const result = applySettledPointsToAttempts(attempts, settledEvents);
    expect(result.updatedCount).toBe(1);
    expect(result.matchedCount).toBe(1);
    expect(result.mismatchCount).toBe(0);
    expect(result.updatedMatchIds).toEqual([matchId.toLowerCase()]);
    expect(result.attempts[0]?.pointsDeltaA).toBe(11);
    expect(result.attempts[0]?.pointsDeltaSource).toBe("settled_attested");
  });

  it("skips update when winner mismatches", () => {
    const matchId = bytes32("f");
    const attempts = [makeAttempt(matchId, 0, 6, 3)];
    const settledEvents: NormalizedSettledPointsEvent[] = [{
      matchId: matchId.toLowerCase(),
      pointsDeltaA: 11,
      winner: 1,
      tilesA: 6,
      tilesB: 3,
    }];

    const result = applySettledPointsToAttempts(attempts, settledEvents);
    expect(result.updatedCount).toBe(0);
    expect(result.mismatchCount).toBe(1);
    expect(result.issues.some((x) => x.code === "winner_mismatch")).toBe(true);
    expect(result.attempts[0]?.pointsDeltaA).toBeUndefined();
  });

  it("counts missing local attempts when matchId is unknown", () => {
    const attempts = [makeAttempt(bytes32("1"), 0, 6, 3)];
    const settledEvents: NormalizedSettledPointsEvent[] = [{
      matchId: bytes32("2"),
      pointsDeltaA: 3,
      winner: 0,
      tilesA: 6,
      tilesB: 3,
    }];

    const result = applySettledPointsToAttempts(attempts, settledEvents);
    expect(result.noLocalAttemptCount).toBe(1);
    expect(result.updatedCount).toBe(0);
    expect(result.issues.some((x) => x.code === "no_local_attempt")).toBe(true);
  });
});
