import React from "react";

const CELL_COORDS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

function cellCoord(cell: number): string {
  return CELL_COORDS[cell] ?? String(cell);
}

export function MatchFocusHandDockHeaderRow(input: {
  label: React.ReactNode;
  isAiTurn: boolean;
  draftCardIndex: number | null;
  draftCell: number | null;
}): React.ReactElement {
  const { label, isAiTurn, draftCardIndex, draftCell } = input;

  const statusText = isAiTurn
    ? "にゃーのの番…"
    : `${draftCardIndex !== null ? `カード${draftCardIndex + 1}` : "カード未選択"} ｜ ${draftCell !== null ? `マス${cellCoord(draftCell)}` : "マス未選択"}`;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-[11px] font-semibold text-slate-700">{label}</div>
      <div className="text-[10px] text-slate-500">{statusText}</div>
    </div>
  );
}
