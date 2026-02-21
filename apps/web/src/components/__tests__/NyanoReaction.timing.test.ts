import { describe, expect, it } from "vitest";
import { resolveReactionCutInTiming } from "../NyanoReaction";

describe("resolveReactionCutInTiming", () => {
  it("disables burst and shortens visibility for reduced-motion", () => {
    const timing = resolveReactionCutInTiming("high", {
      reducedMotion: true,
      vfxQuality: "high",
    });
    expect(timing.allowBurst).toBe(false);
    expect(timing.burstMs).toBe(0);
    expect(timing.visibleMs).toBe(1800);
  });

  it("disables burst and shortens visibility for vfx=off", () => {
    const timing = resolveReactionCutInTiming("mid", {
      reducedMotion: false,
      vfxQuality: "off",
    });
    expect(timing.allowBurst).toBe(false);
    expect(timing.burstMs).toBe(0);
    expect(timing.visibleMs).toBe(1800);
  });

  it("keeps burst for standard tiers", () => {
    const timing = resolveReactionCutInTiming("high", {
      reducedMotion: false,
      vfxQuality: "high",
    });
    expect(timing.allowBurst).toBe(true);
    expect(timing.burstMs).toBe(860);
    expect(timing.visibleMs).toBe(3600);
  });

  it("suppresses burst and trims durations for vfx=low", () => {
    const timing = resolveReactionCutInTiming("high", {
      reducedMotion: false,
      vfxQuality: "low",
    });
    expect(timing.allowBurst).toBe(false);
    expect(timing.burstMs).toBe(406);
    expect(timing.visibleMs).toBe(2376);
  });
});
