import { describe, expect, it } from "vitest";
import type { MatchResultWithHistory, RulesetConfig } from "@nyano/triad-engine";
import { resolveReplayCurrentResult } from "@/features/match/replayResultSelection";

function makeResult(id: string): MatchResultWithHistory {
  return { id } as unknown as MatchResultWithHistory;
}

describe("features/match/replayResultSelection", () => {
  it("prefers resolved ruleset result with registry label when available", () => {
    const byResolved = makeResult("resolved");
    const rulesetById = { version: 2 } as unknown as RulesetConfig;
    const selected = resolveReplayCurrentResult({
      useResolvedRuleset: true,
      byResolvedRuleset: byResolved,
      resolvedReplayRuleset: { version: 2 } as unknown as RulesetConfig,
      rulesetById,
      effectiveMode: "v1",
      v1: makeResult("v1"),
      v2: makeResult("v2"),
      v1Label: "v1-label",
      v2Label: "v2-label",
      rulesetLabelFromRegistryConfigFn: () => "registry-label",
      rulesetLabelFromUrlFallbackFn: () => "fallback-label",
    });

    expect(selected.current).toBe(byResolved);
    expect(selected.currentRulesetLabel).toBe("registry-label");
  });

  it("uses URL fallback label when rulesetId mapping is unavailable", () => {
    const byResolved = makeResult("resolved");
    const selected = resolveReplayCurrentResult({
      useResolvedRuleset: true,
      byResolvedRuleset: byResolved,
      resolvedReplayRuleset: { version: 2 } as unknown as RulesetConfig,
      rulesetById: null,
      effectiveMode: "v1",
      v1: makeResult("v1"),
      v2: makeResult("v2"),
      v1Label: "v1-label",
      v2Label: "v2-label",
      rulesetLabelFromRegistryConfigFn: () => "registry-label",
      rulesetLabelFromUrlFallbackFn: () => "fallback-label",
    });

    expect(selected.current).toBe(byResolved);
    expect(selected.currentRulesetLabel).toBe("fallback-label");
  });

  it("switches to v2 selection when effective mode is v2", () => {
    const v2 = makeResult("v2");
    const selected = resolveReplayCurrentResult({
      useResolvedRuleset: false,
      byResolvedRuleset: null,
      resolvedReplayRuleset: null,
      rulesetById: null,
      effectiveMode: "v2",
      v1: makeResult("v1"),
      v2,
      v1Label: "v1-label",
      v2Label: "v2-label",
      rulesetLabelFromRegistryConfigFn: () => "registry-label",
      rulesetLabelFromUrlFallbackFn: () => "fallback-label",
    });

    expect(selected.current).toBe(v2);
    expect(selected.currentRulesetLabel).toBe("v2-label");
  });

  it("returns compare label on compare mode and v1 fallback otherwise", () => {
    const v1 = makeResult("v1");
    const compare = resolveReplayCurrentResult({
      useResolvedRuleset: false,
      byResolvedRuleset: null,
      resolvedReplayRuleset: null,
      rulesetById: null,
      effectiveMode: "compare",
      v1,
      v2: makeResult("v2"),
      v1Label: "v1-label",
      v2Label: "v2-label",
      compareLabel: "compare-label",
      rulesetLabelFromRegistryConfigFn: () => "registry-label",
      rulesetLabelFromUrlFallbackFn: () => "fallback-label",
    });
    const v1Selected = resolveReplayCurrentResult({
      useResolvedRuleset: false,
      byResolvedRuleset: null,
      resolvedReplayRuleset: null,
      rulesetById: null,
      effectiveMode: "v1",
      v1,
      v2: makeResult("v2"),
      v1Label: "v1-label",
      v2Label: "v2-label",
      rulesetLabelFromRegistryConfigFn: () => "registry-label",
      rulesetLabelFromUrlFallbackFn: () => "fallback-label",
    });

    expect(compare).toEqual({ current: v1, currentRulesetLabel: "compare-label" });
    expect(v1Selected).toEqual({ current: v1, currentRulesetLabel: "v1-label" });
  });
});
