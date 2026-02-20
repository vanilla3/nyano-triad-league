import { describe, expect, it } from "vitest";
import { computeRulesetId } from "@nyano/triad-engine";
import {
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
} from "@nyano/triad-engine";
import {
  REPLAY_RULESET_ID_MISMATCH_WARNING,
  resolveReplayRulesetContext,
  resolveReplayRulesetIdMismatchWarning,
} from "@/features/match/replayRulesetContext";

describe("features/match/replayRulesetContext", () => {
  it("prefers rulesetId-resolved config and uses default mode in auto", () => {
    const resolvedById = ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1;
    const fallback = ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2;
    const state = resolveReplayRulesetContext({
      mode: "auto",
      transcriptRulesetId: "0xdeadbeef",
      rulesetById: resolvedById,
      fallbackRulesetFromParams: fallback,
      pickDefaultReplayModeFn: () => "v2",
    });

    expect(state.resolvedReplayRuleset).toBe(resolvedById);
    expect(state.useResolvedRuleset).toBe(true);
    expect(state.effectiveMode).toBe("v2");
    expect(state.rulesetIdMismatchWarning).toBeNull();
  });

  it("keeps non-auto mode and disables resolved-ruleset override flag", () => {
    const state = resolveReplayRulesetContext({
      mode: "v1",
      transcriptRulesetId: "0xdeadbeef",
      rulesetById: null,
      fallbackRulesetFromParams: ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
      pickDefaultReplayModeFn: () => "compare",
    });

    expect(state.useResolvedRuleset).toBe(false);
    expect(state.effectiveMode).toBe("v1");
  });

  it("emits mismatch warning only when fallback ruleset id differs", () => {
    const fallback = ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2;
    const mismatch = resolveReplayRulesetIdMismatchWarning({
      rulesetById: null,
      fallbackRulesetFromParams: fallback,
      transcriptRulesetId: computeRulesetId(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1),
    });
    const matched = resolveReplayRulesetIdMismatchWarning({
      rulesetById: null,
      fallbackRulesetFromParams: fallback,
      transcriptRulesetId: computeRulesetId(fallback),
    });

    expect(mismatch).toBe(REPLAY_RULESET_ID_MISMATCH_WARNING);
    expect(matched).toBeNull();
  });
});
