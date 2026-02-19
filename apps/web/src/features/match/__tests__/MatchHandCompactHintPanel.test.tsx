import React from "react";
import { describe, expect, it } from "vitest";
import { MatchHandCompactHintPanel } from "@/features/match/MatchHandCompactHintPanel";

function collectElementChildren(node: React.ReactNode): React.ReactElement[] {
  return React.Children.toArray(node).filter(React.isValidElement) as React.ReactElement[];
}

describe("features/match/MatchHandCompactHintPanel", () => {
  it("renders hint container without selection summary when nothing is selected", () => {
    const tree = MatchHandCompactHintPanel({
      draftCardIndex: null,
      draftCell: null,
    });
    expect(tree.type).toBe("div");
    expect(tree.props.className).toContain("border-slate-200");
    const spans = collectElementChildren(tree.props.children).filter((child) => child.type === "span");
    expect(spans).toHaveLength(0);
  });

  it("renders selection summary when card or cell is selected", () => {
    const tree = MatchHandCompactHintPanel({
      draftCardIndex: 2,
      draftCell: 7,
    });
    const spans = collectElementChildren(tree.props.children).filter((child) => child.type === "span");
    expect(spans).toHaveLength(1);
    const summaryText = React.Children.toArray(spans[0]?.props.children).join("");
    expect(summaryText).toContain("3");
    expect(summaryText).toContain("7");
  });
});
