import React from "react";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";
import { NyanoAvatar } from "@/components/NyanoAvatar";
import { ClassicOpenHandMiniMint } from "@/components/ClassicOpenHandMiniMint";
import { getPlayerDisplayLabel, getPlayerEnglishLabel } from "@/components/match/classicRulesUi";

export interface PlayerSidePanelMintOpenHand {
  cards: readonly (CardData | null)[];
  openCardIndices?: ReadonlySet<number> | readonly number[] | null;
  usedCardIndices?: ReadonlySet<number> | readonly number[] | null;
  modeLabel?: string | null;
}

export interface PlayerSidePanelMintProps {
  side: "left" | "right";
  playerIndex: PlayerIndex;
  isActive: boolean;
  remainingCards: number;
  openHand?: PlayerSidePanelMintOpenHand | null;
  className?: string;
}

export function PlayerSidePanelMint({
  side,
  playerIndex,
  isActive,
  remainingCards,
  openHand = null,
  className = "",
}: PlayerSidePanelMintProps) {
  const playerLabel = getPlayerDisplayLabel(playerIndex);
  const playerLabelEn = getPlayerEnglishLabel(playerIndex);
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
      aria-label={`${playerLabel} ステータス (${playerLabelEn} status)`}
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
        aria-label={`${playerLabel} 残りカード ${clampedRemaining} (${playerLabelEn} remaining cards ${clampedRemaining})`}
      >
        <span className="mint-player-panel__remaining-label">残りカード</span>
        <span className="mint-player-panel__remaining-value">{clampedRemaining}</span>
      </div>

      <div className="mint-player-panel__stack" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      {openHand ? (
        <ClassicOpenHandMiniMint
          sideLabel={playerLabel}
          cards={openHand.cards}
          openCardIndices={openHand.openCardIndices}
          usedCardIndices={openHand.usedCardIndices}
          modeLabel={openHand.modeLabel}
          className="mint-player-panel__openhand"
        />
      ) : null}
    </aside>
  );
}
