import { computeRulesetId } from "@nyano/triad-engine";

import { RULESET_KEYS, resolveRulesetOrThrow, type RulesetKey } from "@/lib/ruleset_registry";

export type RulesetDiscoveryMeta = {
  title: string;
  summary: string;
  tags: readonly string[];
  recommended: boolean;
};

const RULESET_META: Record<RulesetKey, RulesetDiscoveryMeta> = {
  v1: {
    title: "Core Tactics v1",
    summary: "Baseline ruleset for deterministic on-chain compatible matches.",
    tags: ["core", "stable"],
    recommended: false,
  },
  v2: {
    title: "Core Tactics v2",
    summary: "Default modern ruleset. Great first choice for most matches.",
    tags: ["default", "balanced"],
    recommended: true,
  },
  full: {
    title: "Full Rules",
    summary: "Traits and formations enabled for maximum tactical depth.",
    tags: ["advanced", "deep"],
    recommended: true,
  },
  classic_plus_same: {
    title: "Classic Plus+Same",
    summary: "Classic flavor with Plus/Same interactions.",
    tags: ["classic", "combo"],
    recommended: true,
  },
  classic_order: {
    title: "Classic Order",
    summary: "Classic mode where hand order impacts play flow.",
    tags: ["classic", "order"],
    recommended: false,
  },
  classic_chaos: {
    title: "Classic Chaos",
    summary: "Classic mode with unpredictable play constraints each turn.",
    tags: ["classic", "chaos"],
    recommended: false,
  },
  classic_swap: {
    title: "Classic Swap",
    summary: "Classic mode with deterministic cross-side slot swap.",
    tags: ["classic", "swap"],
    recommended: false,
  },
  classic_all_open: {
    title: "Classic All Open",
    summary: "Both hands are visible from the start.",
    tags: ["classic", "open"],
    recommended: false,
  },
  classic_three_open: {
    title: "Classic Three Open",
    summary: "Three cards are visible while the rest remain hidden.",
    tags: ["classic", "open"],
    recommended: false,
  },
};

const RULESET_ID_TO_KEY = new Map<string, RulesetKey>(
  RULESET_KEYS.map((key) => [computeRulesetId(resolveRulesetOrThrow(key)).toLowerCase(), key]),
);

export function resolveRulesetKeyById(rulesetId: string | null | undefined): RulesetKey | null {
  if (typeof rulesetId !== "string" || rulesetId.length === 0) return null;
  return RULESET_ID_TO_KEY.get(rulesetId.toLowerCase()) ?? null;
}

export function getRulesetMeta(key: RulesetKey): RulesetDiscoveryMeta {
  return RULESET_META[key];
}

export function getRecommendedRulesetKeys(): RulesetKey[] {
  return RULESET_KEYS.filter((key) => RULESET_META[key].recommended);
}

export function buildMatchRulesetUrl(key: RulesetKey): string {
  return `/match?ui=mint&rk=${key}`;
}
