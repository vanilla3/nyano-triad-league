/**
 * Ruleset Registry — P2-370
 *
 * Centralises the mapping from rulesetKey strings to RulesetConfig objects.
 * Eliminates duplicated inline switches in Match.tsx / Playground.tsx.
 */

import type { RulesetConfig } from "@nyano/triad-engine";
import {
  CLASSIC_PLUS_SAME_RULESET_CONFIG_V2,
  DEFAULT_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
} from "@nyano/triad-engine";

/** Canonical ruleset key strings used across the application. */
export type RulesetKey = "v1" | "v2" | "full" | "classic_plus_same";

/** All valid ruleset keys as a readonly array. */
export const RULESET_KEYS: readonly RulesetKey[] = ["v1", "v2", "full", "classic_plus_same"] as const;

const REGISTRY: Record<RulesetKey, RulesetConfig> = {
  v1: ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  v2: ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
  full: DEFAULT_RULESET_CONFIG_V1,
  classic_plus_same: CLASSIC_PLUS_SAME_RULESET_CONFIG_V2,
};

/**
 * Type guard: returns true if `key` is a valid RulesetKey.
 */
export function isValidRulesetKey(key: unknown): key is RulesetKey {
  return typeof key === "string" && RULESET_KEYS.includes(key as RulesetKey);
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
  return isValidRulesetKey(key) ? REGISTRY[key] : null;
}

/**
 * Trusted-context resolver: throws if the key is unknown.
 * Use when the key has already been validated (e.g. from a typed param).
 */
export function resolveRulesetOrThrow(key: string): RulesetConfig {
  const config = resolveRuleset(key);
  if (!config) {
    throw new Error(`Unknown rulesetKey: "${key}". Valid keys: ${RULESET_KEYS.join(", ")}`);
  }
  return config;
}
