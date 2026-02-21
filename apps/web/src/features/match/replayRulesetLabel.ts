import type { RulesetConfig } from "@nyano/triad-engine";
import { ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2 } from "@nyano/triad-engine";
import { listClassicRuleTags } from "@/lib/classic_rules_param";

export function rulesetLabelFromConfig(cfg: RulesetConfig): string {
  if (cfg === ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2) return "エンジン v2（shadow: warning無視）";
  return "エンジン v1（core+tactics）";
}

export function rulesetLabelFromRegistryConfig(cfg: RulesetConfig): string {
  if (cfg.version === 2) {
    const tags = listClassicRuleTags(cfg.classic);
    if (tags.length > 0) return `Ruleset ID由来（classic: ${tags.join(", ")}）`;
    return "Ruleset ID由来（v2）";
  }
  return "Ruleset ID由来（v1）";
}

export function rulesetLabelFromUrlFallback(cfg: RulesetConfig): string {
  if (cfg.version !== 2) return "URL fallback（v1）";
  const tags = listClassicRuleTags(cfg.classic);
  if (tags.length === 0) return "URL fallback（classic custom: なし）";
  return `URL fallback（classic: ${tags.join(", ")}）`;
}
