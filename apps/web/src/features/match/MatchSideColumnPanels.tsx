import React from "react";
import type { BoardState, TurnSummary } from "@nyano/triad-engine";
import type { TurnLogEntry } from "@/components/BoardViewRPG";
import type { MatchResultSummaryPanelResult } from "@/features/match/MatchResultSummaryPanel";
import { MatchSideTurnLogPanel } from "@/features/match/MatchSideTurnLogPanel";
import { MatchResultSummaryPanel } from "@/features/match/MatchResultSummaryPanel";
import { MatchShareActionsRow } from "@/features/match/MatchShareActionsRow";
import { MatchGuestPostGamePanel } from "@/features/match/MatchGuestPostGamePanel";
import { MatchAiNotesPanel } from "@/features/match/MatchAiNotesPanel";

export function MatchSideColumnPanels(input: {
  className: string;
  isRpg: boolean;
  isStageFocusRoute: boolean;
  rpgLogEntries: TurnLogEntry[];
  simOk: boolean;
  previewTurns: TurnSummary[];
  previewHistory: BoardState[];
  selectedTurnIndex: number;
  onSelectTurn: (turnIndex: number) => void;
  resultSummary: MatchResultSummaryPanelResult | null;
  canFinalize: boolean;
  onCopyTranscriptJson: () => void;
  onCopyShareUrl: () => void;
  onOpenReplay: () => void;
  isGuestPostGameVisible: boolean;
  guestDeckSaved: boolean;
  onRematch: () => void;
  onLoadNewGuestDeck: () => void;
  onSaveGuestDeck: () => void;
  onCopyShareTemplate: () => void;
  guestQrCode: React.ReactNode;
  aiNoteCount: number;
  aiNotesContent: React.ReactNode;
}): React.ReactElement {
  const {
    className,
    isRpg,
    isStageFocusRoute,
    rpgLogEntries,
    simOk,
    previewTurns,
    previewHistory,
    selectedTurnIndex,
    onSelectTurn,
    resultSummary,
    canFinalize,
    onCopyTranscriptJson,
    onCopyShareUrl,
    onOpenReplay,
    isGuestPostGameVisible,
    guestDeckSaved,
    onRematch,
    onLoadNewGuestDeck,
    onSaveGuestDeck,
    onCopyShareTemplate,
    guestQrCode,
    aiNoteCount,
    aiNotesContent,
  } = input;

  return (
    <div className={className}>
      <MatchSideTurnLogPanel
        isRpg={isRpg}
        rpgEntries={rpgLogEntries}
        simOk={simOk}
        turns={simOk ? previewTurns : []}
        boardHistory={simOk ? previewHistory : undefined}
        selectedTurnIndex={selectedTurnIndex}
        onSelect={onSelectTurn}
      />

      <MatchResultSummaryPanel
        isRpg={isRpg}
        isStageFocusRoute={isStageFocusRoute}
        result={resultSummary}
      />

      <MatchShareActionsRow
        isRpg={isRpg}
        simOk={simOk}
        canFinalize={canFinalize}
        onCopyTranscriptJson={onCopyTranscriptJson}
        onCopyShareUrl={onCopyShareUrl}
        onOpenReplay={onOpenReplay}
      />

      <MatchGuestPostGamePanel
        isVisible={isGuestPostGameVisible}
        isStageFocusRoute={isStageFocusRoute}
        guestDeckSaved={guestDeckSaved}
        canFinalize={canFinalize}
        onRematch={onRematch}
        onLoadNewGuestDeck={onLoadNewGuestDeck}
        onSaveGuestDeck={onSaveGuestDeck}
        onCopyShareUrl={onCopyShareUrl}
        onCopyShareTemplate={onCopyShareTemplate}
        onOpenReplay={onOpenReplay}
        qrCode={guestQrCode}
      />

      <MatchAiNotesPanel
        isVisible={aiNoteCount > 0}
        isRpg={isRpg}
        isStageFocusRoute={isStageFocusRoute}
        noteCount={aiNoteCount}
      >
        {aiNotesContent}
      </MatchAiNotesPanel>
    </div>
  );
}
