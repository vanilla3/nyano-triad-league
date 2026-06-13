import React from "react";
import type { PlayerIndex } from "@nyano/triad-engine";
import { cellIndexToCoord } from "@/lib/triad_viewer_command";

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

  const playerLabel = currentPlayer === 0 ? "プレイヤーA" : "プレイヤーB";
  const cellLabel = typeof draftCell === "number" ? cellIndexToCoord(draftCell) : null;

  return (
    <div
      className={
        isMintUi ? "text-xs font-semibold text-mint-text-secondary"
          : isRpg ? "text-xs font-bold uppercase tracking-wider"
            : "text-xs font-medium text-slate-600"
      }
      style={isRpg ? { fontFamily: "'Cinzel', serif", color: "var(--rpg-text-gold, #E8D48B)" } : undefined}
    >
      {playerLabel}の番
      {cellLabel && (
        <span className={isRpg ? "" : " text-slate-400"}>
          {" "}| 選択マス {cellLabel}
        </span>
      )}
      {isHandDragging && <span className={isRpg ? "" : " text-cyan-500"}> | 盤面へドラッグ中</span>}
      {isMintUi && classicForcedCardIndex !== null && (
        <span className="mint-order-lock-badge ml-2" role="status" aria-live="polite">
          強制スロット（{classicForcedRuleLabel ?? "FIX"}）: {classicForcedCardIndex + 1}
        </span>
      )}
    </div>
  );
}