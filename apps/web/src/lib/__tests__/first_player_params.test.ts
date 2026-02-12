import { describe, expect, it } from "vitest";
import { buildFirstPlayerModeDefaultParamPatch, buildFirstPlayerModeParamPatch } from "../first_player_params";

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

describe("buildFirstPlayerModeDefaultParamPatch", () => {
  const mkRandom = (() => {
    let n = 0;
    return () => `0x${(++n).toString(16).padStart(64, "0")}` as `0x${string}`;
  })();

  it("manual mode normalizes fp", () => {
    const params = new URLSearchParams("fp=9");
    const patch = buildFirstPlayerModeDefaultParamPatch("manual", params, mkRandom);
    expect(patch.fp).toBe("0");
  });

  it("seed mode fills missing bytes32", () => {
    const params = new URLSearchParams("fps=0x1234");
    const patch = buildFirstPlayerModeDefaultParamPatch("seed", params, mkRandom);
    expect(patch.fps).toMatch(/^0x[0-9a-f]{64}$/);
    expect(patch.fpsd).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("commit_reveal mode fills salt/reveals and clears commits", () => {
    const params = new URLSearchParams("fca=0xaaa&fcb=0xbbb");
    const patch = buildFirstPlayerModeDefaultParamPatch("commit_reveal", params, mkRandom);
    expect(patch.fps).toMatch(/^0x[0-9a-f]{64}$/);
    expect(patch.fra).toMatch(/^0x[0-9a-f]{64}$/);
    expect(patch.frb).toMatch(/^0x[0-9a-f]{64}$/);
    expect(patch.fca).toBeUndefined();
    expect(patch.fcb).toBeUndefined();
  });

  it("committed_mutual_choice mode applies defaults and clears commits", () => {
    const params = new URLSearchParams("fpa=1&fpb=9");
    const patch = buildFirstPlayerModeDefaultParamPatch("committed_mutual_choice", params, mkRandom);
    expect(patch.fps).toMatch(/^0x[0-9a-f]{64}$/);
    expect(patch.fpa).toBe("1");
    expect(patch.fpb).toBe("0");
    expect(patch.fpoa).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(patch.fpob).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(patch.fpna).toMatch(/^0x[0-9a-f]{64}$/);
    expect(patch.fpnb).toMatch(/^0x[0-9a-f]{64}$/);
    expect(patch.fcoa).toBeUndefined();
    expect(patch.fcob).toBeUndefined();
  });
});
