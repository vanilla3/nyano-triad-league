import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ClassicRulesRibbonMint } from "../ClassicRulesRibbonMint";

describe("ClassicRulesRibbonMint", () => {
  it("exports ClassicRulesRibbonMint component", async () => {
    const mod = await import("../ClassicRulesRibbonMint");
    expect(mod.ClassicRulesRibbonMint).toBeDefined();
    expect(typeof mod.ClassicRulesRibbonMint).toBe("function");
  });

  it("returns null when there are no tags and no forced card", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClassicRulesRibbonMint, { ruleTags: [], forcedCardIndex: null }),
    );
    expect(html).toBe("");
  });

  it("renders deduped chips and forced slot chip", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClassicRulesRibbonMint, {
        ruleTags: ["plus", "plus", "allOpen"],
        openLabel: "Open all cards",
        forcedCardIndex: 2,
      }),
    );

    expect(html).toContain("mint-rules-ribbon-row");
    expect(html).toContain('title="Open all cards"');
    expect(html).toContain("mint-rule-chip--forced");
    expect(html).toContain(">FIX 3<");

    const plusLabelHits = html.match(/>PLUS</g) ?? [];
    expect(plusLabelHits).toHaveLength(1);
  });
});
