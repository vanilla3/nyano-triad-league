import React from "react";
import { describe, expect, it } from "vitest";
import type { CardData } from "@nyano/triad-engine";
import { MatchFocusHandDock } from "@/features/match/MatchFocusHandDock";
import { MatchFocusHandDockActions } from "@/features/match/MatchFocusHandDockActions";
import { MatchFocusHandDockCards } from "@/features/match/MatchFocusHandDockCards";
import { MatchFocusHandDockHeaderRow } from "@/features/match/MatchFocusHandDockHeaderRow";

function makeCard(tokenId: bigint): CardData {
  return {
    tokenId,
    edges: { up: 1, right: 2, down: 3, left: 4 },
    jankenHand: 0,
    combatStatSum: 10,
    trait: "none",
  };
}

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

function createTree(overrides?: Partial<Parameters<typeof MatchFocusHandDock>[0]>): React.ReactElement {
  return MatchFocusHandDock({
    isStageFocusRoute: true,
    headerLabel: "Hand Dock",
    isAiTurn: false,
    draftCardIndex: 1,
    draftCell: 2,
    forcedCardIndex: null,
    forcedRuleLabel: null,
    currentDeckTokens: [11n],
    cardMap: new Map<bigint, CardData>([[11n, makeCard(11n)]]),
    usedCardIndices: new Set<number>(),
    isBoardFull: false,
    enableHandDragDrop: true,
    currentPlayer: 0,
    onRecordInteraction: () => {},
    onSelectDraftCard: () => {},
    onHandCardDragStart: () => {},
    onHandCardDragEnd: () => {},
    draftWarningMarkCell: null,
    onChangeDraftWarningMarkCell: () => {},
    currentWarnRemaining: 2,
    availableCells: [0, 1, 2],
    canCommit: true,
    canUndo: true,
    onCommitMove: () => {},
    onUndoMove: () => {},
    ...overrides,
  });
}

describe("features/match/MatchFocusHandDock", () => {
  it("applies stage/inline shell class branches", () => {
    const stageTree = createTree({ isStageFocusRoute: true });
    expect(String(stageTree.props.className)).toContain("mint-focus-hand-dock--stage");
    expect(String(stageTree.props.className)).not.toContain("mint-focus-hand-dock--inline");

    const inlineTree = createTree({ isStageFocusRoute: false });
    expect(String(inlineTree.props.className)).toContain("mint-focus-hand-dock--inline");
    expect(String(inlineTree.props.className)).not.toContain("mint-focus-hand-dock--stage");
  });

  it("renders forced card badge only when forced index is present", () => {
    const treeWithoutForced = createTree({ forcedCardIndex: null });
    const badgeWithoutForced = collectElementsByType(treeWithoutForced, "div").find((node) =>
      String(node.props.className).includes("mint-order-lock-badge"),
    );
    expect(badgeWithoutForced).toBeUndefined();

    const treeWithForced = createTree({ forcedCardIndex: 3, forcedRuleLabel: "OPEN" });
    const badgeWithForced = collectElementsByType(treeWithForced, "div").find((node) =>
      String(node.props.className).includes("mint-order-lock-badge"),
    );
    expect(badgeWithForced).toBeTruthy();
  });

  it("forwards key props to extracted child components", () => {
    const tree = createTree({
      isAiTurn: true,
      draftCardIndex: null,
      draftCell: null,
      canCommit: false,
      canUndo: false,
    });

    const header = collectElementsByType(tree, MatchFocusHandDockHeaderRow)[0];
    const cards = collectElementsByType(tree, MatchFocusHandDockCards)[0];
    const actions = collectElementsByType(tree, MatchFocusHandDockActions)[0];

    expect(header?.props.isAiTurn).toBe(true);
    expect(header?.props.draftCardIndex).toBeNull();
    expect(cards?.props.selectedCardIndex).toBeNull();
    expect(cards?.props.draftCell).toBeUndefined();
    expect(actions?.props.canCommit).toBe(false);
    expect(actions?.props.canUndo).toBe(false);
  });
});
