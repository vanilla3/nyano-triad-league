import React from "react";
import { describe, expect, it, vi } from "vitest";
import type { CardData } from "@nyano/triad-engine";
import { MatchFocusHandDockCards } from "@/features/match/MatchFocusHandDockCards";

function makeCard(tokenId: bigint): CardData {
  return {
    tokenId,
    edges: { up: 1, right: 2, down: 3, left: 4 },
    jankenHand: 0,
    combatStatSum: 10,
    trait: "none",
  };
}

function collectElementsByType(node: React.ReactNode, type: string): React.ReactElement[] {
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

describe("features/match/MatchFocusHandDockCards", () => {
  it("renders loading card shell when card data is missing", () => {
    const tree = MatchFocusHandDockCards({
      currentDeckTokens: [11n],
      cardMap: new Map<bigint, CardData>(),
      usedCardIndices: new Set<number>(),
      selectedCardIndex: 0,
      forcedCardIndex: null,
      isAiTurn: false,
      isBoardFull: false,
      enableHandDragDrop: true,
      currentPlayer: 0,
      onRecordInteraction: () => {},
      onSelectDraftCard: () => {},
      onHandCardDragStart: () => {},
      onHandCardDragEnd: () => {},
    });
    const button = collectElementsByType(tree, "button")[0];
    expect(button?.props.className).toContain("mint-focus-hand-card--loading");
    expect(button?.props.disabled).toBe(true);
    expect(button?.props["aria-label"]).toContain("loading");
  });

  it("forwards click and drag handlers for enabled cards", () => {
    const onRecordInteraction = vi.fn();
    const onSelectDraftCard = vi.fn();
    const onHandCardDragStart = vi.fn();
    const onHandCardDragEnd = vi.fn();
    const tree = MatchFocusHandDockCards({
      currentDeckTokens: [11n],
      cardMap: new Map<bigint, CardData>([[11n, makeCard(11n)]]),
      usedCardIndices: new Set<number>(),
      selectedCardIndex: 0,
      forcedCardIndex: 0,
      isAiTurn: false,
      isBoardFull: false,
      enableHandDragDrop: true,
      currentPlayer: 0,
      onRecordInteraction,
      onSelectDraftCard,
      onHandCardDragStart,
      onHandCardDragEnd,
    });

    const button = collectElementsByType(tree, "button")[0];
    const fixedBadge = collectElementsByType(tree, "span").find((node) =>
      String(node.props.className).includes("mint-focus-hand-card__fixed-badge"),
    );
    expect(fixedBadge).toBeTruthy();

    button?.props.onClick();
    expect(onRecordInteraction).toHaveBeenCalledTimes(1);
    expect(onSelectDraftCard).toHaveBeenCalledWith(0);

    const setData = vi.fn();
    const dragEvent = {
      dataTransfer: {
        effectAllowed: "none",
        setData,
      },
      preventDefault: vi.fn(),
    } as unknown as React.DragEvent<HTMLButtonElement>;
    button?.props.onDragStart(dragEvent);
    expect(dragEvent.dataTransfer.effectAllowed).toBe("move");
    expect(setData).toHaveBeenNthCalledWith(1, "application/x-nytl-card-index", "0");
    expect(setData).toHaveBeenNthCalledWith(2, "text/plain", "0");
    expect(onHandCardDragStart).toHaveBeenCalledWith(0);

    button?.props.onDragEnd();
    expect(onHandCardDragEnd).toHaveBeenCalledTimes(1);
  });

  it("blocks click/drag side effects when the dock card is disabled", () => {
    const onRecordInteraction = vi.fn();
    const onSelectDraftCard = vi.fn();
    const onHandCardDragStart = vi.fn();
    const tree = MatchFocusHandDockCards({
      currentDeckTokens: [11n],
      cardMap: new Map<bigint, CardData>([[11n, makeCard(11n)]]),
      usedCardIndices: new Set<number>([0]),
      selectedCardIndex: null,
      forcedCardIndex: null,
      isAiTurn: false,
      isBoardFull: false,
      enableHandDragDrop: true,
      currentPlayer: 0,
      onRecordInteraction,
      onSelectDraftCard,
      onHandCardDragStart,
      onHandCardDragEnd: () => {},
    });

    const button = collectElementsByType(tree, "button")[0];
    expect(button?.props.disabled).toBe(true);
    button?.props.onClick();
    expect(onRecordInteraction).not.toHaveBeenCalled();
    expect(onSelectDraftCard).not.toHaveBeenCalled();

    const setData = vi.fn();
    const preventDefault = vi.fn();
    const dragEvent = {
      dataTransfer: {
        effectAllowed: "none",
        setData,
      },
      preventDefault,
    } as unknown as React.DragEvent<HTMLButtonElement>;
    button?.props.onDragStart(dragEvent);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(setData).not.toHaveBeenCalled();
    expect(onHandCardDragStart).not.toHaveBeenCalled();
  });
});
