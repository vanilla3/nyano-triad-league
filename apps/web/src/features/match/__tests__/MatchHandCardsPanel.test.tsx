import React from "react";
import { describe, expect, it, vi } from "vitest";
import type { CardData } from "@nyano/triad-engine";
import { HandDisplayRPG } from "@/components/BoardViewRPG";
import { HandDisplayMint } from "@/components/HandDisplayMint";
import { MatchHandCardsPanel } from "@/features/match/MatchHandCardsPanel";

function makeCard(tokenId: bigint): CardData {
  return {
    tokenId,
    edges: { up: 1, right: 2, down: 3, left: 4 },
    jankenHand: 0,
    combatStatSum: 10,
    trait: "none",
  };
}

function collectButtons(node: React.ReactNode): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  const walk = (value: React.ReactNode): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!React.isValidElement(value)) return;
    if (value.type === "button") out.push(value);
    walk(value.props.children as React.ReactNode);
  };
  walk(node);
  return out;
}

describe("features/match/MatchHandCardsPanel", () => {
  it("renders mint hand component and forwards mint callbacks", () => {
    const onSelectMintCard = vi.fn();
    const onCardDragStart = vi.fn();
    const onCardDragEnd = vi.fn();
    const tree = MatchHandCardsPanel({
      isMintUi: true,
      isRpg: false,
      handCards: [makeCard(1n)],
      currentPlayer: 0,
      usedCardIndices: new Set<number>(),
      selectedCardIndex: 0,
      forcedCardIndex: 0,
      deckTokenIds: [1n],
      cardMap: new Map<bigint, CardData>([[1n, makeCard(1n)]]),
      isAiTurn: false,
      isBoardFull: false,
      enableHandDragDrop: true,
      onSelectCard: () => {},
      onSelectMintCard,
      onCardDragStart,
      onCardDragEnd,
    });
    expect(tree.type).toBe(HandDisplayMint);
    expect(tree.props.onSelect).toBe(onSelectMintCard);
    expect(tree.props.onCardDragStart).toBe(onCardDragStart);
    expect(tree.props.onCardDragEnd).toBe(onCardDragEnd);
  });

  it("renders rpg hand component when mint is disabled", () => {
    const onSelectCard = vi.fn();
    const tree = MatchHandCardsPanel({
      isMintUi: false,
      isRpg: true,
      handCards: [makeCard(1n)],
      currentPlayer: 1,
      usedCardIndices: new Set<number>(),
      selectedCardIndex: 0,
      forcedCardIndex: null,
      deckTokenIds: [1n],
      cardMap: new Map<bigint, CardData>([[1n, makeCard(1n)]]),
      isAiTurn: false,
      isBoardFull: false,
      enableHandDragDrop: false,
      onSelectCard,
      onSelectMintCard: () => {},
      onCardDragStart: () => {},
      onCardDragEnd: () => {},
    });
    expect(tree.type).toBe(HandDisplayRPG);
    expect(tree.props.onSelect).toBe(onSelectCard);
    expect(tree.props.owner).toBe(1);
  });

  it("renders standard card buttons when no hand cards are available", () => {
    const onSelectCard = vi.fn();
    const tree = MatchHandCardsPanel({
      isMintUi: true,
      isRpg: false,
      handCards: [],
      currentPlayer: 0,
      usedCardIndices: new Set<number>([0]),
      selectedCardIndex: 1,
      forcedCardIndex: null,
      deckTokenIds: [1n, 2n],
      cardMap: new Map<bigint, CardData>([[1n, makeCard(1n)], [2n, makeCard(2n)]]),
      isAiTurn: false,
      isBoardFull: false,
      enableHandDragDrop: false,
      onSelectCard,
      onSelectMintCard: () => {},
      onCardDragStart: () => {},
      onCardDragEnd: () => {},
    });
    expect(tree.type).toBe("div");
    const buttons = collectButtons(tree);
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.props.disabled).toBe(true);
    expect(buttons[1]?.props.className).toContain("ring-2");
    buttons[1]?.props.onClick();
    expect(onSelectCard).toHaveBeenCalledWith(1);
  });
});
