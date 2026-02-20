import type { MatchResultWithHistory, RulesetConfig } from "@nyano/triad-engine";
import type { ReplayMode } from "@/features/match/replayModeParams";

export function resolveReplayCurrentResult(input: {
  useResolvedRuleset: boolean;
  byResolvedRuleset: MatchResultWithHistory | null;
  resolvedReplayRuleset: RulesetConfig | null;
  rulesetById: RulesetConfig | null;
  effectiveMode: ReplayMode;
  v1: MatchResultWithHistory;
  v2: MatchResultWithHistory;
  v1Label: string;
  v2Label: string;
  compareLabel?: string;
  rulesetLabelFromRegistryConfigFn: (cfg: RulesetConfig) => string;
  rulesetLabelFromUrlFallbackFn: (cfg: RulesetConfig) => string;
}): {
  current: MatchResultWithHistory;
  currentRulesetLabel: string;
} {
  if (input.useResolvedRuleset && input.byResolvedRuleset && input.resolvedReplayRuleset) {
    return {
      current: input.byResolvedRuleset,
      currentRulesetLabel: input.rulesetById
        ? input.rulesetLabelFromRegistryConfigFn(input.rulesetById)
        : input.rulesetLabelFromUrlFallbackFn(input.resolvedReplayRuleset),
    };
  }

  if (input.effectiveMode === "v2") {
    return {
      current: input.v2,
      currentRulesetLabel: input.v2Label,
    };
  }

  if (input.effectiveMode === "compare") {
    return {
      current: input.v1,
      currentRulesetLabel: input.compareLabel ?? "比較表示 v1 vs v2",
    };
  }

  return {
    current: input.v1,
    currentRulesetLabel: input.v1Label,
  };
}
