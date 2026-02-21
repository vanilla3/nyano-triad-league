/**
 * Ruleset Registry — P2-370
 *
 * Centralises the mapping from rulesetKey strings to RulesetConfig objects.
 * Eliminates duplicated inline switches in Match.tsx / Playground.tsx.
 */

import type { RulesetConfig } from "@nyano/triad-engine";
import {
  CLASSIC_PLUS_SAME_RULESET_CONFIG_V2,
  computeRulesetId,
  DEFAULT_RULESET_CONFIG_V2,
  DEFAULT_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
} from "@nyano/triad-engine";

/** Canonical ruleset key strings used across the application. */
export type CanonicalRulesetKey =
  | "v1"
  | "v2"
  | "full"
  | "classic_plus_same"
  | "classic_order"
  | "classic_chaos"
  | "classic_swap"
  | "classic_all_open"
  | "classic_three_open";

/** Legacy/compat ruleset keys kept for URL/backward compatibility. */
export type LegacyRulesetKey =
  | "classic_custom"
  | "classic_plus"
  | "classic_same"
  | "classic_reverse"
  | "classic_ace_killer"
  | "classic_type_ascend"
  | "classic_type_descend";

export type RulesetKey = CanonicalRulesetKey | LegacyRulesetKey;

/** All valid ruleset keys as a readonly array. */
export const RULESET_KEYS: readonly CanonicalRulesetKey[] = [
  "v1",
  "v2",
  "full",
  "classic_plus_same",
  "classic_order",
  "classic_chaos",
  "classic_swap",
  "classic_all_open",
  "classic_three_open",
] as const;

export const LEGACY_RULESET_KEYS: readonly LegacyRulesetKey[] = [
  "classic_custom",
  "classic_plus",
  "classic_same",
  "classic_reverse",
  "classic_ace_killer",
  "classic_type_ascend",
  "classic_type_descend",
] as const;

const CLASSIC_ORDER_RULESET_CONFIG_V2: RulesetConfig = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_RULESET_CONFIG_V2.classic,
    order: true,
  },
};

const CLASSIC_CHAOS_RULESET_CONFIG_V2: RulesetConfig = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_RULESET_CONFIG_V2.classic,
    chaos: true,
  },
};

const CLASSIC_SWAP_RULESET_CONFIG_V2: RulesetConfig = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_RULESET_CONFIG_V2.classic,
    swap: true,
  },
};

const CLASSIC_ALL_OPEN_RULESET_CONFIG_V2: RulesetConfig = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_RULESET_CONFIG_V2.classic,
    allOpen: true,
  },
};

const CLASSIC_THREE_OPEN_RULESET_CONFIG_V2: RulesetConfig = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_RULESET_CONFIG_V2.classic,
    threeOpen: true,
  },
};

const CLASSIC_CUSTOM_RULESET_CONFIG_V2: RulesetConfig = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_RULESET_CONFIG_V2.classic,
  },
};

const CLASSIC_PLUS_RULESET_CONFIG_V2: RulesetConfig = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_RULESET_CONFIG_V2.classic,
    plus: true,
  },
};

const CLASSIC_SAME_RULESET_CONFIG_V2: RulesetConfig = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_RULESET_CONFIG_V2.classic,
    same: true,
  },
};

const CLASSIC_REVERSE_RULESET_CONFIG_V2: RulesetConfig = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_RULESET_CONFIG_V2.classic,
    reverse: true,
  },
};

const CLASSIC_ACE_KILLER_RULESET_CONFIG_V2: RulesetConfig = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_RULESET_CONFIG_V2.classic,
    aceKiller: true,
  },
};

const CLASSIC_TYPE_ASCEND_RULESET_CONFIG_V2: RulesetConfig = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_RULESET_CONFIG_V2.classic,
    typeAscend: true,
  },
};

const CLASSIC_TYPE_DESCEND_RULESET_CONFIG_V2: RulesetConfig = {
  ...DEFAULT_RULESET_CONFIG_V2,
  classic: {
    ...DEFAULT_RULESET_CONFIG_V2.classic,
    typeDescend: true,
  },
};

