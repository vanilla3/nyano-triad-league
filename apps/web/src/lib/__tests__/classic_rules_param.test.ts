import { describe, expect, it } from "vitest";

import {
  decodeClassicRulesMask,
  encodeClassicRulesMask,
  listClassicRuleTags,
  normalizeClassicRulesConfig,
} from "../classic_rules_param";

describe("classic_rules_param", () => {
  it("round-trips encode/decode for mixed classic config", () => {
    const input = normalizeClassicRulesConfig({
      swap: true,
      reverse: true,
      aceKiller: true,
      plus: true,
      same: true,
      order: true,
      allOpen: true,
      typeDescend: true,
    });

    const encoded = encodeClassicRulesMask(input);
    const decoded = decodeClassicRulesMask(encoded);
    expect(decoded).toEqual(input);
  });

  it("defaults to classic off when mask is missing/invalid", () => {
    expect(decodeClassicRulesMask(null)).toEqual(
      normalizeClassicRulesConfig({}),
    );
    expect(decodeClassicRulesMask("not-base36")).toEqual(
      normalizeClassicRulesConfig({}),
    );
  });

  it("normalizes mutually exclusive groups", () => {
    const normalized = normalizeClassicRulesConfig({
      order: true,
      chaos: true,
      allOpen: true,
      threeOpen: true,
      typeAscend: true,
      typeDescend: true,
    });
    expect(normalized.order).toBe(true);
    expect(normalized.chaos).toBe(false);
    expect(normalized.allOpen).toBe(true);
    expect(normalized.threeOpen).toBe(false);
    expect(normalized.typeAscend).toBe(true);
    expect(normalized.typeDescend).toBe(false);
  });

  it("lists active tags in deterministic order", () => {
    const tags = listClassicRuleTags(
      normalizeClassicRulesConfig({ reverse: true, plus: true, typeAscend: true }),
    );
    expect(tags).toEqual(["reverse", "plus", "typeAscend"]);
  });
});
