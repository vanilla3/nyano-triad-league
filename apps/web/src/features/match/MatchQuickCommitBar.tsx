import React from "react";

const CELL_COORDS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

function cellCoord(cell: number): string {
  return CELL_COORDS[cell] ?? String(cell);
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
    <div className="mint-match-quick-commit hidden lg:flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2">
      <div className="grid gap-0.5 text-xs">
        <div className="mint-match-quick-commit__title font-semibold">クイック確定</div>
        <div className="mint-match-quick-commit__hint">
          カード{draftCardIndex !== null ? draftCardIndex + 1 : "-"} ｜ マス{draftCell !== null ? cellCoord(draftCell) : "-"}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          className="inline-flex items-center gap-2 text-xs font-semibold"
          style={{ color: "var(--mint-text-secondary, #4B5563)" }}
        >
          警戒マーク（残り{currentWarnRemaining}）
          <select
            className="input h-10 min-w-[170px]"
            value={draftWarningMarkCell === null ? "" : String(draftWarningMarkCell)}
            onChange={(e) => {
              const v = e.target.value;
              onChangeDraftWarningMarkCell(v === "" ? null : Number(v));
            }}
            disabled={isBoardFull || isAiTurn || currentWarnRemaining <= 0}
            aria-label="警戒マークの配置先"
          >
            <option value="">なし</option>
            {availableCells
              .filter((c) => c !== draftCell)
              .map((c) => (
                <option key={`quick-${c}`} value={String(c)}>
                  {cellCoord(c)}
                </option>
              ))}
          </select>
        </label>
        <button
          className="btn btn-primary h-10 px-4"
          onClick={onCommitMove}
          disabled={!canCommit}
          aria-label="手を確定"
        >
          確定
        </button>
        <button
          className="btn h-10 px-4"
          onClick={onUndoMove}
          disabled={!canUndo}
          aria-label="1手取り消し"
        >
          取り消し
        </button>
      </div>
    </div>
  );
}
