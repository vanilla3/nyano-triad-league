import { describe, expect, it } from "vitest";
import type { RulesetConfig } from "@nyano/triad-engine";
import {
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
} from "@nyano/triad-engine";
import {
  rulesetLabelFromConfig,
  rulesetLabelFromRegistryConfig,
  rulesetLabelFromUrlFallback,
} from "@/features/match/replayRulesetLabel";

const taggedV2 = {
  version: 2,
  classic: {
    swap: true,
    reverse: false,
    aceKiller: false,
    plus: false,
    same: false,
    order: false,
    chaos: false,
    allOpen: true,
    threeOpen: false,
    typeAscend: false,
    typeDescend: false,
  },
} as unknown as RulesetConfig;

describe("features/match/replayRulesetLabel", () => {
  it("labels engine presets by config reference", () => {
    expect(rulesetLabelFromConfig(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1)).toBe("エンジン v1（core+tactics）");
    expect(rulesetLabelFromConfig(ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2)).toBe("エンジン v2（shadow: warning無視）");
  });

  it("formats registry-derived labels", () => {
    expect(rulesetLabelFromRegistryConfig(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1)).toBe("rulesetId由来（v1）");
    expect(rulesetLabelFromRegistryConfig(taggedV2)).toContain("rulesetId由来（classic:");
  });

  it("formats URL-fallback labels for v1/v2 classic", () => {
    expect(rulesetLabelFromUrlFallback(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1)).toBe("URL fallback（v1）");
    expect(rulesetLabelFromUrlFallback(taggedV2)).toContain("URL fallback（classic:");
  });
});
