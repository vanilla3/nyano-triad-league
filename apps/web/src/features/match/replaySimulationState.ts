import type { CardData, MatchResultWithHistory, RulesetConfig, TranscriptV1 } from "@nyano/triad-engine";
import {
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
  simulateMatchV1WithHistory,
} from "@nyano/triad-engine";
import type { ReplayMode } from "@/features/match/replayModeParams";
import { resolveReplayCurrentResult } from "@/features/match/replayResultSelection";
import { resolveReplayRulesetContext } from "@/features/match/replayRulesetContext";
import {
  rulesetLabelFromConfig,
  rulesetLabelFromRegistryConfig,
  rulesetLabelFromUrlFallback,
} from "@/features/match/replayRulesetLabel";

type ReplaySimulationDeps = {
  simulateMatchV1WithHistory: typeof simulateMatchV1WithHistory;
  resolveReplayRulesetContext: typeof resolveReplayRulesetContext;
  resolveReplayCurrentResult: typeof resolveReplayCurrentResult;
  rulesetLabelFromConfig: typeof rulesetLabelFromConfig;
  rulesetLabelFromRegistryConfig: typeof rulesetLabelFromRegistryConfig;
  rulesetLabelFromUrlFallback: typeof rulesetLabelFromUrlFallback;
};

const DEFAULT_DEPS: ReplaySimulationDeps = {
  simulateMatchV1WithHistory,
  resolveReplayRulesetContext,
  resolveReplayCurrentResult,
  rulesetLabelFromConfig,
  rulesetLabelFromRegistryConfig,
  rulesetLabelFromUrlFallback,
};

export function resolveReplaySimulationState(
  input: {
    transcript: TranscriptV1;
    cards: Map<bigint, CardData>;
    mode: ReplayMode;
    rulesetById: RulesetConfig | null;
    fallbackRulesetFromParams: RulesetConfig | null;
  },
  depsPartial?: Partial<ReplaySimulationDeps>,
): {
  currentRulesetLabel: string;
  resolvedRuleset: RulesetConfig | null;
  rulesetIdMismatchWarning: string | null;
  current: MatchResultWithHistory;
  v1: MatchResultWithHistory;
  v2: MatchResultWithHistory;
} {
  const deps: ReplaySimulationDeps = { ...DEFAULT_DEPS, ...(depsPartial ?? {}) };
  const {
    resolvedReplayRuleset,
    useResolvedRuleset,
    effectiveMode,
    rulesetIdMismatchWarning,
  } = deps.resolveReplayRulesetContext({
    mode: input.mode,
    transcriptRulesetId: input.transcript.header.rulesetId,
    rulesetById: input.rulesetById,
    fallbackRulesetFromParams: input.fallbackRulesetFromParams,
  });

  const v1 = deps.simulateMatchV1WithHistory(
    input.transcript,
    input.cards,
    ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  );
  const v2 = deps.simulateMatchV1WithHistory(
    input.transcript,
    input.cards,
    ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
  );
  const byResolvedRuleset = resolvedReplayRuleset
    ? deps.simulateMatchV1WithHistory(input.transcript, input.cards, resolvedReplayRuleset)
    : null;
  const {
    current,
    currentRulesetLabel,
  } = deps.resolveReplayCurrentResult({
    useResolvedRuleset,
    byResolvedRuleset,
    resolvedReplayRuleset,
    rulesetById: input.rulesetById,
    effectiveMode,
    v1,
    v2,
    v1Label: deps.rulesetLabelFromConfig(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1),
    v2Label: deps.rulesetLabelFromConfig(ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2),
    compareLabel: "比較表示 v1 vs v2",
    rulesetLabelFromRegistryConfigFn: deps.rulesetLabelFromRegistryConfig,
    rulesetLabelFromUrlFallbackFn: deps.rulesetLabelFromUrlFallback,
  });

  return {
    currentRulesetLabel,
    resolvedRuleset: resolvedReplayRuleset,
    rulesetIdMismatchWarning,
    current,
    v1,
    v2,
  };
}
