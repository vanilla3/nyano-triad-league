import { describe, expect, it } from "vitest";
import {
  computeFoilFlashIntensity,
  staticFoilEnabledForQuality,
} from "../renderers/pixi/foilFx";

describe("staticFoilEnabledForQuality", () => {
  it("enables static foil only on high tier with resolved texture", () => {
    expect(staticFoilEnabledForQuality("off", true)).toBe(false);
    expect(staticFoilEnabledForQuality("low", true)).toBe(false);
    expect(staticFoilEnabledForQuality("medium", true)).toBe(false);
    expect(staticFoilEnabledForQuality("high", false)).toBe(false);
    expect(staticFoilEnabledForQuality("high", true)).toBe(true);
  });
});

describe("computeFoilFlashIntensity", () => {
  it("returns zero for identity brightness", () => {
    expect(computeFoilFlashIntensity(1, 0.5)).toBe(0);
  });

  it("returns zero at event boundaries (progress 0 and 1)", () => {
    expect(computeFoilFlashIntensity(1.3, 0)).toBe(0);
    expect(computeFoilFlashIntensity(1.3, 1)).toBeCloseTo(0, 6);
  });

  it("peaks around mid-progress for same brightness", () => {
    const early = computeFoilFlashIntensity(1.3, 0.15);
    const mid = computeFoilFlashIntensity(1.3, 0.5);
    expect(mid).toBeGreaterThan(early);
  });

  it("clamps out-of-range progress", () => {
    expect(computeFoilFlashIntensity(1.3, -1)).toBe(0);
    expect(computeFoilFlashIntensity(1.3, 2)).toBeCloseTo(0, 6);
  });
});
