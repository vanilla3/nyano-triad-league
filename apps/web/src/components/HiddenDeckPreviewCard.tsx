import React from "react";

type HiddenDeckPreviewCardProps = {
  slotIndex: number;
};

export function HiddenDeckPreviewCard({ slotIndex }: HiddenDeckPreviewCardProps) {
  return (
    <div className="aspect-[3/4] rounded-2xl border border-slate-300 bg-slate-100/80 p-2">
      <div className="h-full rounded-xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-200 to-slate-100 text-slate-500">
        <div className="flex h-full flex-col items-center justify-center gap-1">
          <div className="text-lg font-semibold">?</div>
          <div className="text-[10px] font-mono">slot {slotIndex + 1}</div>
        </div>
      </div>
    </div>
  );
}

