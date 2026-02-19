import React from "react";

export function MatchHandCompactHintPanel(input: {
  draftCardIndex: number | null;
  draftCell: number | null;
}): React.ReactElement {
  const { draftCardIndex, draftCell } = input;
  const hasDraftSelection = draftCardIndex !== null || draftCell !== null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      逶､髱｢繝輔か繝ｼ繧ｫ繧ｹ荳ｭ縺ｮ縺溘ａ謫堺ｽ弑I繧帝撼陦ｨ遉ｺ縺ｫ縺励※縺・∪縺吶・
      {hasDraftSelection ? (
        <span className="ml-1">
          ・磯∈謚樔ｸｭ: 繧ｫ繝ｼ繝・{draftCardIndex !== null ? draftCardIndex + 1 : "-"} 竊・繧ｻ繝ｫ {draftCell ?? "-"}・・
        </span>
      ) : null}
    </div>
  );
}
