import { describe, expect, it } from "vitest";
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

const EXPECTED_RULESET_KEYS = [
  "v1",
  "v2",
  "full",
  "classic_plus_same",
  "classic_custom",
  "classic_plus",
  "classic_same",
  "classic_reverse",
  "classic_ace_killer",
  "classic_type_ascend",
  "classic_type_descend",
  "classic_order",
  "classic_chaos",
  "classic_swap",
  "classic_all_open",
  "classic_three_open",
] as const;

describe("ruleset_registry", () => {
  describe("resolveRuleset", () => {
    it("maps core keys to canonical configs", () => {
      expect(resolveRuleset("v1")).toBe(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
      expect(resolveRuleset("v2")).toBe(ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2);
      expect(resolveRuleset("full")).toBe(DEFAULT_RULESET_CONFIG_V1);
      expect(resolveRuleset("classic_plus_same")).toBe(CLASSIC_PLUS_SAME_RULESET_CONFIG_V2);
    });

    it("maps classic toggles", () => {
      expect(resolveRuleset("classic_custom")?.version).toBe(2);
      expect(resolveRuleset("classic_plus")?.version).toBe(2);
      expect(resolveRuleset("classic_same")?.version).toBe(2);
      expect(resolveRuleset("classic_reverse")?.version).toBe(2);
      expect(resolveRuleset("classic_ace_killer")?.version).toBe(2);
      expect(resolveRuleset("classic_type_ascend")?.version).toBe(2);
      expect(resolveRuleset("classic_type_descend")?.version).toBe(2);

      const plus = resolveRuleset("classic_plus");
      const same = resolveRuleset("classic_same");
      const reverse = resolveRuleset("classic_reverse");
      const aceKiller = resolveRuleset("classic_ace_killer");
      const typeAscend = resolveRuleset("classic_type_ascend");
      const typeDescend = resolveRuleset("classic_type_descend");
      const order = resolveRuleset("classic_order");
      const chaos = resolveRuleset("classic_chaos");
      const swap = resolveRuleset("classic_swap");
      const allOpen = resolveRuleset("classic_all_open");
      const threeOpen = resolveRuleset("classic_three_open");

      if (
        plus?.version === 2
        && same?.version === 2
        && reverse?.version === 2
        && aceKiller?.version === 2
        && typeAscend?.version === 2
        && typeDescend?.version === 2
        && order?.version === 2
        && chaos?.version === 2
        && swap?.version === 2
        && allOpen?.version === 2
        && threeOpen?.version === 2
      ) {
        expect(plus.classic.plus).toBe(true);
        expect(same.classic.same).toBe(true);
        expect(reverse.classic.reverse).toBe(true);
        expect(aceKiller.classic.aceKiller).toBe(true);
        expect(typeAscend.classic.typeAscend).toBe(true);
        expect(typeDescend.classic.typeDescend).toBe(true);
        expect(order.classic.order).toBe(true);
        expect(chaos.classic.chaos).toBe(true);
        expect(swap.classic.swap).toBe(true);
        expect(allOpen.classic.allOpen).toBe(true);
        expect(threeOpen.classic.threeOpen).toBe(true);
      }
    });

    it("returns null for unknown keys", () => {
      expect(resolveRuleset("unknown")).toBeNull();
      expect(resolveRuleset("")).toBeNull();
    });
  });

  describe("resolveRulesetOrThrow", () => {
    it("resolves known key", () => {
      expect(() => resolveRulesetOrThrow("v1")).not.toThrow();
      expect(resolveRulesetOrThrow("v1")).toBe(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
    });

    it("throws for unknown key", () => {
      expect(() => resolveRulesetOrThrow("unknown")).toThrow(/Unknown rulesetKey.*\"unknown\"/);
    });
  });

  describe("isValidRulesetKey", () => {
    it.each(EXPECTED_RULESET_KEYS)("accepts %s", (key) => {
      expect(isValidRulesetKey(key)).toBe(true);
    });

    it("rejects invalid inputs", () => {
      expect(isValidRulesetKey("v99")).toBe(false);
      expect(isValidRulesetKey(null)).toBe(false);
      expect(isValidRulesetKey(1)).toBe(false);
    });
  });

  describe("parseRulesetKeyOrDefault", () => {
    it("parses valid key", () => {
      expect(parseRulesetKeyOrDefault("full")).toBe("full");
    });

    it("falls back to default v2 for unknown", () => {
      expect(parseRulesetKeyOrDefault("v99")).toBe("v2");
      expect(parseRulesetKeyOrDefault(null)).toBe("v2");
    });

    it("uses caller fallback", () => {
      expect(parseRulesetKeyOrDefault("v99", "v1")).toBe("v1");
    });
  });

  describe("RULESET_KEYS", () => {
    it("contains every expected key in canonical order", () => {
      expect(RULESET_KEYS).toEqual(EXPECTED_RULESET_KEYS);
    });

    it("every key resolves", () => {
      for (const key of RULESET_KEYS) {
        expect(resolveRuleset(key)).not.toBeNull();
      }
    });
  });

  describe("resolveRulesetById", () => {
    it("maps each rulesetId to same config", () => {
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
