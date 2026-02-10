import React from "react";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";
import { CardNyanoCompact } from "./CardNyano";
import { CardNyanoDuel } from "./CardNyanoDuel";

export type CardMiniProps = {
  card: CardData;
  owner: PlayerIndex;
  /** Slightly muted style (for lists / non-active cards) */
  subtle?: boolean;
  /** Card display variant: "duel" (art-forward NFT hero) or "compact" (legacy grid) */
  variant?: "duel" | "compact";
  /** Optional click handler */
  onClick?: () => void;
  /** Optional label (for accessibility / tooltip) */
  title?: string;
  className?: string;
};

/**
 * Small card component supporting art-forward (duel) and compact (legacy) modes.
 *
 * Default `"duel"` variant renders NFT art as full-bleed hero with glass overlay,
 * matching the premium mint-theme board card style.
 */
export function CardMini({ card, owner, subtle = false, variant = "duel", onClick, title, className = "" }: CardMiniProps) {
  const inner = variant === "duel" ? (
    <div className={[
      "card-mini-duel",
      "transition-all duration-150",
      subtle ? "opacity-85 hover:opacity-100" : "",
      className,
    ].filter(Boolean).join(" ")}>
      <CardNyanoDuel card={card} owner={owner} />
    </div>
  ) : (
    <CardNyanoCompact
      card={card}
      owner={owner}
      className={[
        "transition-all duration-150",
        subtle ? "opacity-80 hover:opacity-100" : "",
        className,
      ].join(" ")}
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-2xl focus:outline-none focus:ring-4 focus:ring-nyano-200/60"
        title={title}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="rounded-2xl" title={title}>
      {inner}
    </div>
  );
}
