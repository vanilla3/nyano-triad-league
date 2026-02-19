import React from "react";
import type { BoardState, TurnSummary } from "@nyano/triad-engine";
import type { UiDensity } from "@/lib/local_settings";
import type { MoveAnnotation } from "@/lib/ai/replay_annotations";
import type { BoardAdvantage } from "@/lib/ai/board_advantage";
import type { TurnLogEntry } from "@/components/BoardViewRPG";
import type { MatchResultSummaryPanelResult } from "@/features/match/MatchResultSummaryPanel";
import { MatchMintDrawerPanels } from "@/features/match/MatchMintDrawerPanels";
import { MatchMintDrawerShell } from "@/features/match/MatchMintDrawerShell";
import { MatchSideColumnPanels } from "@/features/match/MatchSideColumnPanels";

export function MatchInfoColumn(input: {
  isMintUi: boolean;
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
  density: UiDensity;
  onChangeDensity: (value: UiDensity) => void;
  simOk: boolean;
  previewTurns: TurnSummary[];
  previewHistory: BoardState[];
  selectedTurnIndex: number;
  onSelectTurn: (turnIndex: number) => void;
  annotations?: MoveAnnotation[];
  boardAdvantages?: BoardAdvantage[];
  resultSummary: MatchResultSummaryPanelResult | null;
  pendingMessage: React.ReactNode;
  canFinalize: boolean;
  onCopyTranscriptJson: () => void;
  onCopyShareUrl: () => void;
  onOpenReplay: () => void;
  aiNoteCount: number;
  aiNotesContent: React.ReactNode;
  sideColumnClassName: string;
  isRpg: boolean;
  isStageFocusRoute: boolean;
  rpgLogEntries: TurnLogEntry[];
  isGuestPostGameVisible: boolean;
  guestDeckSaved: boolean;
  onRematch: () => void;
  onLoadNewGuestDeck: () => void;
  onSaveGuestDeck: () => void;
  onCopyShareTemplate: () => void;
  guestQrCode: React.ReactNode;
}): React.ReactElement {
  const {
    isMintUi,
    drawerOpen,
    onOpenDrawer,
    onCloseDrawer,
    density,
    onChangeDensity,
    simOk,
    previewTurns,
    previewHistory,
    selectedTurnIndex,
    onSelectTurn,
    annotations,
    boardAdvantages,
    resultSummary,
    pendingMessage,
    canFinalize,
    onCopyTranscriptJson,
    onCopyShareUrl,
    onOpenReplay,
    aiNoteCount,
    aiNotesContent,
    sideColumnClassName,
    isRpg,
    isStageFocusRoute,
    rpgLogEntries,
    isGuestPostGameVisible,
    guestDeckSaved,
    onRematch,
    onLoadNewGuestDeck,
    onSaveGuestDeck,
    onCopyShareTemplate,
    guestQrCode,
  } = input;

  if (isMintUi) {
    return (
      <MatchMintDrawerShell
        open={drawerOpen}
        onOpen={onOpenDrawer}
        onClose={onCloseDrawer}
      >
        <MatchMintDrawerPanels
          density={density}
          onChangeDensity={onChangeDensity}
          simOk={simOk}
          previewTurns={simOk ? previewTurns : []}
          previewHistory={simOk ? previewHistory : []}
          selectedTurnIndex={selectedTurnIndex}
          onSelectTurn={onSelectTurn}
          annotations={annotations}
          boardAdvantages={boardAdvantages}
          resultSummary={resultSummary}
          pendingMessage={pendingMessage}
          canFinalize={canFinalize}
          onCopyTranscriptJson={onCopyTranscriptJson}
          onCopyShareUrl={onCopyShareUrl}
          onOpenReplay={onOpenReplay}
          aiNoteCount={aiNoteCount}
          aiNotesContent={aiNotesContent}
        />
      </MatchMintDrawerShell>
    );
  }

  return (
    <MatchSideColumnPanels
      className={sideColumnClassName}
      isRpg={isRpg}
      isStageFocusRoute={isStageFocusRoute}
      rpgLogEntries={rpgLogEntries}
      simOk={simOk}
      previewTurns={simOk ? previewTurns : []}
      previewHistory={simOk ? previewHistory : []}
      selectedTurnIndex={selectedTurnIndex}
      onSelectTurn={onSelectTurn}
      resultSummary={resultSummary}
      canFinalize={canFinalize}
      onCopyTranscriptJson={onCopyTranscriptJson}
      onCopyShareUrl={onCopyShareUrl}
      onOpenReplay={onOpenReplay}
      isGuestPostGameVisible={isGuestPostGameVisible}
      guestDeckSaved={guestDeckSaved}
      onRematch={onRematch}
      onLoadNewGuestDeck={onLoadNewGuestDeck}
      onSaveGuestDeck={onSaveGuestDeck}
      onCopyShareTemplate={onCopyShareTemplate}
      guestQrCode={guestQrCode}
      aiNoteCount={aiNoteCount}
      aiNotesContent={aiNotesContent}
    />
  );
}
