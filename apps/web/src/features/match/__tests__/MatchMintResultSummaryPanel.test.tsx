import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MatchMintResultSummaryPanel } from "@/features/match/MatchMintResultSummaryPanel";

describe("features/match/MatchMintResultSummaryPanel", () => {
  it("renders winner summary when result is present", () => {
    const html = renderToStaticMarkup(
      <MatchMintResultSummaryPanel
        result={{ winner: "A", tilesA: 6, tilesB: 3, matchId: "0xabc" }}
        pendingMessage="pending"
      />,
    );
    expect(html).toContain("Winner:");
    expect(html).toContain("tiles A/B = 6/3");
    expect(html).toContain("matchId: 0xabc");
  });

  it("renders pending branch when result is null", () => {
    const html = renderToStaticMarkup(
      <MatchMintResultSummaryPanel
        result={null}
        pendingMessage="wait for turns"
      />,
    );
    expect(html).toContain("wait for turns");
    expect(html).toContain("rounded-xl border px-3 py-2 text-xs");
  });

  it("uses mint surface vars in winner branch", () => {
    const html = renderToStaticMarkup(
      <MatchMintResultSummaryPanel
        result={{ winner: "B", tilesA: 4, tilesB: 5, matchId: "0xdef" }}
        pendingMessage="pending"
      />,
    );
    expect(html).toContain("--mint-surface-dim");
    expect(html).toContain("--mint-accent-muted");
  });
});
