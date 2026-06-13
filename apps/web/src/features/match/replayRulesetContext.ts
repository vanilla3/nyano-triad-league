import type { RulesetConfig } from "@nyano/triad-engine";
import { computeRulesetId } from "@nyano/triad-engine";
import { pickDefaultReplayMode } from "@/features/match/replayRulesetParams";
import type { ReplayMode } from "@/features/match/replayModeParams";

export const REPLAY_RULESET_ID_MISMATCH_WARNING =
  "URL の classic 設定が transcript rulesetId と一致しません。URL fallback ルールで再生しています。";

export function resolveReplayRulesetIdMismatchWarning(input: {
  rulesetById: RulesetConfig | null;
  fallbackRulesetFromParams: RulesetConfig | null;
  transcriptRulesetId: string;
}): string | null {
  if (input.rulesetById) return null;
  if (!input.fallbackRulesetFromParams) return null;
  const fallbackRulesetId = computeRulesetId(input.fallbackRulesetFromParams).toLowerCase();
  if (fallbackRulesetId === input.transcriptRulesetId.toLowerCase()) return null;
  return REPLAY_RULESET_ID_MISMATCH_WARNING;
}

export function resolveReplayRulesetContext(input: {
  mode: ReplayMode;
  transcriptRulesetId: string;
  rulesetById: RulesetConfig | null;
  fallbackRulesetFromParams: RulesetConfig | null;
  pickDefaultReplayModeFn?: (rulesetId: string) => ReplayMode;
}): {
  resolvedReplayRuleset: RulesetConfig | null;
  useResolvedRuleset: boolean;
  effectiveMode: ReplayMode;
  rulesetIdMismatchWarning: string | null;
} {
  const resolvedReplayRuleset = input.rulesetById ?? input.fallbackRulesetFromParams;
  const pickDefaultReplayModeFn = input.pickDefaultReplayModeFn ?? pickDefaultReplayMode;
  const effectiveMode =
    input.mode === "auto" ? pickDefaultReplayModeFn(input.transcriptRulesetId) : input.mode;
  const useResolvedRuleset = input.mode === "auto" && resolvedReplayRuleset !== null;
  const rulesetIdMismatchWarning = resolveReplayRulesetIdMismatchWarning({
    rulesetById: input.rulesetById,
    fallbackRulesetFromParams: input.fallbackRulesetFromParams,
    transcriptRulesetId: input.transcriptRulesetId,
  });

  return {
    resolvedReplayRuleset,
    useResolvedRuleset,
    effectiveMode,
    rulesetIdMismatchWarning,
  };
}
