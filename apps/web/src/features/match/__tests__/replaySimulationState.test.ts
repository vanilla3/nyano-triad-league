import { describe, expect, it, vi } from "vitest";
import type { CardData, MatchResultWithHistory, RulesetConfig, TranscriptV1 } from "@nyano/triad-engine";
import { resolveReplaySimulationState } from "@/features/match/replaySimulationState";

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

function makeCards(): Map<bigint, CardData> {
  return new Map<bigint, CardData>([
    [1n, { tokenId: 1n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 4, trait: "none" }],
  ]);
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

describe("features/match/replaySimulationState", () => {
  it("wires ruleset context, simulations, and current-result resolver", () => {
    const transcript = makeTranscript();
    const cards = makeCards();
    const rulesetById = { version: 2 } as unknown as RulesetConfig;
    const fallbackRulesetFromParams = { version: 1 } as unknown as RulesetConfig;
    const v1 = makeResult("v1");
    const v2 = makeResult("v2");
    const resolved = makeResult("resolved");
    const current = makeResult("current");

    const resolveReplayRulesetContextSpy = vi.fn(() => ({
      resolvedReplayRuleset: rulesetById,
      useResolvedRuleset: true,
      effectiveMode: "auto",
      rulesetIdMismatchWarning: "warn",
    }));
    const simulateSpy = vi
      .fn()
      .mockReturnValueOnce(v1)
      .mockReturnValueOnce(v2)
      .mockReturnValueOnce(resolved);
    const resolveReplayCurrentResultSpy = vi.fn(() => ({
      current,
      currentRulesetLabel: "label",
    }));
    const rulesetLabelFromConfigSpy = vi
      .fn()
      .mockReturnValueOnce("v1-label")
      .mockReturnValueOnce("v2-label");
    const rulesetLabelFromRegistryConfigSpy = vi.fn(() => "registry-label");
    const rulesetLabelFromUrlFallbackSpy = vi.fn(() => "fallback-label");

    const state = resolveReplaySimulationState(
      {
        transcript,
        cards,
        mode: "auto",
        rulesetById,
        fallbackRulesetFromParams,
      },
      {
        resolveReplayRulesetContext: resolveReplayRulesetContextSpy as never,
        simulateMatchV1WithHistory: simulateSpy as never,
        resolveReplayCurrentResult: resolveReplayCurrentResultSpy as never,
        rulesetLabelFromConfig: rulesetLabelFromConfigSpy as never,
        rulesetLabelFromRegistryConfig: rulesetLabelFromRegistryConfigSpy as never,
        rulesetLabelFromUrlFallback: rulesetLabelFromUrlFallbackSpy as never,
      },
    );

    expect(resolveReplayRulesetContextSpy).toHaveBeenCalledWith({
      mode: "auto",
      transcriptRulesetId: transcript.header.rulesetId,
      rulesetById,
      fallbackRulesetFromParams,
    });
    expect(simulateSpy).toHaveBeenCalledTimes(3);
    expect(resolveReplayCurrentResultSpy).toHaveBeenCalledWith(expect.objectContaining({
      useResolvedRuleset: true,
      byResolvedRuleset: resolved,
      rulesetById,
      v1,
      v2,
      v1Label: "v1-label",
      v2Label: "v2-label",
      compareLabel: "比較表示 v1 vs v2",
    }));
    expect(state).toMatchObject({
      currentRulesetLabel: "label",
      resolvedRuleset: rulesetById,
      rulesetIdMismatchWarning: "warn",
      current,
      v1,
      v2,
    });
  });
});
