import React from "react";
import { describe, expect, it } from "vitest";
import { MatchFocusHandDockHeaderRow } from "@/features/match/MatchFocusHandDockHeaderRow";

function collectDivText(node: React.ReactNode): string[] {
  const out: string[] = [];
  const walk = (value: React.ReactNode): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!React.isValidElement(value)) return;
    if (value.type === "div" && typeof value.props.children === "string") {
      out.push(value.props.children);
    }
    walk(value.props.children as React.ReactNode);
  };
  walk(node);
  return out;
}

describe("features/match/MatchFocusHandDockHeaderRow", () => {
  it("shows thinking status during ai turn", () => {
    const tree = MatchFocusHandDockHeaderRow({
      label: "手札ドック",
      isAiTurn: true,
      draftCardIndex: 2,
      draftCell: 4,
    });
    const texts = collectDivText(tree);
    expect(texts).toContain("にゃーのの番…");
  });

  it("shows selected card/cell status when available", () => {
    const tree = MatchFocusHandDockHeaderRow({
      label: "手札ドック",
      isAiTurn: false,
      draftCardIndex: 1,
      draftCell: 7,
    });
    const texts = collectDivText(tree);
    expect(texts).toContain("カード2 ｜ マスB3");
  });

  it("shows not-selected placeholders when draft values are null", () => {
    const tree = MatchFocusHandDockHeaderRow({
      label: "手札ドック",
      isAiTurn: false,
      draftCardIndex: null,
      draftCell: null,
    });
    const texts = collectDivText(tree);
    expect(texts).toContain("カード未選択 ｜ マス未選択");
  });
});
