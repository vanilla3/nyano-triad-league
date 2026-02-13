import { describe, expect, it } from "vitest";
import { computeAiAutoMoveDelayMs } from "../turn_timing";

describe("computeAiAutoMoveDelayMs", () => {
  it("returns deterministic baseline for easy turn 0 at random=0", () => {
    const ms = computeAiAutoMoveDelayMs({
      difficulty: "easy",
      turnIndex: 0,
      random: () => 0,
    });
    expect(ms).toBe(1160);
  });

  it("increases delay for harder difficulties", () => {
    const easy = computeAiAutoMoveDelayMs({
      difficulty: "easy",
      turnIndex: 2,
      random: () => 0,
    });
    const expert = computeAiAutoMoveDelayMs({
      difficulty: "expert",
      turnIndex: 2,
      random: () => 0,
    });
    expect(expert).toBeGreaterThan(easy);
  });

  it("increases delay on later turns", () => {
    const early = computeAiAutoMoveDelayMs({
      difficulty: "normal",
      turnIndex: 1,
      random: () => 0,
    });
    const late = computeAiAutoMoveDelayMs({
      difficulty: "normal",
      turnIndex: 8,
      random: () => 0,
    });
    expect(late).toBeGreaterThan(early);
  });

  it("caps turnIndex to valid range", () => {
    const huge = computeAiAutoMoveDelayMs({
      difficulty: "hard",
      turnIndex: 99,
      random: () => 0,
    });
    const max = computeAiAutoMoveDelayMs({
      difficulty: "hard",
      turnIndex: 8,
      random: () => 0,
    });
    expect(huge).toBe(max);
  });

  it("keeps delay within expected upper bound", () => {
    const ms = computeAiAutoMoveDelayMs({
      difficulty: "expert",
      turnIndex: 8,
      random: () => 0.999999,
    });
    expect(ms).toBeLessThanOrEqual(3800);
    expect(ms).toBe(3239);
  });

  it("handles invalid random values safely", () => {
    const nan = computeAiAutoMoveDelayMs({
      difficulty: "normal",
      turnIndex: 0,
      random: () => Number.NaN,
    });
    const finite = computeAiAutoMoveDelayMs({
      difficulty: "normal",
      turnIndex: 0,
      random: () => 0.5,
    });
    expect(nan).toBe(finite);
  });
});

