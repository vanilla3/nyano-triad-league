import React from "react";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";
import { MatchFocusHandDockActions } from "@/features/match/MatchFocusHandDockActions";
import { MatchFocusHandDockCards } from "@/features/match/MatchFocusHandDockCards";
import { MatchFocusHandDockHeaderRow } from "@/features/match/MatchFocusHandDockHeaderRow";

export function MatchFocusHandDock(input: {
  isStageFocusRoute: boolean;
  headerLabel: React.ReactNode;
  isAiTurn: boolean;
  draftCardIndex: number | null;
  draftCell: number | null;
  forcedCardIndex: number | null;
  forcedRuleLabel: string | null;
  currentDeckTokens: readonly bigint[];
  cardMap: ReadonlyMap<bigint, CardData> | null | undefined;
  usedCardIndices: ReadonlySet<number>;
  isBoardFull: boolean;
  enableHandDragDrop: boolean;
  currentPlayer: PlayerIndex;
  onRecordInteraction: () => void;
  onSelectDraftCard: (index: number) => void;
  onHandCardDragStart: (index: number) => void;
  onHandCardDragEnd: () => void;
  draftWarningMarkCell: number | null;
  onChangeDraftWarningMarkCell: (value: number | null) => void;
  currentWarnRemaining: number;
  availableCells: readonly number[];
  canCommit: boolean;
  canUndo: boolean;
  onCommitMove: () => void;
  onUndoMove: () => void;
}): React.ReactElement {
  const {
    isStageFocusRoute,
    headerLabel,
    isAiTurn,
    draftCardIndex,
    draftCell,
    forcedCardIndex,
    forcedRuleLabel,
    currentDeckTokens,
    cardMap,
    usedCardIndices,
    isBoardFull,
    enableHandDragDrop,
    currentPlayer,
    onRecordInteraction,
    onSelectDraftCard,
    onHandCardDragStart,
    onHandCardDragEnd,
    draftWarningMarkCell,
    onChangeDraftWarningMarkCell,
    currentWarnRemaining,
    availableCells,
    canCommit,
    canUndo,
    onCommitMove,
    onUndoMove,
  } = input;

  return (
    <div
      className={[
        "mint-focus-hand-dock grid gap-2 rounded-2xl border p-2 shadow-xl backdrop-blur",
        isStageFocusRoute ? "mint-focus-hand-dock--stage" : "",
        !isStageFocusRoute ? "mint-focus-hand-dock--inline sticky bottom-2 z-20" : "",
      ].filter(Boolean).join(" ")}
    >
      <MatchFocusHandDockHeaderRow
        label={headerLabel}
        isAiTurn={isAiTurn}
        draftCardIndex={draftCardIndex}
        draftCell={draftCell}
      />

      {forcedCardIndex !== null && (
        <div className="mint-order-lock-badge" role="status" aria-live="polite">
          蝗ｺ螳壹せ繝ｭ繝・ヨ ({forcedRuleLabel ?? "FIX"}): {forcedCardIndex + 1}
        </div>
      )}

      <MatchFocusHandDockCards
        currentDeckTokens={currentDeckTokens}
        cardMap={cardMap}
        usedCardIndices={usedCardIndices}
        selectedCardIndex={draftCardIndex}
        forcedCardIndex={forcedCardIndex}
        isAiTurn={isAiTurn}
        isBoardFull={isBoardFull}
        enableHandDragDrop={enableHandDragDrop}
        currentPlayer={currentPlayer}
        onRecordInteraction={onRecordInteraction}
        onSelectDraftCard={onSelectDraftCard}
        onHandCardDragStart={onHandCardDragStart}
        onHandCardDragEnd={onHandCardDragEnd}
      />

      <MatchFocusHandDockActions
        draftWarningMarkCell={draftWarningMarkCell}
        onChangeDraftWarningMarkCell={onChangeDraftWarningMarkCell}
        currentWarnRemaining={currentWarnRemaining}
        isAiTurn={isAiTurn}
        availableCells={availableCells}
        draftCell={draftCell}
        canCommit={canCommit}
        canUndo={canUndo}
        onCommitMove={onCommitMove}
        onUndoMove={onUndoMove}
      />
    </div>
  );
}
