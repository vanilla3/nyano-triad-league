import { describe, expect, it } from "vitest";
import { buildFirstPlayerModeParamPatch } from "../first_player_params";

describe("buildFirstPlayerModeParamPatch", () => {
  it("manual mode clears non-manual first-player params", () => {
    const patch = buildFirstPlayerModeParamPatch("manual");
    expect(patch.fps).toBeUndefined();
    expect(patch.fpa).toBeUndefined();
    expect(patch.fcoa).toBeUndefined();
  });

  it("seed mode clears commit-reveal and committed-mutual-only params", () => {
    const patch = buildFirstPlayerModeParamPatch("seed");
    expect(patch.fra).toBeUndefined();
    expect(patch.fcb).toBeUndefined();
    expect(patch.fpoa).toBeUndefined();
    expect(patch.fcob).toBeUndefined();
    expect(patch.fpsd).toBeUndefined();
  });

  it("commit_reveal mode clears seed and committed-mutual-only params", () => {
    const patch = buildFirstPlayerModeParamPatch("commit_reveal");
    expect(patch.fpsd).toBeUndefined();
    expect(patch.fpoa).toBeUndefined();
    expect(patch.fpna).toBeUndefined();
    expect(patch.fcob).toBeUndefined();
  });

  it("committed_mutual_choice mode clears seed and commit-reveal-only params", () => {
    const patch = buildFirstPlayerModeParamPatch("committed_mutual_choice");
    expect(patch.fpsd).toBeUndefined();
    expect(patch.fra).toBeUndefined();
    expect(patch.fcb).toBeUndefined();
  });
});