const REGISTRY: Record<CanonicalRulesetKey, RulesetConfig> = {
  v1: ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  v2: ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
  full: DEFAULT_RULESET_CONFIG_V1,
  classic_plus_same: CLASSIC_PLUS_SAME_RULESET_CONFIG_V2,
  classic_order: CLASSIC_ORDER_RULESET_CONFIG_V2,
  classic_chaos: CLASSIC_CHAOS_RULESET_CONFIG_V2,
  classic_swap: CLASSIC_SWAP_RULESET_CONFIG_V2,
  classic_all_open: CLASSIC_ALL_OPEN_RULESET_CONFIG_V2,
  classic_three_open: CLASSIC_THREE_OPEN_RULESET_CONFIG_V2,
};

const LEGACY_REGISTRY: Record<LegacyRulesetKey, RulesetConfig> = {
  classic_custom: CLASSIC_CUSTOM_RULESET_CONFIG_V2,
  classic_plus: CLASSIC_PLUS_RULESET_CONFIG_V2,
  classic_same: CLASSIC_SAME_RULESET_CONFIG_V2,
  classic_reverse: CLASSIC_REVERSE_RULESET_CONFIG_V2,
  classic_ace_killer: CLASSIC_ACE_KILLER_RULESET_CONFIG_V2,
  classic_type_ascend: CLASSIC_TYPE_ASCEND_RULESET_CONFIG_V2,
  classic_type_descend: CLASSIC_TYPE_DESCEND_RULESET_CONFIG_V2,
};

function isCanonicalRulesetKey(key: string): key is CanonicalRulesetKey {
  return RULESET_KEYS.includes(key as CanonicalRulesetKey);
}

function isLegacyRulesetKey(key: string): key is LegacyRulesetKey {
  return LEGACY_RULESET_KEYS.includes(key as LegacyRulesetKey);
}

const ALL_RULESET_KEYS: readonly RulesetKey[] = [
  ...RULESET_KEYS,
  ...LEGACY_RULESET_KEYS,
] as const;

const REGISTRY_BY_RULESET_ID = new Map<string, RulesetConfig>(
  ALL_RULESET_KEYS.map((key) => {
    const config = isCanonicalRulesetKey(key) ? REGISTRY[key] : LEGACY_REGISTRY[key];
    return [computeRulesetId(config).toLowerCase(), config];
  })
);

/**
 * Type guard: returns true if `key` is a valid RulesetKey.
 */
export function isValidRulesetKey(key: unknown): key is RulesetKey {
  return (
    typeof key === "string" &&
    (isCanonicalRulesetKey(key) || isLegacyRulesetKey(key))
  );
}

/**
 * Parse unknown query/input value into a valid RulesetKey.
 * Falls back to the provided default key when input is invalid.
 */
export function parseRulesetKeyOrDefault(
  key: string | null | undefined,
  fallback: RulesetKey = "v2",
): RulesetKey {
  return isValidRulesetKey(key) ? key : fallback;
}

/**
 * Safe resolver: returns the RulesetConfig for the given key, or null if unknown.
 */
export function resolveRuleset(key: string): RulesetConfig | null {
  if (isCanonicalRulesetKey(key)) return REGISTRY[key];
  if (isLegacyRulesetKey(key)) return LEGACY_REGISTRY[key];
  return null;
}

/**
 * Resolve RulesetConfig from a rulesetId (bytes32 hex string).
 * Returns null when the rulesetId is unknown to the local registry.
 */
export function resolveRulesetById(rulesetId: string | null | undefined): RulesetConfig | null {
  if (typeof rulesetId !== "string" || rulesetId.length === 0) return null;
  return REGISTRY_BY_RULESET_ID.get(rulesetId.toLowerCase()) ?? null;
}

/**
 * Trusted-context resolver: throws if the key is unknown.
 * Use when the key has already been validated (e.g. from a typed param).
 */
export function resolveRulesetOrThrow(key: string): RulesetConfig {
  const config = resolveRuleset(key);
  if (!config) {
    throw new Error(`Unknown rulesetKey: "${key}". Valid keys: ${ALL_RULESET_KEYS.join(", ")}`);
  }
  return config;
}
