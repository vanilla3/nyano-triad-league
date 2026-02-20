import React from "react";
import { LastMoveFeedback } from "@/components/BoardFlipAnimator";

export function MatchBoardFeedbackPanels(input: {
  isAnimating: boolean;
  placedCell: number | null;
  flippedCells: number[];
  turnPlayerLabel: "A" | "B";
  isStageFocusRoute: boolean;
  showLegacyStatusSummary: boolean;
  isRpg: boolean;
  lastFlipSummaryText: string | null;
}): React.ReactElement {
  const {
    isAnimating,
    placedCell,
    flippedCells,
    turnPlayerLabel,
    isStageFocusRoute,
    showLegacyStatusSummary,
    isRpg,
    lastFlipSummaryText,
  } = input;

  return (
    <>
      {isAnimating ? (
        <LastMoveFeedback
          placedCell={placedCell}
          flippedCells={flippedCells}
          turnPlayer={turnPlayerLabel}
        />
      ) : null}

      {!isStageFocusRoute && showLegacyStatusSummary ? (
        <div
          className={
            isRpg
              ? "rounded-lg px-3 py-2 text-xs font-semibold"
              : "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          }
          style={
            isRpg
              ? { background: "rgba(245,166,35,0.15)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" }
              : undefined
          }
        >
          Battle: {lastFlipSummaryText}
        </div>
      ) : null}
    </>
  );
}