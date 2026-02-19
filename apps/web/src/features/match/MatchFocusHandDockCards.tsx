import React from "react";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";
import { CardMini } from "@/components/CardMini";

export function MatchFocusHandDockCards(input: {
  currentDeckTokens: readonly bigint[];
  cardMap: ReadonlyMap<bigint, CardData> | null | undefined;
  usedCardIndices: ReadonlySet<number>;
  selectedCardIndex: number | null;
  forcedCardIndex: number | null;
  isAiTurn: boolean;
  isBoardFull: boolean;
  enableHandDragDrop: boolean;
  currentPlayer: PlayerIndex;
  onRecordInteraction: () => void;
  onSelectDraftCard: (index: number) => void;
  onHandCardDragStart: (index: number) => void;
  onHandCardDragEnd: () => void;
}): React.ReactElement {
  const {
    currentDeckTokens,
    cardMap,
    usedCardIndices,
    selectedCardIndex,
    forcedCardIndex,
    isAiTurn,
    isBoardFull,
    enableHandDragDrop,
    currentPlayer,
    onRecordInteraction,
    onSelectDraftCard,
    onHandCardDragStart,
    onHandCardDragEnd,
  } = input;

  return (
    <div className="mint-focus-hand-row">
      {currentDeckTokens.map((tid, idx) => {
        const card = cardMap?.get(tid);
        const usedHere = usedCardIndices.has(idx);
        const selected = selectedCardIndex === idx;
        const forced = forcedCardIndex === idx;
        const dockDisabled = usedHere || isAiTurn || isBoardFull;
        const center = (currentDeckTokens.length - 1) / 2;
        const fanOffset = idx - center;
        const fanRotate = Math.max(-12, Math.min(12, fanOffset * 4));
        const fanDrop = Math.min(10, Math.abs(fanOffset) * 2.2);
        const fanStyle = {
          ["--focus-hand-rot" as const]: `${fanRotate}deg`,
          ["--focus-hand-drop" as const]: `${fanDrop}px`,
        } satisfies React.CSSProperties & Record<"--focus-hand-rot" | "--focus-hand-drop", string>;
        if (!card) {
          return (
            <button
              key={`focus-dock-loading-${idx}`}
              type="button"
              className={[
                "mint-focus-hand-card",
                "mint-focus-hand-card--loading",
                selected && "mint-focus-hand-card--selected",
                forced && "mint-focus-hand-card--forced",
                dockDisabled && "mint-focus-hand-card--used",
              ].join(" ")}
              style={fanStyle}
              aria-label={`Focus hand card ${idx + 1} loading`}
              disabled
            >
              <div className="text-[10px] font-semibold text-slate-500">#{tid.toString()}</div>
              <div className="mt-1 text-[10px] text-slate-400">読み込み中</div>
            </button>
          );
        }
        return (
          <button
            key={`focus-dock-${idx}`}
            type="button"
            className={[
              "mint-focus-hand-card",
              selected && "mint-focus-hand-card--selected",
              forced && "mint-focus-hand-card--forced",
              dockDisabled && "mint-focus-hand-card--used",
            ].join(" ")}
            style={fanStyle}
            aria-label={`Focus hand card ${idx + 1}${usedHere ? " (used)" : ""}${selected ? " (selected)" : ""}`}
            data-hand-card={idx}
            disabled={dockDisabled}
            draggable={enableHandDragDrop && !dockDisabled}
            onClick={() => {
              if (dockDisabled) return;
              onRecordInteraction();
              onSelectDraftCard(idx);
            }}
            onDragStart={(e) => {
              if (!enableHandDragDrop || dockDisabled) {
                e.preventDefault();
                return;
              }
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("application/x-nytl-card-index", String(idx));
              e.dataTransfer.setData("text/plain", String(idx));
              onHandCardDragStart(idx);
            }}
            onDragEnd={onHandCardDragEnd}
          >
            {forced && (
              <span className="mint-focus-hand-card__fixed-badge" aria-hidden="true">
                FIX
              </span>
            )}
            <CardMini card={card} owner={currentPlayer} subtle={!selected} className="w-full" />
          </button>
        );
      })}
    </div>
  );
}
