import React from "react";
import type { PlayerIndex } from "@nyano/triad-engine";
import { NyanoAvatar } from "@/components/NyanoAvatar";

export interface PlayerSidePanelMintProps {
  side: "left" | "right";
  playerIndex: PlayerIndex;
  isActive: boolean;
  remainingCards: number;
  className?: string;
}

export function PlayerSidePanelMint({
  side,
  playerIndex,
  isActive,
  remainingCards,
  className = "",
}: PlayerSidePanelMintProps) {
  const playerLabel = playerIndex === 0 ? "Player A" : "Player B";
  const clampedRemaining = Math.max(0, remainingCards);
  const toneClass = playerIndex === 0 ? "mint-player-panel--a" : "mint-player-panel--b";

  return (
    <aside
      className={[
        "mint-player-panel",
        `mint-player-panel--${side}`,
        toneClass,
        isActive ? "mint-player-panel--active" : "",
        className,
      ].filter(Boolean).join(" ")}
      role="complementary"
      aria-label={`${playerLabel} status`}
    >
      <div className="mint-player-panel__avatar">
        <NyanoAvatar
          size={56}
          expression={playerIndex === 0 ? "playful" : "calm"}
          alt={playerLabel}
        />
      </div>

      <div className="mint-player-panel__name">{playerLabel}</div>

      <div
        className="mint-player-panel__remaining"
        role="status"
        aria-live="polite"
        aria-label={`${playerLabel} の残りカード ${clampedRemaining}`}
      >
        <span className="mint-player-panel__remaining-label">残りカード</span>
        <span className="mint-player-panel__remaining-value">{clampedRemaining}</span>
      </div>

      <div className="mint-player-panel__stack" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </aside>
  );
}
