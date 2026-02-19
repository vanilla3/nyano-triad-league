import { describe, expect, it } from "vitest";
import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import { stringifyWithBigInt } from "@/lib/json";
import {
  buildMatchReplayJson,
  buildMatchReplayShareUrl,
  buildMatchReplayShareUrlFromJson,
  buildReplayShareDataPayload,
} from "@/features/match/matchReplayShare";

function makeTranscript(): TranscriptV1 {
  return {
    header: {
      version: 1,
      rulesetId: `0x${"11".repeat(32)}` as `0x${string}`,
      seasonId: 1,
      playerA: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      playerB: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      deckA: [1n, 2n, 3n, 4n, 5n],
      deckB: [6n, 7n, 8n, 9n, 10n],
      firstPlayer: 0,
      deadline: 9999,
      salt: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    },
    turns: [{ cell: 4, cardIndex: 0 }],
  };
}

function makeCard(tokenId: bigint): CardData {
  return {
    tokenId,
    edges: { up: 1, right: 2, down: 3, left: 4 },
    jankenHand: 0,
    combatStatSum: 10,
    trait: "none",
  };
}

function makeCards(): Map<bigint, CardData> {
  return new Map<bigint, CardData>([
    [1n, makeCard(1n)],
    [2n, makeCard(2n)],
    [6n, makeCard(6n)],
    [7n, makeCard(7n)],
  ]);
}

describe("features/match/matchReplayShare", () => {
  it("uses compressed z payload when available", () => {
    const result = buildReplayShareDataPayload("{}", {
      compress: () => "zip_payload",
      encode: () => "unused",
    });
    expect(result).toEqual({ key: "z", value: "zip_payload" });
  });

  it("falls back to t payload when compression is unavailable", () => {
    const result = buildReplayShareDataPayload("{\"a\":1}", {
      compress: () => null,
      encode: (text) => `enc:${text}`,
    });
    expect(result).toEqual({ key: "t", value: "enc:{\"a\":1}" });
  });

  it("builds transcript-only JSON when cards are not loaded", () => {
    const transcript = makeTranscript();
    const json = buildMatchReplayJson({ transcript, cards: null });
    expect(json).toBe(stringifyWithBigInt(transcript, 0));
  });

  it("builds v2 replay bundle JSON when cards are available", () => {
    const json = buildMatchReplayJson({
      transcript: makeTranscript(),
      cards: makeCards(),
    });
    const parsed = JSON.parse(json) as { bundleVersion?: number; cards?: unknown[] };
    expect(parsed.bundleVersion).toBe(2);
    expect(Array.isArray(parsed.cards)).toBe(true);
    expect(parsed.cards?.length).toBeGreaterThan(0);
  });

  it("builds replay URL from JSON with expected params", () => {
    let captured: Record<string, unknown> | null = null;
    const url = buildMatchReplayShareUrlFromJson(
      {
        json: "{\"hello\":1}",
        step: 9,
        eventId: "evt_1",
        ui: "mint",
        rulesetKey: "classic_custom",
        classicMask: "1z",
        absolute: false,
      },
      {
        buildUrl: (opts) => {
          captured = opts as unknown as Record<string, unknown>;
          return "/replay?ok=1";
        },
        compress: () => "zip_payload",
      },
    );
    expect(url).toBe("/replay?ok=1");
    expect(captured).toMatchObject({
      data: { key: "z", value: "zip_payload" },
      step: 9,
      eventId: "evt_1",
      ui: "mint",
      rulesetKey: "classic_custom",
      classicMask: "1z",
      absolute: false,
    });
  });

  it("buildMatchReplayShareUrl composes JSON and URL builder in one call", () => {
    let captured: Record<string, unknown> | null = null;
    const url = buildMatchReplayShareUrl(
      {
        transcript: makeTranscript(),
        cards: makeCards(),
        step: 9,
        eventId: "evt_2",
        ui: "engine",
        rulesetKey: "v2",
        classicMask: "ab",
        absolute: true,
      },
      {
        buildUrl: (opts) => {
          captured = opts as unknown as Record<string, unknown>;
          return "https://example.invalid/replay";
        },
        compress: () => null,
        encode: (text) => text,
      },
    );
    expect(url).toBe("https://example.invalid/replay");
    const capturedPayload = captured as unknown as Record<string, unknown>;
    expect(capturedPayload).toBeTruthy();
    expect(capturedPayload["step"]).toBe(9);
    expect(capturedPayload["eventId"]).toBe("evt_2");
    expect(capturedPayload["ui"]).toBe("engine");
    expect(capturedPayload["rulesetKey"]).toBe("v2");
    expect(capturedPayload["classicMask"]).toBe("ab");
    expect(capturedPayload["absolute"]).toBe(true);

    const data = capturedPayload["data"] as { key: "z" | "t"; value: string };
    expect(data.key).toBe("t");
    const parsed = JSON.parse(data.value) as { bundleVersion?: number };
    expect(parsed.bundleVersion).toBe(2);
  });
});
