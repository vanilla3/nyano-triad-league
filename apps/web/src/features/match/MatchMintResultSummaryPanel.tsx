import React from "react";
import type { MatchResultSummaryPanelResult } from "@/features/match/MatchResultSummaryPanel";

export function MatchMintResultSummaryPanel(input: {
  result: MatchResultSummaryPanelResult | null;
  pendingMessage: React.ReactNode;
}): React.ReactElement {
  const { result, pendingMessage } = input;

  if (result) {
    return (
      <div
        className="rounded-xl border p-3 text-xs"
        style={{
          background: "var(--mint-surface-dim)",
          borderColor: "var(--mint-accent-muted)",
          color: "var(--mint-text-primary)",
        }}
      >
        <div>
          Winner: <span className="font-medium">{result.winner}</span> (tiles A/B = {result.tilesA}/{result.tilesB})
        </div>
        <div className="font-mono mt-1 truncate" style={{ color: "var(--mint-text-secondary)" }}>
          Match ID: {result.matchId}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs"
      style={{
        background: "var(--mint-surface-dim)",
        borderColor: "var(--mint-accent-muted)",
        color: "var(--mint-text-secondary)",
      }}
    >
      {pendingMessage}
    </div>
  );
}
