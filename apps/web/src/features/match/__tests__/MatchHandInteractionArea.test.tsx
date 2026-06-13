import React from "react";
import { describe, expect, it, vi } from "vitest";
import type { CardData } from "@nyano/triad-engine";
import { MatchHandCardsPanel } from "@/features/match/MatchHandCardsPanel";
import { MatchHandCompactHintPanel } from "@/features/match/MatchHandCompactHintPanel";
import { MatchHandInteractionArea } from "@/features/match/MatchHandInteractionArea";
import { MatchHandStatusHeader } from "@/features/match/MatchHandStatusHeader";
import { MatchTurnActionPanel } from "@/features/match/MatchTurnActionPanel";

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

function createTree(overrides?: Partial<Parameters<typeof MatchHandInteractionArea>[0]>): React.ReactElement {
  return MatchHandInteractionArea({
    isStageFocusRoute: false,
    showStageControls: true,
    showFocusHandDock: false,
    isMintUi: true,
    isRpg: false,
    currentPlayer: 0,
    draftCell: 3,
    isHandDragging: false,
    classicForcedCardIndex: null,
    classicForcedRuleLabel: null,
    currentHandCards: [makeCard(11n)],
    usedCardIndices: new Set<number>(),
    draftCardIndex: 1,
    deckTokenIds: [11n],
    cardMap: new Map<bigint, CardData>([[11n, makeCard(11n)]]),
    isAiTurn: false,
    isBoardFull: false,
    turnsCount: 2,
    enableHandDragDrop: true,
    onRecordInteraction: () => {},
    onSelectDraftCard: () => {},
    onHandCardDragStart: () => {},
    onHandCardDragEnd: () => {},
    currentWarnRemaining: 2,
    availableCells: [0, 1, 2],
    draftWarningMarkCell: null,
    isVsNyanoAi: true,
    aiAutoPlay: false,
    onChangeDraftWarningMarkCell: () => {},
    onCommitMove: () => {},
    onUndoMove: () => {},
    onAiMove: () => {},
    ...overrides,
  });
}

describe("features/match/MatchHandInteractionArea", () => {
  it("renders hand interaction panels when controls are visible and focus dock is hidden", () => {
    const tree = createTree({
      isStageFocusRoute: false,
      showStageControls: false,
      showFocusHandDock: false,
    });
    expect(collectElementsByType(tree, MatchHandStatusHeader)).toHaveLength(1);
    expect(collectElementsByType(tree, MatchHandCardsPanel)).toHaveLength(1);
    expect(collectElementsByType(tree, MatchTurnActionPanel)).toHaveLength(1);
    expect(collectElementsByType(tree, MatchHandCompactHintPanel)).toHaveLength(0);
  });

  it("renders compact hint when focus dock is shown", () => {
    const tree = createTree({
      showFocusHandDock: true,
    });
    expect(collectElementsByType(tree, MatchHandCompactHintPanel)).toHaveLength(1);
    expect(collectElementsByType(tree, MatchHandStatusHeader)).toHaveLength(0);
  });

  it("forwards mint select handler with telemetry interaction tracking", () => {
    const onRecordInteraction = vi.fn();
    const onSelectDraftCard = vi.fn();
    const tree = createTree({
      onRecordInteraction,
      onSelectDraftCard,
      turnsCount: 0,
    });
    const cardsPanel = collectElementsByType(tree, MatchHandCardsPanel)[0];
    const actionPanel = collectElementsByType(tree, MatchTurnActionPanel)[0];

    cardsPanel?.props.onSelectMintCard(4);
    expect(onRecordInteraction).toHaveBeenCalledTimes(1);
    expect(onSelectDraftCard).toHaveBeenCalledWith(4);
    expect(actionPanel?.props.canUndo).toBe(false);
  });
});
