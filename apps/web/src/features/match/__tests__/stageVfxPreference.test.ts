import { describe, expect, it, vi } from "vitest";
import { runStageVfxPreferenceChange } from "@/features/match/stageVfxPreference";

describe("features/match/stageVfxPreference", () => {
  it("applies next preference, resolves quality, and pushes auto feedback label", () => {
    const setVfxPreference = vi.fn();
    const setResolvedVfxQuality = vi.fn();
    const playVfxChangeSfx = vi.fn();
    const pushStageActionFeedback = vi.fn();

    const writeVfxQuality = vi.fn();
    const resolveVfxQuality = vi.fn(() => "high" as const);
    const applyVfxQualityToDocument = vi.fn();

    runStageVfxPreferenceChange(
      {
        nextPreference: "auto",
        setVfxPreference,
        setResolvedVfxQuality,
        playVfxChangeSfx,
        pushStageActionFeedback,
      },
      {
        writeVfxQuality,
        resolveVfxQuality,
        applyVfxQualityToDocument,
      },
    );

    expect(setVfxPreference).toHaveBeenCalledWith("auto");
    expect(writeVfxQuality).toHaveBeenCalledWith("auto");
    expect(resolveVfxQuality).toHaveBeenCalledOnce();
    expect(setResolvedVfxQuality).toHaveBeenCalledWith("high");
    expect(applyVfxQualityToDocument).toHaveBeenCalledWith("high");
    expect(playVfxChangeSfx).toHaveBeenCalledOnce();
    expect(pushStageActionFeedback).toHaveBeenCalledWith("VFX auto (high)", "info");
  });

  it("keeps explicit preference label in feedback", () => {
    const pushStageActionFeedback = vi.fn();

    runStageVfxPreferenceChange(
      {
        nextPreference: "low",
        setVfxPreference: vi.fn(),
        setResolvedVfxQuality: vi.fn(),
        playVfxChangeSfx: vi.fn(),
        pushStageActionFeedback,
      },
      {
        writeVfxQuality: vi.fn(),
        resolveVfxQuality: vi.fn(() => "high" as const),
        applyVfxQualityToDocument: vi.fn(),
      },
    );

    expect(pushStageActionFeedback).toHaveBeenCalledWith("VFX low", "info");
  });
});
