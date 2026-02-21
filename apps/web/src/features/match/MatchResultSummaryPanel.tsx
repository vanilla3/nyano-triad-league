import React from "react";

export type MatchResultSummaryPanelResult = {
  winner: string | number;
  tilesA: number;
  tilesB: number;
  matchId: string;
};

export function MatchResultSummaryPanel(input: {
  isRpg: boolean;
  isStageFocusRoute: boolean;
  result: MatchResultSummaryPanelResult | null;
}): React.ReactElement {
  const { isRpg, isStageFocusRoute, result } = input;

  if (result) {
    return (
      <div
        className={
          isRpg
            ? "rounded-lg p-3 text-xs"
            : ["rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700", isStageFocusRoute ? "stage-focus-side-panel" : ""].filter(Boolean).join(" ")
        }
        style={isRpg ? { background: "rgba(0,0,0,0.4)", color: "#F5F0E1", border: "1px solid rgba(201,168,76,0.2)" } : undefined}
      >
        <div>Winner: <span className="font-medium">{result.winner}</span> (tiles A/B = {result.tilesA}/{result.tilesB})</div>
        <div className="font-mono mt-1 truncate">Match ID: {result.matchId}</div>
      </div>
    );
  }

  return (
    <div
      className={
        isRpg
          ? "rounded-lg p-3 text-xs"
          : ["rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600", isStageFocusRoute ? "stage-focus-side-panel stage-focus-side-panel--muted" : ""].filter(Boolean).join(" ")
      }
      style={isRpg ? { background: "rgba(0,0,0,0.3)", color: "var(--rpg-text-dim, #8A7E6B)" } : undefined}
    >
      Result is shown after turn 9.
    </div>
  );
}
