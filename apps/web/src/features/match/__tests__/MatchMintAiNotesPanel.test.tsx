import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MatchMintAiNotesPanel } from "@/features/match/MatchMintAiNotesPanel";

describe("features/match/MatchMintAiNotesPanel", () => {
  it("returns null when hidden", () => {
    const tree = MatchMintAiNotesPanel({
      isVisible: false,
      noteCount: 0,
      children: null,
    });
    expect(tree).toBeNull();
  });

  it("renders summary and children", () => {
    const html = renderToStaticMarkup(
      <MatchMintAiNotesPanel isVisible noteCount={4}>
        <div>notes</div>
      </MatchMintAiNotesPanel>,
    );
    expect(html).toContain("Nyano AI (4)");
    expect(html).toContain("notes");
  });

  it("keeps mint panel shell classes", () => {
    const html = renderToStaticMarkup(
      <MatchMintAiNotesPanel isVisible noteCount={1}>
        <div>x</div>
      </MatchMintAiNotesPanel>,
    );
    expect(html).toContain("rounded-xl border p-3 text-xs");
    expect(html).toContain("--mint-accent-muted");
  });
});
