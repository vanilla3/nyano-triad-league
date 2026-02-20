import { describe, expect, it, vi } from "vitest";
import type { CardData, MatchResultWithHistory, RulesetConfig, TranscriptV1 } from "@nyano/triad-engine";
import { runReplayLoadAction } from "@/features/match/replayLoadAction";

function makeTranscript(rulesetId: `0x${string}` = "0x01"): TranscriptV1 {
  return {
    header: {
      version: 1,
      rulesetId,
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
    boardHistory: [Array.from({ length: 9 }, () => null), Array.from({ length: 9 }, () => null)],
  } as unknown as MatchResultWithHistory;
}

describe("features/match/replayLoadAction", () => {
  it("throws when resolved input text is empty", async () => {
    await expect(runReplayLoadAction(
      {
        text: "   ",
        mode: "auto",
        searchParams: new URLSearchParams(),
      },
      {
        parseReplayPayload: vi.fn(),
      } as never,
    )).rejects.toThrow("transcript JSON が空です");
  });

  it("wires parse/ruleset/cards/simulation and returns start step", async () => {
    const transcript = makeTranscript("0xaaa");
    const parsed = { version: 1, transcript } as const;
    const rulesetById = { version: 2 } as unknown as RulesetConfig;
    const fallback = { version: 1 } as unknown as RulesetConfig;
    const cards = new Map<bigint, CardData>();
    const owners = new Map<bigint, `0x${string}`>();
    const current = makeResult("current");
    const v1 = makeResult("v1");
    const v2 = makeResult("v2");

    const parseReplayPayloadSpy = vi.fn(() => parsed);
    const resolveReplayRulesetFromParamsSpy = vi.fn(() => fallback);
    const resolveRulesetByIdSpy = vi.fn(() => rulesetById);
    const resolveReplayCardsFromPayloadSpy = vi.fn().mockResolvedValue({ cards, owners });
    const resolveReplaySimulationStateSpy = vi.fn(() => ({
      currentRulesetLabel: "label",
      resolvedRuleset: rulesetById,
      rulesetIdMismatchWarning: "warn",
      current,
      v1,
      v2,
    }));
    const clampIntSpy = vi.fn(() => 3);

    const result = await runReplayLoadAction(
      {
        text: "{\"dummy\":1}",
        mode: "auto",
        searchParams: new URLSearchParams("rk=classic_custom&cr=1z"),
        override: { text: "  {\"override\":1}  ", mode: "compare", step: 8 },
      },
      {
        parseReplayPayload: parseReplayPayloadSpy as never,
        resolveReplayRulesetFromParams: resolveReplayRulesetFromParamsSpy as never,
        resolveRulesetById: resolveRulesetByIdSpy as never,
        resolveReplayCardsFromPayload: resolveReplayCardsFromPayloadSpy as never,
        resolveReplaySimulationState: resolveReplaySimulationStateSpy as never,
        clampInt: clampIntSpy as never,
      },
    );

    expect(parseReplayPayloadSpy).toHaveBeenCalledWith("{\"override\":1}");
    expect(resolveReplayRulesetFromParamsSpy).toHaveBeenCalledWith("classic_custom", "1z");
    expect(resolveRulesetByIdSpy).toHaveBeenCalledWith("0xaaa");
    expect(resolveReplayCardsFromPayloadSpy).toHaveBeenCalledWith({ parsed });
    expect(resolveReplaySimulationStateSpy).toHaveBeenCalledWith({
      transcript,
      cards,
      mode: "compare",
      rulesetById,
      fallbackRulesetFromParams: fallback,
    });
    expect(clampIntSpy).toHaveBeenCalledWith(8, 0, current.boardHistory.length - 1);
    expect(result).toMatchObject({
      transcript,
      cards,
      owners,
      currentRulesetLabel: "label",
      resolvedRuleset: rulesetById,
      rulesetIdMismatchWarning: "warn",
      current,
      v1,
      v2,
      startStep: 3,
    });
  });
});
