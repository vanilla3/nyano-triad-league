import { describe, expect, it } from "vitest";
import { CARD_TIER_THRESHOLDS, edgeSumOf, resolveCardTier } from "@/lib/nyano/cardTier";

describe("resolveCardTier", () => {
  it("classifies edge sums into tiers at the documented thresholds", () => {
    expect(resolveCardTier(40).tier).toBe("s");
    expect(resolveCardTier(CARD_TIER_THRESHOLDS.s).tier).toBe("s");
    expect(resolveCardTier(CARD_TIER_THRESHOLDS.s - 1).tier).toBe("a");
    expect(resolveCardTier(CARD_TIER_THRESHOLDS.a).tier).toBe("a");
    expect(resolveCardTier(CARD_TIER_THRESHOLDS.a - 1).tier).toBe("b");
    expect(resolveCardTier(CARD_TIER_THRESHOLDS.b).tier).toBe("b");
    expect(resolveCardTier(CARD_TIER_THRESHOLDS.b - 1).tier).toBe("c");
    expect(resolveCardTier(0).tier).toBe("c");
  });

  it("exposes display labels for every tier", () => {
    for (const sum of [40, 30, 26, 5]) {
      const info = resolveCardTier(sum);
      expect(info.label.length).toBeGreaterThan(0);
      expect(info.labelJa.length).toBeGreaterThan(0);
    }
  });
});

describe("edgeSumOf", () => {
  it("sums numeric and bigint edges", () => {
    expect(edgeSumOf({ up: 1, right: 2, down: 3, left: 4 })).toBe(10);
    expect(edgeSumOf({ up: 9n, right: 9n, down: 9n, left: 9n })).toBe(36);
  });
});
