import { describe, expect, it } from "vitest";
import {
  STAGE_VFX_OPTIONS,
  clampInt,
  formatStageVfxLabel,
} from "@/features/match/replayUiHelpers";

describe("features/match/replayUiHelpers", () => {
  it("clamps numbers into range and falls back to min for NaN", () => {
    expect(clampInt(Number.NaN, 0, 9)).toBe(0);
    expect(clampInt(-2, 0, 9)).toBe(0);
    expect(clampInt(5, 0, 9)).toBe(5);
    expect(clampInt(99, 0, 9)).toBe(9);
  });

  it("formats auto VFX label with resolved quality", () => {
    expect(formatStageVfxLabel("auto", "high")).toBe("auto (high)");
  });

  it("returns explicit VFX preference labels unchanged", () => {
    expect(formatStageVfxLabel("off", "high")).toBe("off");
    expect(formatStageVfxLabel("medium", "low")).toBe("medium");
  });

  it("keeps stage VFX option order stable", () => {
    expect(STAGE_VFX_OPTIONS.map((option) => option.value)).toEqual([
      "auto",
      "off",
      "low",
      "medium",
      "high",
    ]);
  });
});
