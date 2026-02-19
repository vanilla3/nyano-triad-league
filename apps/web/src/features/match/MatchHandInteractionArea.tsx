import React from "react";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";
import { MatchHandCardsPanel } from "@/features/match/MatchHandCardsPanel";
import { MatchHandCompactHintPanel } from "@/features/match/MatchHandCompactHintPanel";
import { MatchHandStatusHeader } from "@/features/match/MatchHandStatusHeader";
import { MatchTurnActionPanel } from "@/features/match/MatchTurnActionPanel";

export function MatchHandInteractionArea(input: {
  isStageFocusRoute: boolean;
  showStageControls: boolean;
  showFocusHandDock: boolean;
  isMintUi: boolean;
  isRpg: boolean;
  currentPlayer: PlayerIndex;
  draftCell: number | null;
  isHandDragging: boolean;
  classicForcedCardIndex: number | null;
  classicForcedRuleLabel: string | null;
  currentHandCards: CardData[];
  usedCardIndices: Set<number>;
  draftCardIndex: number | null;
  deckTokenIds: bigint[];
  cardMap: Map<bigint, CardData> | undefined | null;
  isAiTurn: boolean;
  isBoardFull: boolean;
  turnsCount: number;
  enableHandDragDrop: boolean;
  onRecordInteraction: () => void;
  onSelectDraftCard: (index: number) => void;
  onHandCardDragStart: (index: number) => void;
  onHandCardDragEnd: () => void;
  currentWarnRemaining: number;
  availableCells: readonly number[];
  draftWarningMarkCell: number | null;
  isVsNyanoAi: boolean;
  aiAutoPlay: boolean;
  onChangeDraftWarningMarkCell: (value: number | null) => void;
  onCommitMove: () => void;
  onUndoMove: () => void;
  onAiMove: () => void;
}): React.ReactElement {
  const {
    isStageFocusRoute,
    showStageControls,
    showFocusHandDock,
    isMintUi,
    isRpg,
    currentPlayer,
    draftCell,
    isHandDragging,
    classicForcedCardIndex,
    classicForcedRuleLabel,
    currentHandCards,
    usedCardIndices,
    draftCardIndex,
    deckTokenIds,
    cardMap,
    isAiTurn,
    isBoardFull,
    turnsCount,
    enableHandDragDrop,
    onRecordInteraction,
    onSelectDraftCard,
    onHandCardDragStart,
    onHandCardDragEnd,
    currentWarnRemaining,
    availableCells,
    draftWarningMarkCell,
    isVsNyanoAi,
    aiAutoPlay,
    onChangeDraftWarningMarkCell,
    onCommitMove,
    onUndoMove,
    onAiMove,
  } = input;

  if ((!isStageFocusRoute || showStageControls) && !showFocusHandDock) {
    return (
      <div className="grid gap-3">
        <MatchHandStatusHeader
          isMintUi={isMintUi}
          isRpg={isRpg}
          currentPlayer={currentPlayer}
          draftCell={draftCell}
          isHandDragging={isHandDragging}
          classicForcedCardIndex={classicForcedCardIndex}
          classicForcedRuleLabel={classicForcedRuleLabel}
        />

        <MatchHandCardsPanel
          isMintUi={isMintUi}
          isRpg={isRpg}
          handCards={currentHandCards}
          currentPlayer={currentPlayer}
          usedCardIndices={usedCardIndices}
          selectedCardIndex={draftCardIndex}
          forcedCardIndex={classicForcedCardIndex}
          deckTokenIds={deckTokenIds}
          cardMap={cardMap ?? new Map<bigint, CardData>()}
          isAiTurn={isAiTurn}
          isBoardFull={isBoardFull}
          enableHandDragDrop={enableHandDragDrop}
          onSelectCard={onSelectDraftCard}
          onSelectMintCard={(idx) => {
            onRecordInteraction();
            onSelectDraftCard(idx);
          }}
          onCardDragStart={onHandCardDragStart}
          onCardDragEnd={onHandCardDragEnd}
        />

        <MatchTurnActionPanel
          isRpg={isRpg}
          isStageFocusRoute={isStageFocusRoute}
          currentWarnRemaining={currentWarnRemaining}
          availableCells={availableCells}
          draftCell={draftCell}
          draftWarningMarkCell={draftWarningMarkCell}
          isBoardFull={isBoardFull}
          isAiTurn={isAiTurn}
          canCommit={!(isBoardFull || isAiTurn || draftCell === null || draftCardIndex === null)}
          canUndo={turnsCount > 0}
          showAiMoveAction={isVsNyanoAi && !aiAutoPlay && isAiTurn}
          onChangeDraftWarningMarkCell={onChangeDraftWarningMarkCell}
          onCommitMove={onCommitMove}
          onUndoMove={onUndoMove}
          onAiMove={onAiMove}
        />
      </div>
    );
  }

  return (
    <MatchHandCompactHintPanel
      draftCardIndex={draftCardIndex}
      draftCell={draftCell}
    />
  );
}
