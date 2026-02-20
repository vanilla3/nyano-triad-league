import { describe, expect, it } from "vitest";
import type { CardData, MatchResultWithHistory, TranscriptV1 } from "@nyano/triad-engine";
import {
  REPLAY_INPUT_PROMPT_ERROR,
  buildReplaySimErrorState,
  buildReplaySimSuccessState,
} from "@/features/match/replaySimState";

function makeTranscript(): TranscriptV1 {
  return {
    header: {
      version: 1,
      rulesetId: "0x01",
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

function makeResult(matchId: string): MatchResultWithHistory {
  return {
    winner: 0,
    tiles: { A: 6, B: 3 },
    matchId,
    turns: [{ cell: 0, cardIndex: 0 }],
    boardHistory: [Array.from({ length: 9 }, () => null)],
  } as unknown as MatchResultWithHistory;
}

describe("features/match/replaySimState", () => {
  it("exposes replay input prompt error constant", () => {
    expect(REPLAY_INPUT_PROMPT_ERROR).toContain("transcript JSON");
  });

  it("builds error state shape", () => {
    expect(buildReplaySimErrorState("decode failed")).toEqual({
      ok: false,
      error: "decode failed",
    });
  });

  it("builds success state shape", () => {
    const transcript = makeTranscript();
    const cards = new Map<bigint, CardData>();
    const owners = new Map<bigint, `0x${string}`>();
    const current = makeResult("current");
    const v1 = makeResult("v1");
    const v2 = makeResult("v2");

    const state = buildReplaySimSuccessState({
      transcript,
      cards,
      owners,
      currentRulesetLabel: "label",
      resolvedRuleset: null,
      rulesetIdMismatchWarning: "warn",
      current,
      v1,
      v2,
    });

    expect(state).toEqual({
      ok: true,
      transcript,
      cards,
      owners,
      currentRulesetLabel: "label",
      resolvedRuleset: null,
      rulesetIdMismatchWarning: "warn",
      current,
      v1,
      v2,
    });
  });
});
