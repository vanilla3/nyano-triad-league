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
      {currentPlayer === 0 ? "Player A" : "Player B"} turn
      {draftCell !== null && <span className={isRpg ? "" : " text-slate-400"}> | Cell {draftCell} selected</span>}
      {isHandDragging && <span className={isRpg ? "" : " text-cyan-500"}> | Dragging to board</span>}
      {isMintUi && classicForcedCardIndex !== null && (
        <span className="mint-order-lock-badge ml-2" role="status" aria-live="polite">
          Forced slot ({classicForcedRuleLabel ?? "FIX"}): {classicForcedCardIndex + 1}
        </span>
      )}
    </div>
  );
}