import { describe, expect, it } from "vitest";
import {
  getClassicOpenModeLabel,
  getClassicRuleChipMeta,
  getPlayerDisplayLabel,
  getPlayerEnglishLabel,
  getUniqueClassicRuleTags,
} from "../classicRulesUi";

describe("classicRulesUi helpers", () => {
  it("deduplicates tags preserving order", () => {
    const out = getUniqueClassicRuleTags(["plus", "same", "plus", "", "same"]);
    expect(out).toEqual(["plus", "same"]);
  });

  it("resolves known tag metadata with override labels", () => {
    const open = getClassicRuleChipMeta("allOpen", { openLabel: "Open all cards" });
    expect(open.short).toBe("OPEN");
    expect(open.icon).toBe("◎");
    expect(open.title).toBe("Open all cards");

    const swap = getClassicRuleChipMeta("swap", { swapLabel: "Swap A1/B2" });
    expect(swap.short).toBe("SWAP");
    expect(swap.title).toBe("Swap A1/B2");
  });

  it("falls back for unknown tags", () => {
    const unknown = getClassicRuleChipMeta("myCustomRule");
    expect(unknown.short).toBe("MY CUSTOM RULE");
    expect(unknown.icon).toBe("•");
    expect(unknown.title).toBe("MY CUSTOM RULE");
  });

  it("provides player/open labels for UI composition", () => {
    expect(getPlayerDisplayLabel(0)).toBe("プレイヤーA");
    expect(getPlayerDisplayLabel(1)).toBe("プレイヤーB");
    expect(getPlayerEnglishLabel(0)).toBe("Player A");
    expect(getPlayerEnglishLabel(1)).toBe("Player B");
    expect(getClassicOpenModeLabel("all_open")).toBe("全公開 (ALL OPEN)");
    expect(getClassicOpenModeLabel("three_open")).toBe("3枚公開 (THREE OPEN)");
  });
});
