import { describe, expect, it } from "vitest";
import {
  applySearchParamPatch,
  buildFirstPlayerModeCanonicalParamPatch,
  buildFirstPlayerModeDefaultParamPatch,
  buildFirstPlayerModeParamPatch,
} from "../first_player_params";

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

  it("commit_reveal mode fills salt/reveals without touching commits", () => {
    const params = new URLSearchParams("fca=0xaaa&fcb=0xbbb");
    const patch = buildFirstPlayerModeDefaultParamPatch("commit_reveal", params, mkRandom);
    expect(patch.fps).toMatch(/^0x[0-9a-f]{64}$/);
    expect(patch.fra).toMatch(/^0x[0-9a-f]{64}$/);
    expect(patch.frb).toMatch(/^0x[0-9a-f]{64}$/);
    expect(Object.prototype.hasOwnProperty.call(patch, "fca")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "fcb")).toBe(false);
  });

  it("committed_mutual_choice mode applies defaults without touching commits", () => {
    const params = new URLSearchParams("fpa=1&fpb=9");
    const patch = buildFirstPlayerModeDefaultParamPatch("committed_mutual_choice", params, mkRandom);
    expect(patch.fps).toMatch(/^0x[0-9a-f]{64}$/);
    expect(patch.fpa).toBe("1");
    expect(patch.fpb).toBe("0");
    expect(patch.fpoa).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(patch.fpob).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(patch.fpna).toMatch(/^0x[0-9a-f]{64}$/);
    expect(patch.fpnb).toMatch(/^0x[0-9a-f]{64}$/);
    expect(Object.prototype.hasOwnProperty.call(patch, "fcoa")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "fcob")).toBe(false);
  });
});

describe("buildFirstPlayerModeCanonicalParamPatch", () => {
  it("includes fpm and mode defaults", () => {
    const params = new URLSearchParams("fpm=manual");
    const patch = buildFirstPlayerModeCanonicalParamPatch(
      "seed",
      params,
      () => `0x${"11".repeat(32)}` as `0x${string}`,
    );
    expect(patch.fpm).toBe("seed");
    expect(patch.fps).toMatch(/^0x[0-9a-f]{64}$/);
    expect(patch.fpsd).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("preserves commit fields in commit_reveal mode", () => {
    const params = new URLSearchParams(
      `fpm=commit_reveal&fps=0x${"11".repeat(32)}&fra=0x${"22".repeat(32)}&frb=0x${"33".repeat(32)}&fca=0x${"44".repeat(32)}&fcb=0x${"55".repeat(32)}`,
    );
    const patch = buildFirstPlayerModeCanonicalParamPatch(
      "commit_reveal",
      params,
      () => `0x${"aa".repeat(32)}` as `0x${string}`,
    );
    expect(Object.prototype.hasOwnProperty.call(patch, "fca")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "fcb")).toBe(false);
  });

  it("preserves commit fields in committed_mutual_choice mode", () => {
    const params = new URLSearchParams(
      `fpm=committed_mutual_choice&fps=0x${"11".repeat(32)}&fpa=1&fpb=0&fpoa=0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa&fpob=0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB&fpna=0x${"22".repeat(32)}&fpnb=0x${"33".repeat(32)}&fcoa=0x${"44".repeat(32)}&fcob=0x${"55".repeat(32)}`,
    );
    const patch = buildFirstPlayerModeCanonicalParamPatch(
      "committed_mutual_choice",
      params,
      () => `0x${"aa".repeat(32)}` as `0x${string}`,
    );
    expect(Object.prototype.hasOwnProperty.call(patch, "fcoa")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, "fcob")).toBe(false);
  });
});

describe("applySearchParamPatch", () => {
  it("applies set/delete and reports changed=true", () => {
    const current = new URLSearchParams("a=1&b=2");
    const { next, changed } = applySearchParamPatch(current, { a: "9", b: undefined, c: "x" });
    expect(changed).toBe(true);
    expect(next.get("a")).toBe("9");
    expect(next.has("b")).toBe(false);
    expect(next.get("c")).toBe("x");
  });

  it("keeps params and reports changed=false when patch is no-op", () => {
    const current = new URLSearchParams("a=1");
    const { next, changed } = applySearchParamPatch(current, { a: "1", b: undefined });
    expect(changed).toBe(false);
    expect(next.toString()).toBe("a=1");
  });
});
