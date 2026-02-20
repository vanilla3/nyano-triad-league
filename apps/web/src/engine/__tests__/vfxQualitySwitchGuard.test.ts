import { describe, expect, it } from "vitest";
import { boardLayerTokensForQuality } from "../renderers/pixi/boardLayerTokens";
import {
  animDurationsForQuality,
  vfxFeatureFlagsForQuality,
} from "../renderers/pixi/cellAnimations";
import { staticFoilEnabledForQuality } from "../renderers/pixi/foilFx";
import { texturePreloadConcurrencyForQuality } from "../renderers/pixi/preloadPolicy";
import type { VfxQuality } from "@/lib/visual/visualSettings";

const TIERS: readonly VfxQuality[] = ["off", "low", "medium", "high"];

describe("vfx quality switch guard", () => {
  it("keeps duration/token/preload policy valid for all tiers", () => {
    for (const tier of TIERS) {
      const durations = animDurationsForQuality(tier);
      const tokens = boardLayerTokensForQuality(tier);
      const preload = texturePreloadConcurrencyForQuality(tier);

      expect(durations.placeMs).toBeGreaterThanOrEqual(0);
      expect(durations.flipMs).toBeGreaterThanOrEqual(0);
      expect(durations.flipStaggerMs).toBeGreaterThanOrEqual(0);
      expect(tokens.boardShadowAlpha).toBeGreaterThan(0);
      expect(tokens.cellShadowBaseAlpha).toBeGreaterThan(0);
      expect(preload).toBeGreaterThanOrEqual(0);
    }
  });

  it("enables foil features only on high tier", () => {
    expect(vfxFeatureFlagsForQuality("off").eventFoilFlash).toBe(false);
    expect(vfxFeatureFlagsForQuality("low").eventFoilFlash).toBe(false);
    expect(vfxFeatureFlagsForQuality("medium").eventFoilFlash).toBe(false);
    expect(vfxFeatureFlagsForQuality("high").eventFoilFlash).toBe(true);

    expect(staticFoilEnabledForQuality("medium", true)).toBe(false);
    expect(staticFoilEnabledForQuality("high", false)).toBe(false);
    expect(staticFoilEnabledForQuality("high", true)).toBe(true);
  });
});
