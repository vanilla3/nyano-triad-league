import { describe, expect, it, vi } from "vitest";
import {
  resolveReplayCompareDiverged,
  resolveReplayCompareMode,
} from "@/features/match/replayCompareState";
import type { BoardCell } from "@nyano/triad-engine";

describe("features/match/replayCompareState", () => {
  it("resolves compare mode from explicit compare mode", () => {
    const shouldAutoCompareByRulesetId = vi.fn(() => false);
    const compare = resolveReplayCompareMode({
      simOk: true,
      mode: "compare",
      resolvedRuleset: {},
      rulesetId: "v2",
      shouldAutoCompareByRulesetId,
    });
    expect(compare).toBe(true);
    expect(shouldAutoCompareByRulesetId).not.toHaveBeenCalled();
  });

  it("resolves auto compare only when unresolved ruleset and rulesetId requires comparison", () => {
    const shouldAutoCompareByRulesetId = vi.fn((rulesetId: string) => rulesetId === "legacy-v1");
    const compare = resolveReplayCompareMode({
      simOk: true,
      mode: "auto",
      resolvedRuleset: null,
      rulesetId: "legacy-v1",
      shouldAutoCompareByRulesetId,
    });
    expect(compare).toBe(true);
    expect(shouldAutoCompareByRulesetId).toHaveBeenCalledWith("legacy-v1");
  });

  it("returns false compare mode for non-sim/unsupported mode/resolved ruleset", () => {
    const shouldAutoCompareByRulesetId = vi.fn(() => true);
    expect(
      resolveReplayCompareMode({
        simOk: false,
        mode: "auto",
        resolvedRuleset: null,
        rulesetId: "legacy-v1",
        shouldAutoCompareByRulesetId,
      }),
    ).toBe(false);
    expect(
      resolveReplayCompareMode({
        simOk: true,
        mode: "v1",
        resolvedRuleset: null,
        rulesetId: "legacy-v1",
        shouldAutoCompareByRulesetId,
      }),
    ).toBe(false);
    expect(
      resolveReplayCompareMode({
        simOk: true,
        mode: "auto",
        resolvedRuleset: {},
        rulesetId: "legacy-v1",
        shouldAutoCompareByRulesetId,
      }),
    ).toBe(false);
  });

  it("resolves diverged from board equality callback", () => {
    const boardA = [null] as unknown as ReadonlyArray<BoardCell | null>;
    const boardB = [null] as unknown as ReadonlyArray<BoardCell | null>;
    const boardEqualsTrue = vi.fn(() => true);
    const boardEqualsFalse = vi.fn(() => false);

    expect(
      resolveReplayCompareDiverged({
        simOk: true,
        v1Board: boardA,
        v2Board: boardB,
        boardEquals: boardEqualsTrue,
      }),
    ).toBe(false);
    expect(
      resolveReplayCompareDiverged({
        simOk: true,
        v1Board: boardA,
        v2Board: boardB,
        boardEquals: boardEqualsFalse,
      }),
    ).toBe(true);
  });

  it("returns false diverged when sim is not ready or boards are missing", () => {
    const boardEquals = vi.fn(() => false);
    expect(
      resolveReplayCompareDiverged({
        simOk: false,
        v1Board: [] as unknown as ReadonlyArray<BoardCell | null>,
        v2Board: [] as unknown as ReadonlyArray<BoardCell | null>,
        boardEquals,
      }),
    ).toBe(false);
    expect(
      resolveReplayCompareDiverged({
        simOk: true,
        v1Board: null,
        v2Board: [] as unknown as ReadonlyArray<BoardCell | null>,
        boardEquals,
      }),
    ).toBe(false);
  });
});
