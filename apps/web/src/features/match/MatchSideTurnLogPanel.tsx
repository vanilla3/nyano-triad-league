import React from "react";
import type { BoardState, TurnSummary } from "@nyano/triad-engine";
import { TurnLog } from "@/components/TurnLog";
import { TurnLogRPG, type TurnLogEntry } from "@/components/BoardViewRPG";

export function MatchSideTurnLogPanel(input: {
  isRpg: boolean;
  rpgEntries: TurnLogEntry[];
  simOk: boolean;
  turns: TurnSummary[];
  boardHistory?: BoardState[];
  selectedTurnIndex: number;
  onSelect: (turnIndex: number) => void;
  emptyLabel?: string;
}): React.ReactElement {
  const {
    isRpg,
    rpgEntries,
    simOk,
    turns,
    boardHistory,
    selectedTurnIndex,
    onSelect,
    emptyLabel,
  } = input;

  if (isRpg) {
    return <TurnLogRPG entries={rpgEntries} />;
  }

  if (!simOk) {
    return <div className="text-xs text-slate-600">{emptyLabel ?? "Load cards to enable turn log."}</div>;
  }

  return (
    <TurnLog
      turns={turns}
      boardHistory={boardHistory}
      selectedTurnIndex={Math.min(selectedTurnIndex, Math.max(0, turns.length - 1))}
      onSelect={onSelect}
    />
  );
}
