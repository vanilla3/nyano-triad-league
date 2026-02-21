import { describe, expect, it } from "vitest";
import {
  clampReplayStep,
  nextReplayAutoplayStep,
  normalizeReplayPlaybackSpeed,
  replayPhaseInfo,
  replayStepProgress,
  replayStepStatusText,
} from "../replay_timeline";

describe("clampReplayStep", () => {
  it("clamps step to a valid range", () => {
    expect(clampReplayStep(-4, 9)).toBe(0);
    expect(clampReplayStep(4, 9)).toBe(4);
    expect(clampReplayStep(99, 9)).toBe(9);
  });
});

describe("replayStepProgress", () => {
  it("returns a percent from clamped values", () => {
    expect(replayStepProgress(0, 9)).toBe(0);
    expect(replayStepProgress(5, 9)).toBe(56);
    expect(replayStepProgress(20, 9)).toBe(100);
  });
});

describe("replayStepStatusText", () => {
  it("formats setup and turn labels", () => {
    expect(replayStepStatusText(0)).toBe("Initial board state");
    expect(replayStepStatusText(7)).toBe("After turn 7");
  });
});

describe("replayPhaseInfo", () => {
  it("returns dynamic phases with default triad length", () => {
    expect(replayPhaseInfo(0, 9)).toEqual({ label: "Setup", tone: "setup" });
    expect(replayPhaseInfo(2, 9)).toEqual({ label: "Opening", tone: "opening" });
    expect(replayPhaseInfo(5, 9)).toEqual({ label: "Midgame", tone: "mid" });
    expect(replayPhaseInfo(8, 9)).toEqual({ label: "Endgame", tone: "end" });
    expect(replayPhaseInfo(9, 9)).toEqual({ label: "Final", tone: "final" });
  });

  it("adapts when stepMax is shorter", () => {
    expect(replayPhaseInfo(1, 3)).toEqual({ label: "Opening", tone: "opening" });
    expect(replayPhaseInfo(2, 3)).toEqual({ label: "Midgame", tone: "mid" });
    expect(replayPhaseInfo(3, 3)).toEqual({ label: "Final", tone: "final" });
  });
});

describe("nextReplayAutoplayStep", () => {
  it("returns next step or null at the end", () => {
    expect(nextReplayAutoplayStep(0, 9)).toBe(1);
    expect(nextReplayAutoplayStep(8, 9)).toBe(9);
    expect(nextReplayAutoplayStep(9, 9)).toBeNull();
    expect(nextReplayAutoplayStep(0, 0)).toBeNull();
  });
});

describe("normalizeReplayPlaybackSpeed", () => {
  it("keeps exact allowed values and normalizes invalid values", () => {
    expect(normalizeReplayPlaybackSpeed(1.5)).toBe(1.5);
    expect(normalizeReplayPlaybackSpeed(1.49)).toBe(1.5);
    expect(normalizeReplayPlaybackSpeed(2.9)).toBe(3);
    expect(normalizeReplayPlaybackSpeed(Number.NaN)).toBe(1);
  });
});
