import { describe, expect, it } from "vitest";
import {
  buildClassicMaskChangeParamPatch,
  buildFirstPlayerModeChangeParamPatch,
  buildRulesetKeyChangeParamPatch,
} from "@/features/match/matchSetupParamPatches";

describe("features/match/matchSetupParamPatches", () => {
  it("builds ruleset patch preserving classic mask for classic_custom", () => {
    expect(buildRulesetKeyChangeParamPatch("classic_custom", "1z")).toEqual({
      rk: "classic_custom",
      cr: "1z",
    });
  });

  it("builds ruleset patch clearing classic mask for non-custom rulesets", () => {
    expect(buildRulesetKeyChangeParamPatch("v2", "1z")).toEqual({
      rk: "v2",
      cr: undefined,
    });
  });

  it("builds classic-mask patch", () => {
    expect(buildClassicMaskChangeParamPatch("ab")).toEqual({
      rk: "classic_custom",
      cr: "ab",
    });
  });

  it("builds first-player mode canonical patch with injected random bytes", () => {
    const patch = buildFirstPlayerModeChangeParamPatch(
      "seed",
      new URLSearchParams("fpm=manual"),
      { random: () => `0x${"11".repeat(32)}` as `0x${string}` },
    );
    expect(patch.fpm).toBe("seed");
    expect(patch.fps).toBe(`0x${"11".repeat(32)}`);
    expect(patch.fpsd).toBe(`0x${"11".repeat(32)}`);
  });
});

