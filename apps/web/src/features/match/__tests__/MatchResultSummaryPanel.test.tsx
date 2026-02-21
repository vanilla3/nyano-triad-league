import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MatchResultSummaryPanel } from "@/features/match/MatchResultSummaryPanel";

describe("features/match/MatchResultSummaryPanel", () => {
  it("renders winner summary when result is present", () => {
    const html = renderToStaticMarkup(
      <MatchResultSummaryPanel
        isRpg={false}
        isStageFocusRoute={false}
        result={{ winner: "A", tilesA: 6, tilesB: 3, matchId: "match-1" }}
      />,
    );
    expect(html).toContain("Winner:");
    expect(html).toContain("tiles A/B = 6/3");
    expect(html).toContain("Match ID: match-1");
  });

  it("renders pending summary with stage-focus muted class when result is missing", () => {
    const html = renderToStaticMarkup(
      <MatchResultSummaryPanel
        isRpg={false}
        isStageFocusRoute
        result={null}
      />,
    );
    expect(html).toContain("stage-focus-side-panel--muted");
    expect(html).not.toContain("Winner:");
  });

  it("uses rpg style shell in RPG mode", () => {
    const html = renderToStaticMarkup(
      <MatchResultSummaryPanel
        isRpg
        isStageFocusRoute={false}
        result={{ winner: "B", tilesA: 2, tilesB: 7, matchId: "match-2" }}
      />,
    );
    expect(html).toContain("rounded-lg p-3 text-xs");
    expect(html).toContain("background:rgba(0,0,0,0.4)");
  });
});
