import { describe, expect, it } from "vitest";
import {
  normalizePreloadTokenIds,
  texturePreloadConcurrencyForQuality,
} from "../renderers/pixi/preloadPolicy";

describe("texturePreloadConcurrencyForQuality", () => {
  it("keeps off/low tiers minimal", () => {
    expect(texturePreloadConcurrencyForQuality("off")).toBe(1);
    expect(texturePreloadConcurrencyForQuality("low")).toBe(1);
  });

  it("uses higher parallelism on stronger tiers", () => {
    expect(texturePreloadConcurrencyForQuality("medium")).toBe(2);
    expect(texturePreloadConcurrencyForQuality("high")).toBe(3);
  });
});

describe("normalizePreloadTokenIds", () => {
  it("dedupes while keeping stable order", () => {
    expect(normalizePreloadTokenIds(["2", "1", "2", "3", "1"])).toEqual(["2", "1", "3"]);
  });

  it("trims whitespace and removes empty entries", () => {
    expect(normalizePreloadTokenIds([" 10 ", "", "   ", "11"])).toEqual(["10", "11"]);
  });
});
