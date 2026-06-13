import React from "react";

const CELL_COORDS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

function cellCoord(cell: number): string {
  return CELL_COORDS[cell] ?? String(cell);
}

export function MatchHandCompactHintPanel(input: {
  draftCardIndex: number | null;
  draftCell: number | null;
}): React.ReactElement {
  const { draftCardIndex, draftCell } = input;
  const hasDraftSelection = draftCardIndex !== null || draftCell !== null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      フォーカスモードでは、ここに「仮選択」の内容が表示されます。
      {hasDraftSelection ? (
        <span className="ml-1">
          選択中：カード{draftCardIndex !== null ? draftCardIndex + 1 : "-"} ／ マス{draftCell !== null ? cellCoord(draftCell) : "-"}
        </span>
      ) : null}
    </div>
  );
}
