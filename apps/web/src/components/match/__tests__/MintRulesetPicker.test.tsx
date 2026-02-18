import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import type { ClassicRulesConfigV1 } from "@nyano/triad-engine";
import { MintRulesetPicker } from "../MintRulesetPicker";

const EMPTY_CLASSIC: ClassicRulesConfigV1 = {
  swap: false,
  reverse: false,
  aceKiller: false,
  plus: false,
  same: false,
  order: false,
  chaos: false,
  allOpen: false,
  threeOpen: false,
  typeAscend: false,
  typeDescend: false,
};

describe("MintRulesetPicker", () => {
  it("exports component", async () => {
    const mod = await import("../MintRulesetPicker");
    expect(mod.MintRulesetPicker).toBeDefined();
    expect(typeof mod.MintRulesetPicker).toBe("function");
  });

  it("renders family row and current summary for non-classic ruleset", () => {
    const html = renderToStaticMarkup(
      React.createElement(MintRulesetPicker, {
        rulesetKey: "v2",
        classicConfig: EMPTY_CLASSIC,
        classicRuleTags: [],
        onSelectRulesetKey: vi.fn(),
        onSetClassicMask: vi.fn(),
      }),
    );

    expect(html).toContain("mint-ruleset-picker");
    expect(html).toContain("ルール設定 (Rules setup)");
    expect(html).toContain("data-testid=\"mint-ruleset-family-v2\"");
    expect(html).toContain("aria-pressed=\"true\"");
    expect(html).toContain("現在 (Current):");
    expect(html).toContain("v2 shadow+tactics");
    expect(html).not.toContain("ルールのヒント (Rule help)");
  });

  it("renders classic custom controls and japanese-first labels", () => {
    const html = renderToStaticMarkup(
      React.createElement(MintRulesetPicker, {
        rulesetKey: "classic_custom",
        classicConfig: { ...EMPTY_CLASSIC, plus: true, same: true },
        classicRuleTags: ["plus", "same"],
        onSelectRulesetKey: vi.fn(),
        onSetClassicMask: vi.fn(),
      }),
    );

    expect(html).toContain("data-testid=\"mint-ruleset-classic-custom-mode\"");
    expect(html).toContain("data-testid=\"mint-ruleset-custom-toggle-reverse\"");
    expect(html).toContain("data-testid=\"mint-ruleset-custom-open-three\"");
    expect(html).toContain("クラシック カスタム (classic custom: plus + same)");
    expect(html).toContain("順番固定 (Order)");
    expect(html).toContain("全公開 (All Open)");
    expect(html).toContain("強化 (Type Ascend)");
    expect(html).toContain("ルールのヒント (Rule help)");
  });
});
