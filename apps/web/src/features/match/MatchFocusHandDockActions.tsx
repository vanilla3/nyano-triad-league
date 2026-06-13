import React from "react";

const CELL_COORDS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

function cellCoord(cell: number): string {
  return CELL_COORDS[cell] ?? String(cell);
}

export function MatchFocusHandDockActions(input: {
  draftWarningMarkCell: number | null;
  onChangeDraftWarningMarkCell: (value: number | null) => void;
  currentWarnRemaining: number;
  isAiTurn: boolean;
  availableCells: readonly number[];
  draftCell: number | null;
  canCommit: boolean;
  canUndo: boolean;
  onCommitMove: () => void;
  onUndoMove: () => void;
}): React.ReactElement {
  const {
    draftWarningMarkCell,
    onChangeDraftWarningMarkCell,
    currentWarnRemaining,
    isAiTurn,
    availableCells,
    draftCell,
    canCommit,
    canUndo,
    onCommitMove,
    onUndoMove,
  } = input;

  return (
    <div className="mint-focus-hand-actions flex flex-wrap items-center gap-2">
      <select
        className="input h-9 min-w-[150px] text-xs"
        value={draftWarningMarkCell === null ? "" : String(draftWarningMarkCell)}
        onChange={(e) => {
          const value = e.target.value;
          onChangeDraftWarningMarkCell(value === "" ? null : Number(value));
        }}
        disabled={currentWarnRemaining <= 0 || isAiTurn}
        aria-label="警戒マークの配置先"
      >
        <option value="">警戒マーク：なし</option>
        {availableCells
          .filter((cell) => cell !== draftCell)
          .map((cell) => (
            <option key={`focus-w-${cell}`} value={String(cell)}>
              {cellCoord(cell)}
            </option>
          ))}
      </select>

      <button
        className="btn btn-primary h-9 px-3 text-xs"
        onClick={onCommitMove}
        disabled={!canCommit}
        aria-label="手を確定"
      >
        確定
      </button>
      <button
        className="btn h-9 px-3 text-xs"
        onClick={onUndoMove}
        disabled={!canUndo}
        aria-label="1手取り消し"
      >
        取り消し
      </button>
    </div>
  );
}
