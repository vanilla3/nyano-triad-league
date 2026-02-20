import { describe, expect, it } from "vitest";
import type { TranscriptV1 } from "@nyano/triad-engine";
import {
  buildReplayShareLink,
  resolveReplayShareJson,
} from "@/features/match/replayShareLinks";

function makeTranscript(): TranscriptV1 {
  return {
    header: {
      version: 1,
      rulesetId: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      seasonId: 1,
      playerA: "0x0000000000000000000000000000000000000001",
      playerB: "0x0000000000000000000000000000000000000002",
      deckA: [1n, 2n, 3n, 4n, 5n],
      deckB: [6n, 7n, 8n, 9n, 10n],
      firstPlayer: 0,
      deadline: 0,
      salt: "0x00",
    },
    turns: [{ cell: 0, cardIndex: 0 }],
  };
}

describe("features/match/replayShareLinks", () => {
  it("returns trimmed raw JSON text when provided", () => {
    expect(resolveReplayShareJson({
      text: "  {\"foo\":1}  ",
      transcript: makeTranscript(),
      emptyError: "empty",
    })).toBe("{\"foo\":1}");
  });

  it("falls back to transcript JSON when text is empty", () => {
    const json = resolveReplayShareJson({
      text: "   ",
      transcript: makeTranscript(),
      emptyError: "empty",
    });
    const parsed = JSON.parse(json) as { header: { rulesetId: string } };
    expect(parsed.header.rulesetId).toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("throws caller-provided error when both text and transcript are missing", () => {
    expect(() => resolveReplayShareJson({
      text: " ",
      transcript: null,
      emptyError: "no replay json",
    })).toThrow("no replay json");
  });

  it("builds replay share link with forwarded params", () => {
    let capturedJson = "";
    let capturedBuildUrlInput: Record<string, unknown> | null = null;
    const url = buildReplayShareLink(
      {
        text: "{\"foo\":1}",
        transcript: null,
        emptyError: "empty",
        eventId: "evt_1",
        pointsDeltaA: -12,
        mode: "compare",
        ui: "mint",
        rulesetKey: "classic_custom",
        classicMask: "1z",
        step: 5,
        absolute: true,
      },
      {
        buildReplayShareDataPayload: (json) => {
          capturedJson = json;
          return { key: "t", value: "encoded" };
        },
        buildReplayShareUrl: (input) => {
          capturedBuildUrlInput = input as unknown as Record<string, unknown>;
          return "https://example.invalid/replay?t=encoded";
        },
      },
    );

    expect(url).toBe("https://example.invalid/replay?t=encoded");
    expect(capturedJson).toBe("{\"foo\":1}");
    expect(capturedBuildUrlInput).toMatchObject({
      eventId: "evt_1",
      pointsDeltaA: -12,
      mode: "compare",
      ui: "mint",
      rulesetKey: "classic_custom",
      classicMask: "1z",
      step: 5,
      absolute: true,
    });
  });
});
