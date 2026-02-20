import React from "react";
import { SkeletonBoard, SkeletonHand } from "@/components/Skeleton";
import type { MatchCardLoadEmptyState } from "@/features/match/matchCardLoadUiState";

export function MatchCardLoadEmptyStatePanel(input: {
  state: MatchCardLoadEmptyState;
  onLoadGuestCards: () => void;
}): React.ReactElement {
  const { state, onLoadGuestCards } = input;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
      {state === "loading" ? (
        <div className="grid gap-4 py-4">
          <SkeletonBoard className="max-w-[280px] mx-auto" />
          <SkeletonHand className="max-w-[400px] mx-auto" />
          <div className="text-center text-xs text-surface-400">Loading cards...</div>
        </div>
      ) : state === "guest_prompt" ? (
        <button className="btn btn-primary" onClick={onLoadGuestCards}>Load guest cards</button>
      ) : (
        <>Select decks in Match Setup and press <strong>Load cards</strong>.</>
      )}
    </div>
  );
}