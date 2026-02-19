import { describe, expect, it, vi } from "vitest";
import type { TranscriptV1 } from "@nyano/triad-engine";
import { resolveMatchShareQrUrl } from "@/features/match/matchShareQr";

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

describe("features/match/MatchShareQrCode", () => {
  it("returns null while transcript is unavailable", () => {
    const actual = resolveMatchShareQrUrl({
      transcript: null,
      cards: null,
    });
    expect(actual).toBeNull();
  });

  it("builds replay share URL with fixed step and absolute mode", () => {
    const buildReplayShareUrl = vi.fn(() => "https://example.invalid/replay?t=abc");
    const transcript = makeTranscript();
    const cards = new Map<bigint, never>();

    const actual = resolveMatchShareQrUrl(
      {
        transcript,
        cards,
        eventId: "event-1",
        ui: "mint",
        rulesetKey: "v2",
        classicMask: "open_3",
      },
      { buildReplayShareUrl },
    );

    expect(actual).toBe("https://example.invalid/replay?t=abc");
    expect(buildReplayShareUrl).toHaveBeenCalledWith({
      transcript,
      cards,
      step: 9,
      eventId: "event-1",
      ui: "mint",
      rulesetKey: "v2",
      classicMask: "open_3",
      absolute: true,
    });
  });
});
