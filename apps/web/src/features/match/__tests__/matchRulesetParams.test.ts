import { describe, expect, it } from "vitest";
import type { RulesetConfig } from "@nyano/triad-engine";
import {
  resolveActiveClassicMask,
  resolveActiveClassicRuleTags,
  resolveBaseMatchRuleset,
  resolveClassicCustomConfig,
  resolveClassicForcedRuleLabel,
  resolveMatchRuleset,
} from "@/features/match/matchRulesetParams";

describe("features/match/matchRulesetParams", () => {
  it("normalizes classic custom config", () => {
    const normalized = resolveClassicCustomConfig({ order: true, chaos: true });
    expect(normalized.order).toBe(true);
    expect(normalized.chaos).toBe(false);
  });

  it("resolves classic_custom base ruleset as v2", () => {
    const config = resolveClassicCustomConfig({ plus: true });
    const ruleset = resolveBaseMatchRuleset("classic_custom", config);
    expect(ruleset.version).toBe(2);
  });

  it("applies chain cap to a copied ruleset", () => {
    const base = resolveBaseMatchRuleset("v2", resolveClassicCustomConfig(null));
    const next = resolveMatchRuleset(base, 2);
    expect(next.meta?.chainCapPerTurn).toBe(2);
    expect(base.meta?.chainCapPerTurn).not.toBe(2);
  });

  it("resolves classic tags, forced label, and active mask", () => {
    const config = resolveClassicCustomConfig({ order: true, plus: true });
    const ruleset = resolveBaseMatchRuleset("classic_custom", config);
    const tags = resolveActiveClassicRuleTags(ruleset as RulesetConfig);
    expect(tags.includes("order")).toBe(true);
    expect(resolveClassicForcedRuleLabel(tags, 0)).toBe("ORDER");
    expect(resolveClassicForcedRuleLabel(tags, null)).toBeNull();
    expect(resolveActiveClassicMask("classic_custom", config)).toBeTruthy();
    expect(resolveActiveClassicMask("v2", config)).toBeUndefined();
  });
});
