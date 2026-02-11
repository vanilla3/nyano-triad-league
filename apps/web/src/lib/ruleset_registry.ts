/**
 * Ruleset Registry — P2-370
 *
 * Centralises the mapping from rulesetKey strings to RulesetConfigV1 objects.
 * Eliminates duplicated inline switches in Match.tsx / Playground.tsx.
 */

import type { RulesetConfigV1 } from "@nyano/triad-engine";
import {
  DEFAULT_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
} from "@nyano/triad-engine";

/** Canonical ruleset key strings used across the application. */
export type RulesetKey = "v1" | "v2" | "full";

/** All valid ruleset keys as a readonly array. */
export const RULESET_KEYS: readonly RulesetKey[] = ["v1", "v2", "full"] as const;

const REGISTRY: Record<RulesetKey, RulesetConfigV1> = {
  v1: ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  v2: ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
  full: DEFAULT_RULESET_CONFIG_V1,
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
 * Safe resolver: returns the RulesetConfigV1 for the given key, or null if unknown.
 */
export function resolveRuleset(key: string): RulesetConfigV1 | null {
  return isValidRulesetKey(key) ? REGISTRY[key] : null;
}

/**
 * Trusted-context resolver: throws if the key is unknown.
 * Use when the key has already been validated (e.g. from a typed param).
 */
export function resolveRulesetOrThrow(key: string): RulesetConfigV1 {
  const config = resolveRuleset(key);
  if (!config) {
    throw new Error(`Unknown rulesetKey: "${key}". Valid keys: ${RULESET_KEYS.join(", ")}`);
  }
  return config;
}
