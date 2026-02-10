import { describe, it, expect } from "vitest";
import {
  RULESET_KEYS,
  isValidRulesetKey,
  resolveRuleset,
  resolveRulesetOrThrow,
} from "../ruleset_registry";
import {
  DEFAULT_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
} from "@nyano/triad-engine";

/* ═══════════════════════════════════════════════════════════════════
   ruleset_registry.test.ts

   P2-370: Verify that the centralised ruleset registry correctly
   maps keys to engine configs.
   ═══════════════════════════════════════════════════════════════════ */

describe("Ruleset registry (P2-370)", () => {
  /* ─── resolveRuleset ─── */

  describe("resolveRuleset", () => {
    it('"v1" → ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1', () => {
      expect(resolveRuleset("v1")).toBe(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
    });

    it('"v2" → ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2', () => {
      expect(resolveRuleset("v2")).toBe(ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2);
    });

    it('"full" → DEFAULT_RULESET_CONFIG_V1', () => {
      expect(resolveRuleset("full")).toBe(DEFAULT_RULESET_CONFIG_V1);
    });

    it('"unknown" → null', () => {
      expect(resolveRuleset("unknown")).toBeNull();
    });

    it('"" → null', () => {
      expect(resolveRuleset("")).toBeNull();
    });
  });

  /* ─── resolveRulesetOrThrow ─── */

  describe("resolveRulesetOrThrow", () => {
    it('"v1" resolves without throwing', () => {
      expect(() => resolveRulesetOrThrow("v1")).not.toThrow();
      expect(resolveRulesetOrThrow("v1")).toBe(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
    });

    it('"unknown" throws with descriptive message', () => {
      expect(() => resolveRulesetOrThrow("unknown")).toThrow(/Unknown rulesetKey.*"unknown"/);
    });
  });

  /* ─── isValidRulesetKey ─── */

  describe("isValidRulesetKey", () => {
    it.each(["v1", "v2", "full"] as const)('"%s" → true', (key) => {
      expect(isValidRulesetKey(key)).toBe(true);
    });

    it('"v99" → false', () => {
      expect(isValidRulesetKey("v99")).toBe(false);
    });

    it("null → false", () => {
      expect(isValidRulesetKey(null)).toBe(false);
    });

    it("number → false", () => {
      expect(isValidRulesetKey(1)).toBe(false);
    });
  });

  /* ─── RULESET_KEYS ─── */

  describe("RULESET_KEYS", () => {
    it("contains all known keys", () => {
      expect(RULESET_KEYS).toContain("v1");
      expect(RULESET_KEYS).toContain("v2");
      expect(RULESET_KEYS).toContain("full");
    });

    it("has length 3", () => {
      expect(RULESET_KEYS.length).toBe(3);
    });

    it("every key resolves to a non-null config", () => {
      for (const key of RULESET_KEYS) {
        expect(resolveRuleset(key)).not.toBeNull();
      }
    });
  });
});
