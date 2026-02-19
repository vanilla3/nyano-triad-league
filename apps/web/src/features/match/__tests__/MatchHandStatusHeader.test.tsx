import React from "react";
import { describe, expect, it } from "vitest";
import { MatchHandStatusHeader } from "@/features/match/MatchHandStatusHeader";

function collectElementChildren(node: React.ReactNode): React.ReactElement[] {
  return React.Children.toArray(node).filter(React.isValidElement) as React.ReactElement[];
}

describe("features/match/MatchHandStatusHeader", () => {
  it("uses mint style and renders forced-order badge in mint mode", () => {
    const tree = MatchHandStatusHeader({
      isMintUi: true,
      isRpg: false,
      currentPlayer: 0,
      draftCell: null,
      isHandDragging: false,
      classicForcedCardIndex: 2,
      classicForcedRuleLabel: "classic",
    });
    expect(tree.type).toBe("div");
    expect(tree.props.className).toBe("text-xs font-semibold text-mint-text-secondary");
    const children = collectElementChildren(tree.props.children);
    const badge = children.find((child) => child.props.className?.includes("mint-order-lock-badge"));
    expect(badge?.props.role).toBe("status");
    expect(badge?.props["aria-live"]).toBe("polite");
  });

  it("uses rpg style and does not render mint forced-order badge", () => {
    const tree = MatchHandStatusHeader({
      isMintUi: false,
      isRpg: true,
      currentPlayer: 1,
      draftCell: 4,
      isHandDragging: true,
      classicForcedCardIndex: 1,
      classicForcedRuleLabel: "classic",
    });
    expect(tree.props.className).toBe("text-xs font-bold uppercase tracking-wider");
    expect(tree.props.style).toEqual({
      fontFamily: "'Cinzel', serif",
      color: "var(--rpg-text-gold, #E8D48B)",
    });
    const children = collectElementChildren(tree.props.children);
    const badge = children.find((child) => child.props.className?.includes("mint-order-lock-badge"));
    expect(badge).toBeUndefined();
  });

  it("uses standard style in non-mint non-rpg mode", () => {
    const tree = MatchHandStatusHeader({
      isMintUi: false,
      isRpg: false,
      currentPlayer: 0,
      draftCell: null,
      isHandDragging: false,
      classicForcedCardIndex: null,
      classicForcedRuleLabel: null,
    });
    expect(tree.props.className).toBe("text-xs font-medium text-slate-600");
    expect(tree.props.style).toBeUndefined();
  });
});
