import { describe, expect, it, vi } from "vitest";
import {
  resolveStageAssistVisibility,
  resolveStageControlsVisibility,
} from "@/features/match/useMatchStageUi";

describe("features/match/useMatchStageUi", () => {
  it("resolves stage assist visibility from focus route", () => {
    expect(resolveStageAssistVisibility(false)).toBe(true);
    expect(resolveStageAssistVisibility(true)).toBe(false);
  });

  it("keeps controls visible when not in stage focus route", () => {
    const resolveShouldShowStageSecondaryControls = vi.fn(() => false);
    const visible = resolveStageControlsVisibility({
      isStageFocusRoute: false,
      viewportWidth: 360,
      resolveShouldShowStageSecondaryControls,
    });
    expect(visible).toBe(true);
    expect(resolveShouldShowStageSecondaryControls).not.toHaveBeenCalled();
  });

  it("keeps controls visible when viewport is unavailable", () => {
    const resolveShouldShowStageSecondaryControls = vi.fn(() => false);
    const visible = resolveStageControlsVisibility({
      isStageFocusRoute: true,
      viewportWidth: null,
      resolveShouldShowStageSecondaryControls,
    });
    expect(visible).toBe(true);
    expect(resolveShouldShowStageSecondaryControls).not.toHaveBeenCalled();
  });

  it("uses injected visibility resolver when in stage focus route", () => {
    const resolveShouldShowStageSecondaryControls = vi.fn((viewportWidth: number) => viewportWidth >= 900);
    const narrow = resolveStageControlsVisibility({
      isStageFocusRoute: true,
      viewportWidth: 480,
      resolveShouldShowStageSecondaryControls,
    });
    const wide = resolveStageControlsVisibility({
      isStageFocusRoute: true,
      viewportWidth: 1200,
      resolveShouldShowStageSecondaryControls,
    });
    expect(narrow).toBe(false);
    expect(wide).toBe(true);
    expect(resolveShouldShowStageSecondaryControls).toHaveBeenCalledTimes(2);
    expect(resolveShouldShowStageSecondaryControls).toHaveBeenNthCalledWith(1, 480);
    expect(resolveShouldShowStageSecondaryControls).toHaveBeenNthCalledWith(2, 1200);
  });
});
