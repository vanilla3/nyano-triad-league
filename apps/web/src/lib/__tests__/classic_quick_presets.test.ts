import { describe, expect, it } from "vitest";
import {
  buildClassicQuickMatchPath,
  buildQuickGuestMatchPath,
  buildQuickGuestStagePath,
  normalizeClassicQuickPresetId,
} from "@/lib/classic_quick_presets";

describe("classic_quick_presets", () => {
  it("normalizes preset ids safely", () => {
    expect(normalizeClassicQuickPresetId(null)).toBeNull();
    expect(normalizeClassicQuickPresetId("")).toBeNull();
    expect(normalizeClassicQuickPresetId(" classic_light ")).toBe("classic_light");
    expect(normalizeClassicQuickPresetId("CLASSIC_PLUS_SAME")).toBe("classic_plus_same");
    expect(normalizeClassicQuickPresetId("unknown")).toBeNull();
  });

  it("builds standard classic quick URLs with backward-compatible params", () => {
    const plusSame = buildClassicQuickMatchPath({ presetId: "classic_plus_same", ai: "normal" });
    expect(plusSame).toContain("/match?");
    expect(plusSame).toContain("mode=guest");
    expect(plusSame).toContain("opp=vs_nyano_ai");
    expect(plusSame).toContain("ui=mint");
    expect(plusSame).toContain("rk=classic_plus_same");
    expect(plusSame).not.toContain("&cr=");

    const light = buildClassicQuickMatchPath({ presetId: "classic_light", ai: "easy" });
    expect(light).toContain("rk=classic_custom");
    expect(light).toContain("&cr=");
  });

  it("builds quick guest match URLs for both standard and classic presets", () => {
    const standard = buildQuickGuestMatchPath({ preset: "standard", ai: "easy", ui: "mint" });
    expect(standard).toContain("/match?");
    expect(standard).toContain("rk=v2");
    expect(standard).toContain("ui=mint");
    expect(standard).not.toContain("&cr=");

    const classic = buildQuickGuestMatchPath({ preset: "classic_chaos_party", ai: "hard" });
    expect(classic).toContain("rk=classic_custom");
    expect(classic).toContain("&cr=");
  });

  it("builds quick guest stage URLs with classic custom mask propagation", () => {
    const standard = buildQuickGuestStagePath({ preset: "standard", ai: "normal" });
    expect(standard).toContain("/battle-stage?");
    expect(standard).toContain("rk=v2");
    expect(standard).not.toContain("&cr=");

    const classic = buildQuickGuestStagePath({ preset: "classic_light", ai: "normal" });
    expect(classic).toContain("rk=classic_custom");
    expect(classic).toContain("&cr=");
  });
});
