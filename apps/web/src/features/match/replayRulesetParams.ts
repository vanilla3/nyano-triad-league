import type { RulesetConfig } from "@nyano/triad-engine";
import { DEFAULT_RULESET_CONFIG_V2 } from "@nyano/triad-engine";
import OFFICIAL from "@root/rulesets/official_onchain_rulesets.json";
import { resolveRuleset, resolveRulesetById } from "@/lib/ruleset_registry";
import { decodeClassicRulesMask, normalizeClassicRulesConfig } from "@/lib/classic_rules_param";
import type { ReplayMode } from "@/features/match/replayModeParams";

export function resolveReplayRulesetFromParams(
  rulesetKeyParam: string | null,
  classicMaskParam: string | null,
): RulesetConfig | null {
  if (!rulesetKeyParam) return null;
  if (rulesetKeyParam === "classic_custom") {
    const classic = normalizeClassicRulesConfig(decodeClassicRulesMask(classicMaskParam));
    return {
      ...DEFAULT_RULESET_CONFIG_V2,
      classic: { ...classic },
    };
  }
  return resolveRuleset(rulesetKeyParam);
}

export function pickDefaultReplayMode(rulesetId: string): ReplayMode {
  try {
    const rulesets = (OFFICIAL as { rulesets: Array<{ rulesetId: string; engineId: number }> }).rulesets;
    const hit = rulesets.find((r) => r.rulesetId.toLowerCase() === rulesetId.toLowerCase());
    if (!hit) return "compare";
    return hit.engineId === 2 ? "v2" : "v1";
  } catch {
    return "compare";
  }
}

export function shouldAutoCompareByRulesetId(rulesetId: string): boolean {
  if (resolveRulesetById(rulesetId)) return false;
  return pickDefaultReplayMode(rulesetId) === "compare";
}
