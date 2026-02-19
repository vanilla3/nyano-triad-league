import type { ClassicRulesConfigV1, RulesetConfig } from "@nyano/triad-engine";
import { DEFAULT_RULESET_CONFIG_V2 } from "@nyano/triad-engine";
import {
  encodeClassicRulesMask,
  listClassicRuleTags,
  normalizeClassicRulesConfig,
} from "@/lib/classic_rules_param";
import { resolveRulesetOrThrow, type RulesetKey } from "@/lib/ruleset_registry";

export function resolveClassicCustomConfig(
  config: Partial<ClassicRulesConfigV1> | null | undefined,
): ClassicRulesConfigV1 {
  return normalizeClassicRulesConfig(config);
}

export function resolveBaseMatchRuleset(
  rulesetKey: RulesetKey,
  classicCustomConfig: ClassicRulesConfigV1,
): RulesetConfig {
  if (rulesetKey === "classic_custom") {
    return {
      ...DEFAULT_RULESET_CONFIG_V2,
      classic: { ...classicCustomConfig },
    } as RulesetConfig;
  }
  return resolveRulesetOrThrow(rulesetKey);
}

export function resolveMatchRuleset(
  baseRuleset: RulesetConfig,
  chainCapPerTurnParam: number | null,
): RulesetConfig {
  const next = structuredClone(baseRuleset) as RulesetConfig;
  if (chainCapPerTurnParam !== null) {
    next.meta = { ...(next.meta ?? {}), chainCapPerTurn: chainCapPerTurnParam };
  }
  return next;
}

export function resolveActiveClassicRuleTags(ruleset: RulesetConfig): string[] {
  if (ruleset.version !== 2) return [];
  return listClassicRuleTags(ruleset.classic);
}

export function resolveClassicForcedRuleLabel(
  activeClassicRuleTags: readonly string[],
  classicForcedCardIndex: number | null,
): "ORDER" | "CHAOS" | "FIX" | null {
  if (classicForcedCardIndex === null) return null;
  if (activeClassicRuleTags.includes("order")) return "ORDER";
  if (activeClassicRuleTags.includes("chaos")) return "CHAOS";
  return "FIX";
}

export function resolveActiveClassicMask(
  rulesetKey: RulesetKey,
  classicCustomConfig: ClassicRulesConfigV1,
): string | undefined {
  if (rulesetKey !== "classic_custom") return undefined;
  return encodeClassicRulesMask(classicCustomConfig);
}
