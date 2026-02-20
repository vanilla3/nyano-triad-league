import { describe, expect, it } from "vitest";
import {
  formatReplayToolbarHighlightStatus,
  resolveNextReplayHighlightStep,
  resolvePrevReplayHighlightStep,
  resolveReplayCurrentHighlightIndex,
} from "@/features/match/replayHighlightNavigation";

describe("features/match/replayHighlightNavigation", () => {
  const highlights = [{ step: 1 }, { step: 4 }, { step: 7 }];

  it("resolves next highlight step with wrap-around", () => {
    expect(resolveNextReplayHighlightStep(highlights, 0)).toBe(1);
    expect(resolveNextReplayHighlightStep(highlights, 4)).toBe(7);
    expect(resolveNextReplayHighlightStep(highlights, 8)).toBe(1);
  });

  it("resolves previous highlight step with wrap-around", () => {
    expect(resolvePrevReplayHighlightStep(highlights, 8)).toBe(7);
    expect(resolvePrevReplayHighlightStep(highlights, 4)).toBe(1);
    expect(resolvePrevReplayHighlightStep(highlights, 0)).toBe(7);
  });

  it("returns null for next/prev when highlight list is empty", () => {
    expect(resolveNextReplayHighlightStep([], 3)).toBeNull();
    expect(resolvePrevReplayHighlightStep([], 3)).toBeNull();
  });

  it("resolves current highlight index", () => {
    expect(resolveReplayCurrentHighlightIndex(highlights, 4)).toBe(1);
    expect(resolveReplayCurrentHighlightIndex(highlights, 5)).toBe(-1);
    expect(resolveReplayCurrentHighlightIndex([], 0)).toBe(-1);
  });

  it("formats toolbar highlight status text", () => {
    expect(formatReplayToolbarHighlightStatus({ highlightCount: 0, currentHighlightIdx: -1 })).toBe("0 highlights");
    expect(formatReplayToolbarHighlightStatus({ highlightCount: 3, currentHighlightIdx: -1 })).toBe("3 highlights");
    expect(formatReplayToolbarHighlightStatus({ highlightCount: 3, currentHighlightIdx: 1 })).toBe("2/3 highlights");
  });
});
