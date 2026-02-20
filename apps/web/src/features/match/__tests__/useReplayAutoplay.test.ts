import { describe, expect, it } from "vitest";
import {
  resolveReplayAutoplayAdvance,
  resolveReplayAutoplayIntervalMs,
} from "@/features/match/useReplayAutoplay";

describe("features/match/useReplayAutoplay", () => {
  it("normalizes replay autoplay interval from playback speed", () => {
    expect(resolveReplayAutoplayIntervalMs(1)).toBe(1000);
    expect(resolveReplayAutoplayIntervalMs(2)).toBe(500);
    // normalizeReplayPlaybackSpeed clamps 0 to 0.5
    expect(resolveReplayAutoplayIntervalMs(0)).toBe(2000);
  });

  it("advances replay step while autoplay can continue", () => {
    const next = resolveReplayAutoplayAdvance({
      currentStep: 3,
      stepMax: 9,
    });
    expect(next).toEqual({
      nextStep: 4,
      shouldStopPlaying: false,
    });
  });

  it("stops autoplay when replay reached the final step", () => {
    const next = resolveReplayAutoplayAdvance({
      currentStep: 9,
      stepMax: 9,
    });
    expect(next).toEqual({
      nextStep: 9,
      shouldStopPlaying: true,
    });
  });
});
