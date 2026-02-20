import { describe, expect, it, vi } from "vitest";
import {
  formatClassicOpenSlots,
  resolveReplayClassicState,
} from "@/features/match/replayClassicState";
import type { RulesetConfig, TranscriptV1 } from "@nyano/triad-engine";

const headerStub = {
  version: 1,
  rulesetId: "0x0000000000000000000000000000000000000000000000000000000000000000",
  seasonId: 1,
  playerA: "0x0000000000000000000000000000000000000001",
  playerB: "0x0000000000000000000000000000000000000002",
  deckA: [1n, 2n, 3n, 4n, 5n],
  deckB: [6n, 7n, 8n, 9n, 10n],
  firstPlayer: 0,
  deadline: 0,
  salt: "0x0",
} satisfies TranscriptV1["header"];

describe("features/match/replayClassicState", () => {
  it("formats classic open slot labels as 1-based indices", () => {
    expect(formatClassicOpenSlots([0, 2, 4])).toBe("1, 3, 5");
  });

  it("returns empty classic state when replay sim/ruleset/header are unavailable", () => {
    const swapResolver = vi.fn();
    const openResolver = vi.fn();
    const state = resolveReplayClassicState({
      simOk: false,
      ruleset: null,
      header: null,
      replayRevealHiddenSlots: false,
      resolveClassicSwapIndicesFn: swapResolver as never,
      resolveClassicOpenCardIndicesFn: openResolver as never,
    });
    expect(state).toEqual({
      replayClassicSwap: null,
      replayClassicOpen: null,
      replayOpenVisibleA: null,
      replayOpenVisibleB: null,
      shouldMaskReplayDeckSlots: false,
    });
    expect(swapResolver).not.toHaveBeenCalled();
    expect(openResolver).not.toHaveBeenCalled();
  });

  it("derives visible sets and masking state from classic-open result", () => {
    const swapResolver = vi.fn(() => ({ aIndex: 1, bIndex: 3 }));
    const openResolver = vi.fn(() => ({
      mode: "three_open" as const,
      playerA: [0, 2, 4],
      playerB: [1, 3, 4],
    }));
    const state = resolveReplayClassicState({
      simOk: true,
      ruleset: {} as RulesetConfig,
      header: headerStub,
      replayRevealHiddenSlots: false,
      resolveClassicSwapIndicesFn: swapResolver as never,
      resolveClassicOpenCardIndicesFn: openResolver as never,
    });

    expect(state.replayClassicSwap).toEqual({ aIndex: 1, bIndex: 3 });
    expect(state.replayClassicOpen).toEqual({
      mode: "three_open",
      playerA: [0, 2, 4],
      playerB: [1, 3, 4],
    });
    expect(Array.from(state.replayOpenVisibleA ?? [])).toEqual([0, 2, 4]);
    expect(Array.from(state.replayOpenVisibleB ?? [])).toEqual([1, 3, 4]);
    expect(state.shouldMaskReplayDeckSlots).toBe(true);
  });

  it("disables mask when hidden slots are manually revealed", () => {
    const openResolver = vi.fn(() => ({
      mode: "three_open" as const,
      playerA: [0, 1, 2],
      playerB: [2, 3, 4],
    }));
    const state = resolveReplayClassicState({
      simOk: true,
      ruleset: {} as RulesetConfig,
      header: headerStub,
      replayRevealHiddenSlots: true,
      resolveClassicSwapIndicesFn: (() => null) as never,
      resolveClassicOpenCardIndicesFn: openResolver as never,
    });
    expect(state.shouldMaskReplayDeckSlots).toBe(false);
  });
});
