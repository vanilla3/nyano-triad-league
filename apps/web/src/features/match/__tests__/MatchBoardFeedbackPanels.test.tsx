import React from "react";
import { describe, expect, it } from "vitest";
import { LastMoveFeedback } from "@/components/BoardFlipAnimator";
import { MatchBoardFeedbackPanels } from "@/features/match/MatchBoardFeedbackPanels";

function collectElementsByType(node: React.ReactNode, type: unknown): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  const walk = (value: React.ReactNode): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!React.isValidElement(value)) return;
    if (value.type === type) out.push(value);
    walk(value.props.children as React.ReactNode);
  };
  walk(node);
  return out;
}

describe("features/match/MatchBoardFeedbackPanels", () => {
  it("renders last move feedback only while animation is active", () => {
    const activeTree = MatchBoardFeedbackPanels({
      isAnimating: true,
      placedCell: 4,
      flippedCells: [1, 2],
      turnPlayerLabel: "B",
      isStageFocusRoute: false,
      showLegacyStatusSummary: false,
      isRpg: false,
      lastFlipSummaryText: "x",
    });
    const activeFeedback = collectElementsByType(activeTree, LastMoveFeedback)[0];
    expect(activeFeedback?.props.placedCell).toBe(4);
    expect(activeFeedback?.props.flippedCells).toEqual([1, 2]);
    expect(activeFeedback?.props.turnPlayer).toBe("B");

    const idleTree = MatchBoardFeedbackPanels({
      isAnimating: false,
      placedCell: null,
      flippedCells: [],
      turnPlayerLabel: "A",
      isStageFocusRoute: false,
      showLegacyStatusSummary: false,
      isRpg: false,
      lastFlipSummaryText: "x",
    });
    expect(collectElementsByType(idleTree, LastMoveFeedback)).toHaveLength(0);
  });

  it("renders legacy summary in standard mode when route is not focused", () => {
    const tree = MatchBoardFeedbackPanels({
      isAnimating: false,
      placedCell: null,
      flippedCells: [],
      turnPlayerLabel: "A",
      isStageFocusRoute: false,
      showLegacyStatusSummary: true,
      isRpg: false,
      lastFlipSummaryText: "flip!",
    });
    const summary = collectElementsByType(tree, "div").find((node) =>
      String(node.props.className).includes("border-amber-200"),
    );
    expect(summary).toBeTruthy();
    expect(String(summary?.props.children)).toContain("flip!");
  });

  it("hides legacy summary on stage focus route", () => {
    const tree = MatchBoardFeedbackPanels({
      isAnimating: false,
      placedCell: null,
      flippedCells: [],
      turnPlayerLabel: "A",
      isStageFocusRoute: true,
      showLegacyStatusSummary: true,
      isRpg: true,
      lastFlipSummaryText: "flip!",
    });
    const summary = collectElementsByType(tree, "div").find((node) =>
      String(node.props.className).includes("rounded-lg"),
    );
    expect(summary).toBeUndefined();
  });
});
