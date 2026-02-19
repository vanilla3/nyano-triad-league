import React from "react";
import type { PlayerIndex } from "@nyano/triad-engine";

export function MatchHandStatusHeader(input: {
  isMintUi: boolean;
  isRpg: boolean;
  currentPlayer: PlayerIndex;
  draftCell: number | null;
  isHandDragging: boolean;
  classicForcedCardIndex: number | null;
  classicForcedRuleLabel: string | null;
}): React.ReactElement {
  const {
    isMintUi,
    isRpg,
    currentPlayer,
    draftCell,
    isHandDragging,
    classicForcedCardIndex,
    classicForcedRuleLabel,
  } = input;

  return (
    <div
      className={
        isMintUi ? "text-xs font-semibold text-mint-text-secondary"
          : isRpg ? "text-xs font-bold uppercase tracking-wider"
            : "text-xs font-medium text-slate-600"
      }
      style={isRpg ? { fontFamily: "'Cinzel', serif", color: "var(--rpg-text-gold, #E8D48B)" } : undefined}
    >
      {currentPlayer === 0 ? "繝励Ξ繧､繝､繝ｼA" : "繝励Ξ繧､繝､繝ｼB"} 縺ｮ謇区惆
      {draftCell !== null && <span className={isRpg ? "" : " text-slate-400"}> ﾂｷ Cell {draftCell} selected</span>}
      {isHandDragging && <span className={isRpg ? "" : " text-cyan-500"}> ﾂｷ Dragging to board</span>}
      {isMintUi && classicForcedCardIndex !== null && (
        <span className="mint-order-lock-badge ml-2" role="status" aria-live="polite">
          蝗ｺ螳壹せ繝ｭ繝・ヨ ({classicForcedRuleLabel ?? "FIX"}): {classicForcedCardIndex + 1}
        </span>
      )}
    </div>
  );
}
