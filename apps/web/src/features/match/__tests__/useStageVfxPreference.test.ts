import { describe, expect, it, vi } from "vitest";
import { createStageVfxChangeHandler } from "@/features/match/useStageVfxPreference";

describe("features/match/useStageVfxPreference", () => {
  it("creates a stage VFX handler that delegates to shared runner", () => {
    const runStageVfxPreferenceChange = vi.fn();
    const setVfxPreference = vi.fn();
    const setResolvedVfxQuality = vi.fn();
    const playVfxChangeSfx = vi.fn();
    const pushStageActionFeedback = vi.fn();

    const handleStageVfxChange = createStageVfxChangeHandler(
      {
        setVfxPreference,
        setResolvedVfxQuality,
        playVfxChangeSfx,
        pushStageActionFeedback,
      },
      { runStageVfxPreferenceChange },
    );

    handleStageVfxChange("medium");

    expect(runStageVfxPreferenceChange).toHaveBeenCalledWith({
      nextPreference: "medium",
      setVfxPreference,
      setResolvedVfxQuality,
      playVfxChangeSfx,
      pushStageActionFeedback,
    });
  });
});
