import React from "react";

const CELL_LABELS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

function formatCellLabel(cell: number | null): string {
  if (cell === null) return "マス未選択";
  return CELL_LABELS[cell] ?? `マス${cell}`;
}

function formatCardLabel(cardIndex: number | null): string {
  if (cardIndex === null) return "カード未選択";
  return `カード${cardIndex + 1}`;
}

export function MatchQuickCommitBar(input: {
  draftCardIndex: number | null;
  draftCell: number | null;
  draftWarningMarkCell: number | null;
  onChangeDraftWarningMarkCell: (value: number | null) => void;
  isBoardFull: boolean;
  isAiTurn: boolean;
  currentWarnRemaining: number;
  availableCells: readonly number[];
  canCommit: boolean;
  canUndo: boolean;
  onCommitMove: () => void;
  onUndoMove: () => void;
}): React.ReactElement {
  const {
    draftCardIndex,
    draftCell,
    draftWarningMarkCell,
    onChangeDraftWarningMarkCell,
    isBoardFull,
    isAiTurn,
    currentWarnRemaining,
    availableCells,
    canCommit,
    canUndo,
    onCommitMove,
    onUndoMove,
  } = input;

  return (
    <div
      className="mint-match-quick-commit hidden lg:flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2"
    >
      <div className="grid gap-0.5 text-xs">
        <div className="mint-match-quick-commit__title font-semibold">
          この一手
        </div>
        <div className="mint-match-quick-commit__hint">
          {formatCardLabel(draftCardIndex)} → {formatCellLabel(draftCell)}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          className="inline-flex items-center gap-2 text-xs font-semibold"
          style={{ color: "var(--mint-text-secondary, #4B5563)" }}
        >
          警戒
          <select
            className="input h-10 min-w-[170px]"
            value={draftWarningMarkCell === null ? "" : String(draftWarningMarkCell)}
            onChange={(e) => {
              const v = e.target.value;
              onChangeDraftWarningMarkCell(v === "" ? null : Number(v));
            }}
            disabled={isBoardFull || isAiTurn || currentWarnRemaining <= 0}
            aria-label="Quick warning mark cell"
          >
            <option value="">なし</option>
            {availableCells
              .filter((c) => c !== draftCell)
              .map((c) => (
                <option key={`quick-${c}`} value={String(c)}>警戒 {formatCellLabel(c)}</option>
              ))}
          </select>
        </label>
        <button
          className="btn btn-primary h-10 px-4"
          onClick={onCommitMove}
          disabled={!canCommit}
          aria-label="Quick commit move"
        >
          この手を確定
        </button>
        <button
          className="btn h-10 px-4"
          onClick={onUndoMove}
          disabled={!canUndo}
          aria-label="Quick undo move"
        >
          1手戻す
        </button>
      </div>
    </div>
  );
}
