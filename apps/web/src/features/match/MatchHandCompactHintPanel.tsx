import React from "react";

export function MatchHandCompactHintPanel(input: {
  draftCardIndex: number | null;
  draftCell: number | null;
}): React.ReactElement {
  const { draftCardIndex, draftCell } = input;
  const hasDraftSelection = draftCardIndex !== null || draftCell !== null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      During focus mode, your draft selection appears here.
      {hasDraftSelection ? (
        <span className="ml-1">
          Selected: Card {draftCardIndex !== null ? draftCardIndex + 1 : "-"} / Cell {draftCell ?? "-"}
        </span>
      ) : null}
    </div>
  );
}