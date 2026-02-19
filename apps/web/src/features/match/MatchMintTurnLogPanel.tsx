import React from "react";
import type { BoardState, TurnSummary } from "@nyano/triad-engine";
import { TurnLog } from "@/components/TurnLog";
import type { MoveAnnotation } from "@/lib/ai/replay_annotations";
import type { BoardAdvantage } from "@/lib/ai/board_advantage";

export function MatchMintTurnLogPanel(input: {
  simOk: boolean;
  turns: TurnSummary[];
  boardHistory?: BoardState[];
  selectedTurnIndex: number;
  onSelect: (turnIndex: number) => void;
  annotations?: MoveAnnotation[];
  boardAdvantages?: BoardAdvantage[];
  emptyLabel?: string;
}): React.ReactElement {
  const {
    simOk,
    turns,
    boardHistory,
    selectedTurnIndex,
    onSelect,
    annotations,
    boardAdvantages,
    emptyLabel,
  } = input;

  if (!simOk) {
    return (
      <div className="text-xs" style={{ color: "var(--mint-text-hint)" }}>
        {emptyLabel ?? "Load cards to enable turn log."}
      </div>
    );
  }

  return (
    <TurnLog
      turns={turns}
      boardHistory={boardHistory}
      selectedTurnIndex={Math.min(selectedTurnIndex, Math.max(0, turns.length - 1))}
      onSelect={onSelect}
      annotations={annotations}
      boardAdvantages={boardAdvantages}
    />
  );
}
