import { describe, expect, it } from "vitest";
import {
  STAGE_VFX_OPTIONS,
  clampInt,
  formatStageVfxLabel,
  resolveReplayMintButtonClass,
  resolveStageVfxOptionLabel,
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

  it("formats VFX option labels with resolved quality for auto only", () => {
    const autoOption = { value: "auto", label: "auto" } as const;
    const lowOption = { value: "low", label: "low" } as const;
    expect(resolveStageVfxOptionLabel(autoOption, "medium")).toBe("auto (medium)");
    expect(resolveStageVfxOptionLabel(lowOption, "high")).toBe("low");
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

  it("adds mint pressable classes for mint theme buttons", () => {
    expect(
      resolveReplayMintButtonClass({
        baseClassName: "btn btn-sm",
        isMintTheme: true,
      }),
    ).toBe("btn btn-sm mint-pressable mint-hit");
  });

  it("adds share-action class only when requested", () => {
    expect(
      resolveReplayMintButtonClass({
        baseClassName: "btn",
        isMintTheme: true,
        isShareAction: true,
      }),
    ).toBe("btn mint-pressable mint-hit mint-share-action__btn");
    expect(
      resolveReplayMintButtonClass({
        baseClassName: "btn",
        isMintTheme: false,
        isShareAction: true,
      }),
    ).toBe("btn");
  });
});
