import React from "react";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";
import { HandDisplayRPG } from "@/components/BoardViewRPG";
import { HandDisplayMint } from "@/components/HandDisplayMint";
import { CardMini } from "@/components/CardMini";

export function MatchHandCardsPanel(input: {
  isMintUi: boolean;
  isRpg: boolean;
  handCards: CardData[];
  currentPlayer: PlayerIndex;
  usedCardIndices: Set<number>;
  selectedCardIndex: number | null;
  forcedCardIndex: number | null;
  deckTokenIds: bigint[];
  cardMap: Map<bigint, CardData>;
  isAiTurn: boolean;
  isBoardFull: boolean;
  enableHandDragDrop: boolean;
  onSelectCard: (index: number) => void;
  onSelectMintCard: (index: number) => void;
  onCardDragStart: (index: number) => void;
  onCardDragEnd: () => void;
}): React.ReactElement {
  const {
    isMintUi,
    isRpg,
    handCards,
    currentPlayer,
    usedCardIndices,
    selectedCardIndex,
    forcedCardIndex,
    deckTokenIds,
    cardMap,
    isAiTurn,
    isBoardFull,
    enableHandDragDrop,
    onSelectCard,
    onSelectMintCard,
    onCardDragStart,
    onCardDragEnd,
  } = input;

  if (isMintUi && handCards.length > 0) {
    return (
      <HandDisplayMint
        cards={handCards}
        owner={currentPlayer}
        usedIndices={usedCardIndices}
        selectedIndex={selectedCardIndex}
        forcedIndex={forcedCardIndex}
        onSelect={onSelectMintCard}
        disabled={isBoardFull || isAiTurn}
        enableDragDrop={enableHandDragDrop}
        onCardDragStart={onCardDragStart}
        onCardDragEnd={onCardDragEnd}
      />
    );
  }

  if (isRpg && handCards.length > 0) {
    return (
      <HandDisplayRPG
        cards={handCards}
        owner={currentPlayer}
        usedIndices={usedCardIndices}
        selectedIndex={selectedCardIndex}
        onSelect={onSelectCard}
        disabled={isBoardFull || isAiTurn}
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {deckTokenIds.map((tid, idx) => {
        const card = cardMap.get(tid);
        const usedHere = usedCardIndices.has(idx);
        const selected = selectedCardIndex === idx;
        return (
          <button
            key={idx}
            disabled={usedHere || isBoardFull || isAiTurn}
            onClick={() => onSelectCard(idx)}
            aria-label={`Card slot ${idx + 1}${usedHere ? " (used)" : ""}${selected ? " (selected)" : ""}`}
            className={[
              "w-[120px] rounded-xl border p-2",
              selected ? "border-slate-900 ring-2 ring-nyano-400/60" : "border-slate-200",
              usedHere || isAiTurn ? "bg-slate-50 opacity-50" : "bg-white hover:bg-slate-50",
            ].join(" ")}
          >
            {card ? <CardMini card={card} owner={currentPlayer} subtle={!selected} /> : <div className="text-xs text-slate-500 font-mono">#{tid.toString()}</div>}
            <div className="mt-1 text-[10px] text-slate-500">idx {idx}</div>
          </button>
        );
      })}
    </div>
  );
}
