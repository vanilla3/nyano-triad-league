import { describe, expect, it } from "vitest";
import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import {
  buildMatchReplayLink,
  buildMatchSetupShareUrl,
  buildMatchShareTemplateMessage,
} from "@/features/match/matchShareLinks";

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

function card(tokenId: bigint): CardData {
  return {
    tokenId,
    edges: { up: 1, right: 2, down: 3, left: 4 },
    jankenHand: 0,
    combatStatSum: 10,
    trait: "none",
  };
}

describe("features/match/matchShareLinks", () => {
  it("builds setup share URL from pathname and query", () => {
    const url = buildMatchSetupShareUrl(
      {
        pathname: "/match",
        search: new URLSearchParams("ui=mint&rk=v2"),
      },
      { toAbsoluteUrl: (path) => `https://example.invalid/${path}` },
    );
    expect(url).toBe("https://example.invalid/match?ui=mint&rk=v2");
  });

  it("builds setup share URL without query", () => {
    const url = buildMatchSetupShareUrl(
      {
        pathname: "/match",
        search: "",
      },
      { toAbsoluteUrl: (path) => `https://example.invalid/${path}` },
    );
    expect(url).toBe("https://example.invalid/match");
  });

  it("returns null replay link when transcript is unavailable", () => {
    const url = buildMatchReplayLink({
      transcript: null,
      cards: null,
    });
    expect(url).toBeNull();
  });

  it("builds replay link with forwarded share params", () => {
    let captured: Record<string, unknown> | null = null;
    const url = buildMatchReplayLink(
      {
        transcript: makeTranscript(),
        cards: new Map<bigint, CardData>([[1n, card(1n)]]),
        eventId: "evt_1",
        ui: "mint",
        rulesetKey: "classic_custom",
        classicMask: "1z",
        absolute: true,
      },
      {
        buildReplayShareUrl: (input) => {
          captured = input as unknown as Record<string, unknown>;
          return "https://example.invalid/replay";
        },
      },
    );
    expect(url).toBe("https://example.invalid/replay");
    const payload = captured as unknown as Record<string, unknown>;
    expect(payload["step"]).toBe(9);
    expect(payload["eventId"]).toBe("evt_1");
    expect(payload["ui"]).toBe("mint");
    expect(payload["rulesetKey"]).toBe("classic_custom");
    expect(payload["classicMask"]).toBe("1z");
    expect(payload["absolute"]).toBe(true);
  });

  it("builds share template text", () => {
    expect(buildMatchShareTemplateMessage("https://example.invalid/replay")).toBe(
      "Nyano Triad Replay\nhttps://example.invalid/replay",
    );
  });
});
