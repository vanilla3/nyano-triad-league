import React from "react";

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
        aria-label="Focus dock warning mark cell"
      >
        <option value="">Warning mark: none</option>
        {availableCells
          .filter((cell) => cell !== draftCell)
          .map((cell) => (
            <option key={`focus-w-${cell}`} value={String(cell)}>隴ｦ蜻・{cell}</option>
          ))}
      </select>

      <button
        className="btn btn-primary h-9 px-3 text-xs"
        onClick={onCommitMove}
        disabled={!canCommit}
        aria-label="Commit move from focus hand dock"
      >
        遒ｺ螳・
      </button>
      <button
        className="btn h-9 px-3 text-xs"
        onClick={onUndoMove}
        disabled={!canUndo}
        aria-label="Undo move from focus hand dock"
      >
        蜿悶ｊ豸医＠
      </button>
    </div>
  );
}
