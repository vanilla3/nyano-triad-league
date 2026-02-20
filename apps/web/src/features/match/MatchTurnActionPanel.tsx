import React from "react";

export function MatchTurnActionPanel(input: {
  isRpg: boolean;
  isStageFocusRoute: boolean;
  currentWarnRemaining: number;
  availableCells: readonly number[];
  draftCell: number | null;
  draftWarningMarkCell: number | null;
  isBoardFull: boolean;
  isAiTurn: boolean;
  canCommit: boolean;
  canUndo: boolean;
  showAiMoveAction: boolean;
  onChangeDraftWarningMarkCell: (value: number | null) => void;
  onCommitMove: () => void;
  onUndoMove: () => void;
  onAiMove: () => void;
}): React.ReactElement {
  const {
    isRpg,
    isStageFocusRoute,
    currentWarnRemaining,
    availableCells,
    draftCell,
    draftWarningMarkCell,
    isBoardFull,
    isAiTurn,
    canCommit,
    canUndo,
    showAiMoveAction,
    onChangeDraftWarningMarkCell,
    onCommitMove,
    onUndoMove,
    onAiMove,
  } = input;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="grid gap-1">
        <div
          className={isRpg ? "text-[10px] uppercase tracking-wider" : "text-[11px] text-slate-600"}
          style={isRpg ? { fontFamily: "'Cinzel', serif", color: "var(--rpg-text-dim, #8A7E6B)" } : undefined}
        >
          Warning mark (remaining {currentWarnRemaining})
        </div>
        <select
          className={["input", isStageFocusRoute ? "h-10 min-w-[180px]" : ""].join(" ").trim()}
          value={draftWarningMarkCell === null ? "" : String(draftWarningMarkCell)}
          onChange={(e) => {
            const value = e.target.value;
            onChangeDraftWarningMarkCell(value === "" ? null : Number(value));
          }}
          disabled={isBoardFull || isAiTurn || currentWarnRemaining <= 0}
          aria-label="Warning mark cell"
        >
          <option value="">None</option>
          {availableCells
            .filter((cell) => cell !== draftCell)
            .map((cell) => (
              <option key={cell} value={String(cell)}>Cell {cell}</option>
            ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className={isRpg ? "rpg-result__btn rpg-result__btn--primary" : ["btn btn-primary", isStageFocusRoute ? "h-10 px-4" : ""].join(" ").trim()}
          onClick={onCommitMove}
          disabled={!canCommit}
          aria-label="Commit move"
        >
          Commit move
        </button>
        <button
          className={isRpg ? "rpg-result__btn" : ["btn", isStageFocusRoute ? "h-10 px-4" : ""].join(" ").trim()}
          onClick={onUndoMove}
          disabled={!canUndo}
          aria-label="Undo last move"
        >
          Undo 1 move
        </button>
        {showAiMoveAction ? (
          <button
            className={isRpg ? "rpg-result__btn rpg-result__btn--primary" : ["btn btn-primary", isStageFocusRoute ? "h-10 px-4" : ""].join(" ").trim()}
            onClick={onAiMove}
            aria-label="Nyano AI move"
          >
            Nyano Move
          </button>
        ) : null}
      </div>
    </div>
  );
}