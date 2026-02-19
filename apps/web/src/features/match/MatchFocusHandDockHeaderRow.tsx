import React from "react";

export function MatchFocusHandDockHeaderRow(input: {
  label: React.ReactNode;
  isAiTurn: boolean;
  draftCardIndex: number | null;
  draftCell: number | null;
}): React.ReactElement {
  const {
    label,
    isAiTurn,
    draftCardIndex,
    draftCell,
  } = input;

  const statusText = isAiTurn
    ? "Thinking..."
    : `${draftCardIndex !== null ? `Card ${draftCardIndex + 1}` : "Card not selected"} | ${draftCell !== null ? `Cell ${draftCell}` : "Cell not selected"}`;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-[11px] font-semibold text-slate-700">{label}</div>
      <div className="text-[10px] text-slate-500">{statusText}</div>
    </div>
  );
}
