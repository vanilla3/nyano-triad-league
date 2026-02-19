import React from "react";
import type { BoardState, TurnSummary } from "@nyano/triad-engine";
import type { UiDensity } from "@/lib/local_settings";
import type { MoveAnnotation } from "@/lib/ai/replay_annotations";
import type { BoardAdvantage } from "@/lib/ai/board_advantage";
import type { MatchResultSummaryPanelResult } from "@/features/match/MatchResultSummaryPanel";
import { MatchMintDensityToggle } from "@/features/match/MatchMintDensityToggle";
import { MatchMintTurnLogPanel } from "@/features/match/MatchMintTurnLogPanel";
import { MatchMintResultSummaryPanel } from "@/features/match/MatchMintResultSummaryPanel";
import { MatchShareActionsRow } from "@/features/match/MatchShareActionsRow";
import { MatchMintAiNotesPanel } from "@/features/match/MatchMintAiNotesPanel";

export function MatchMintDrawerPanels(input: {
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
}): React.ReactElement {
  const {
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
  } = input;

  return (
    <>
      <MatchMintDensityToggle value={density} onChange={onChangeDensity} />

      <MatchMintTurnLogPanel
        simOk={simOk}
        turns={simOk ? previewTurns : []}
        boardHistory={simOk ? previewHistory : undefined}
        selectedTurnIndex={selectedTurnIndex}
        onSelect={onSelectTurn}
        annotations={annotations}
        boardAdvantages={boardAdvantages}
      />

      <MatchMintResultSummaryPanel
        result={resultSummary}
        pendingMessage={pendingMessage}
      />

      <MatchShareActionsRow
        isRpg={false}
        simOk={simOk}
        canFinalize={canFinalize}
        onCopyTranscriptJson={onCopyTranscriptJson}
        onCopyShareUrl={onCopyShareUrl}
        onOpenReplay={onOpenReplay}
      />

      <MatchMintAiNotesPanel isVisible={aiNoteCount > 0} noteCount={aiNoteCount}>
        {aiNotesContent}
      </MatchMintAiNotesPanel>
    </>
  );
}
