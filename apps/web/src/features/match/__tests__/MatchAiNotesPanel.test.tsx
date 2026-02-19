import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MatchAiNotesPanel } from "@/features/match/MatchAiNotesPanel";

describe("features/match/MatchAiNotesPanel", () => {
  it("returns null when hidden", () => {
    const tree = MatchAiNotesPanel({
      isVisible: false,
      isRpg: false,
      isStageFocusRoute: false,
      noteCount: 0,
      children: null,
    });
    expect(tree).toBeNull();
  });

  it("renders note summary and children in standard mode", () => {
    const html = renderToStaticMarkup(
      <MatchAiNotesPanel
        isVisible
        isRpg={false}
        isStageFocusRoute
        noteCount={3}
      >
        <div>notes</div>
      </MatchAiNotesPanel>,
    );
    expect(html).toContain("Nyano AI (3)");
    expect(html).toContain("notes");
    expect(html).toContain("stage-focus-side-panel");
  });

  it("uses RPG style shell in rpg mode", () => {
    const html = renderToStaticMarkup(
      <MatchAiNotesPanel
        isVisible
        isRpg
        isStageFocusRoute={false}
        noteCount={1}
      >
        <div>n</div>
      </MatchAiNotesPanel>,
    );
    expect(html).toContain("rounded-lg p-2 text-xs");
    expect(html).toContain("background:rgba(0,0,0,0.3)");
  });
});
