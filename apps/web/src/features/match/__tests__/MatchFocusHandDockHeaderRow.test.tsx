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
      label: "Hand Dock",
      isAiTurn: true,
      draftCardIndex: 2,
      draftCell: 4,
    });
    const texts = collectDivText(tree);
    expect(texts).toContain("Thinking...");
  });

  it("shows selected card/cell status when available", () => {
    const tree = MatchFocusHandDockHeaderRow({
      label: "Hand Dock",
      isAiTurn: false,
      draftCardIndex: 1,
      draftCell: 7,
    });
    const texts = collectDivText(tree);
    expect(texts).toContain("Card 2 | Cell 7");
  });

  it("shows not-selected placeholders when draft values are null", () => {
    const tree = MatchFocusHandDockHeaderRow({
      label: "Hand Dock",
      isAiTurn: false,
      draftCardIndex: null,
      draftCell: null,
    });
    const texts = collectDivText(tree);
    expect(texts).toContain("Card not selected | Cell not selected");
  });
});
