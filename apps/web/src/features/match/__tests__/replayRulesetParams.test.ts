import { describe, expect, it } from "vitest";
import {
  pickDefaultReplayMode,
  resolveReplayRulesetFromParams,
  shouldAutoCompareByRulesetId,
} from "@/features/match/replayRulesetParams";

describe("features/match/replayRulesetParams", () => {
  it("resolves classic_custom ruleset from rk/cr params", () => {
    const resolved = resolveReplayRulesetFromParams("classic_custom", "3");
    expect(resolved).not.toBeNull();
    expect(resolved?.version).toBe(2);
    if (!resolved || resolved.version !== 2) return;
    expect(resolved.classic).toBeDefined();
  });

  it("returns null when rk is empty", () => {
    expect(resolveReplayRulesetFromParams(null, "3")).toBeNull();
  });

  it("returns compare as fallback mode for unknown ruleset id", () => {
    expect(pickDefaultReplayMode("unknown_ruleset_id_for_test")).toBe("compare");
  });

  it("enables auto-compare for unknown ruleset ids", () => {
    expect(shouldAutoCompareByRulesetId("unknown_ruleset_id_for_test")).toBe(true);
  });
});
