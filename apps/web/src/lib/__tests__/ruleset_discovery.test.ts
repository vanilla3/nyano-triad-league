import { describe, expect, it } from "vitest";
import { computeRulesetId } from "@nyano/triad-engine";

import {
  buildMatchRulesetUrl,
  getRecommendedRulesetKeys,
  getRulesetMeta,
  resolveRulesetKeyById,
} from "@/lib/ruleset_discovery";
import { RULESET_KEYS, resolveRulesetOrThrow } from "@/lib/ruleset_registry";

describe("ruleset_discovery", () => {
  it("resolves every known rulesetId to a ruleset key", () => {
    for (const key of RULESET_KEYS) {
      const id = computeRulesetId(resolveRulesetOrThrow(key));
      expect(resolveRulesetKeyById(id)).toBe(key);
    }
  });

  it("provides non-empty metadata and at least one recommended key", () => {
    for (const key of RULESET_KEYS) {
      const meta = getRulesetMeta(key);
      expect(meta.title.length).toBeGreaterThan(0);
      expect(meta.summary.length).toBeGreaterThan(0);
    }
    expect(getRecommendedRulesetKeys().length).toBeGreaterThan(0);
  });

  it("builds match link with rk and ui params", () => {
    expect(buildMatchRulesetUrl("v2")).toBe("/match?ui=mint&rk=v2");
  });
});
