import { describe, it, expect } from "vitest";
import {
  RULESET_KEYS,
  isValidRulesetKey,
  parseRulesetKeyOrDefault,
  resolveRuleset,
  resolveRulesetById,
  resolveRulesetOrThrow,
} from "../ruleset_registry";
import {
  CLASSIC_PLUS_SAME_RULESET_CONFIG_V2,
  computeRulesetId,
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

    it('"classic_plus_same" → CLASSIC_PLUS_SAME_RULESET_CONFIG_V2', () => {
      expect(resolveRuleset("classic_plus_same")).toBe(CLASSIC_PLUS_SAME_RULESET_CONFIG_V2);
    });

    it('"classic_order" has order=true', () => {
      const cfg = resolveRuleset("classic_order");
      expect(cfg).not.toBeNull();
      expect(cfg!.version).toBe(2);
      if (cfg!.version === 2) {
        expect(cfg!.classic.order).toBe(true);
        expect(cfg!.classic.chaos).toBe(false);
      }
    });

    it('"classic_chaos" has chaos=true', () => {
      const cfg = resolveRuleset("classic_chaos");
      expect(cfg).not.toBeNull();
      expect(cfg!.version).toBe(2);
      if (cfg!.version === 2) {
        expect(cfg!.classic.order).toBe(false);
        expect(cfg!.classic.chaos).toBe(true);
      }
    });

    it('"classic_swap" has swap=true', () => {
      const cfg = resolveRuleset("classic_swap");
      expect(cfg).not.toBeNull();
      expect(cfg!.version).toBe(2);
      if (cfg!.version === 2) {
        expect(cfg!.classic.swap).toBe(true);
      }
    });

    it('"classic_all_open" has allOpen=true', () => {
      const cfg = resolveRuleset("classic_all_open");
      expect(cfg).not.toBeNull();
      expect(cfg!.version).toBe(2);
      if (cfg!.version === 2) {
        expect(cfg!.classic.allOpen).toBe(true);
      }
    });

    it('"classic_three_open" has threeOpen=true', () => {
      const cfg = resolveRuleset("classic_three_open");
      expect(cfg).not.toBeNull();
      expect(cfg!.version).toBe(2);
      if (cfg!.version === 2) {
        expect(cfg!.classic.threeOpen).toBe(true);
      }
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
    it.each([
      "v1",
      "v2",
      "full",
      "classic_plus_same",
      "classic_order",
      "classic_chaos",
      "classic_swap",
      "classic_all_open",
      "classic_three_open",
    ] as const)('"%s" → true', (key) => {
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

  /* ─── parseRulesetKeyOrDefault ─── */

  describe("parseRulesetKeyOrDefault", () => {
    it('"full" parses as full', () => {
      expect(parseRulesetKeyOrDefault("full")).toBe("full");
    });

    it("falls back to default (v2) on unknown key", () => {
      expect(parseRulesetKeyOrDefault("v99")).toBe("v2");
      expect(parseRulesetKeyOrDefault(null)).toBe("v2");
    });

    it("uses caller-provided fallback", () => {
      expect(parseRulesetKeyOrDefault("v99", "v1")).toBe("v1");
    });
  });

  /* ─── RULESET_KEYS ─── */

  describe("RULESET_KEYS", () => {
    it("contains all known keys", () => {
      expect(RULESET_KEYS).toContain("v1");
      expect(RULESET_KEYS).toContain("v2");
      expect(RULESET_KEYS).toContain("full");
      expect(RULESET_KEYS).toContain("classic_plus_same");
      expect(RULESET_KEYS).toContain("classic_order");
      expect(RULESET_KEYS).toContain("classic_chaos");
      expect(RULESET_KEYS).toContain("classic_swap");
      expect(RULESET_KEYS).toContain("classic_all_open");
      expect(RULESET_KEYS).toContain("classic_three_open");
    });

    it("has length 9", () => {
      expect(RULESET_KEYS.length).toBe(9);
    });

    it("every key resolves to a non-null config", () => {
      for (const key of RULESET_KEYS) {
        expect(resolveRuleset(key)).not.toBeNull();
      }
    });
  });

  describe("resolveRulesetById", () => {
    it("resolves every known rulesetId to the same config object", () => {
      for (const key of RULESET_KEYS) {
        const cfg = resolveRulesetOrThrow(key);
        const id = computeRulesetId(cfg);
        expect(resolveRulesetById(id)).toBe(cfg);
      }
    });

    it("returns null for unknown rulesetId", () => {
      expect(resolveRulesetById(`0x${"00".repeat(32)}`)).toBeNull();
    });
  });
});
