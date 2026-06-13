import { describe, expect, it } from "vitest";
import {
  computeStageBoardSizing,
  shouldShowStageSecondaryControls,
} from "../stage_layout";

describe("computeStageBoardSizing", () => {
  it("keeps battle-stage board within viewport constraints on desktop", () => {
    const size = computeStageBoardSizing({
      viewportWidthPx: 1920,
      viewportHeightPx: 1080,
      kind: "battle",
    });

    expect(size.maxWidthPx).toBeLessThanOrEqual(1120);
    expect(size.maxWidthPx).toBeLessThanOrEqual(1920 - 92);
    expect(size.maxWidthPx).toBeLessThanOrEqual(1080 - 400);
    expect(size.minHeightPx).toBeLessThanOrEqual(size.maxWidthPx);
  });

  it("keeps battle-stage board visible on narrow mobile viewports", () => {
    const size = computeStageBoardSizing({
      viewportWidthPx: 390,
      viewportHeightPx: 844,
      kind: "battle",
    });

    expect(size.maxWidthPx).toBeLessThanOrEqual(390 - 24);
    expect(size.maxWidthPx).toBeGreaterThanOrEqual(260);
    expect(size.minHeightPx).toBeGreaterThanOrEqual(220);
  });

  it("allows replay-stage to use more board area than battle-stage at same viewport", () => {
    const battle = computeStageBoardSizing({
      viewportWidthPx: 1366,
      viewportHeightPx: 768,
      kind: "battle",
    });
    const replay = computeStageBoardSizing({
      viewportWidthPx: 1366,
      viewportHeightPx: 768,
      kind: "replay",
    });

    expect(replay.maxWidthPx).toBeGreaterThanOrEqual(battle.maxWidthPx);
    expect(replay.minHeightPx).toBeGreaterThanOrEqual(battle.minHeightPx);
  });

  it("falls back to safe bounds for invalid viewport inputs", () => {
    const size = computeStageBoardSizing({
      viewportWidthPx: Number.NaN,
      viewportHeightPx: Number.NaN,
      kind: "replay",
    });

    expect(size.maxWidthPx).toBeGreaterThanOrEqual(260);
    expect(size.minHeightPx).toBeGreaterThanOrEqual(220);
    expect(size.minHeightPx).toBeLessThanOrEqual(size.maxWidthPx);
  });

  it("uses desktop default for stage secondary controls only above breakpoint", () => {
    expect(shouldShowStageSecondaryControls(390)).toBe(false);
    expect(shouldShowStageSecondaryControls(768)).toBe(false);
    expect(shouldShowStageSecondaryControls(769)).toBe(true);
  });

  it("falls back to desktop visibility for invalid width input", () => {
    expect(shouldShowStageSecondaryControls(Number.NaN)).toBe(true);
  });
});
