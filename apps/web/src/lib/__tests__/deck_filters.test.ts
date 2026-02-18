import { describe, expect, it } from "vitest";
import {
  DECK_FILTER_PRESETS,
  isDeckFilterPresetId,
  normalizeDeckFilterPresetId,
  resolveDeckFilterPreset,
} from "../deck_filters";

describe("deck_filters", () => {
  it("has unique preset ids", () => {
    const ids = DECK_FILTER_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("accepts known preset ids", () => {
    for (const preset of DECK_FILTER_PRESETS) {
      expect(isDeckFilterPresetId(preset.id)).toBe(true);
      expect(resolveDeckFilterPreset(preset.id).id).toBe(preset.id);
    }
  });

  it("falls back to all for unknown ids", () => {
    expect(isDeckFilterPresetId("unknown")).toBe(false);
    expect(resolveDeckFilterPreset("unknown").id).toBe("all");
    expect(resolveDeckFilterPreset(null).id).toBe("all");
  });

  it("maps legacy ids to canonical presets", () => {
    expect(normalizeDeckFilterPresetId("attacker")).toBe("rock");
    expect(normalizeDeckFilterPresetId("defender")).toBe("paper");
    expect(normalizeDeckFilterPresetId("other")).toBe("scissors");
    expect(resolveDeckFilterPreset("attacker").id).toBe("rock");
  });

  it("normalizes case and surrounding spaces", () => {
    expect(normalizeDeckFilterPresetId("  ROCK ")).toBe("rock");
    expect(normalizeDeckFilterPresetId(" Defender ")).toBe("paper");
    expect(resolveDeckFilterPreset("  SCISSORS ").id).toBe("scissors");
  });
});
