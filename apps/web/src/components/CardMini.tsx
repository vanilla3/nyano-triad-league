import React from "react";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";
import { CardNyanoCompact } from "./CardNyano";

export type CardMiniProps = {
  card: CardData;
  owner: PlayerIndex;
  /** Slightly muted style (for lists / non-active cards) */
  subtle?: boolean;
  /** Optional click handler */
  onClick?: () => void;
  /** Optional label (for accessibility / tooltip) */
  title?: string;
  className?: string;
};

/**
 * Legacy-friendly small card component.
 * Internally uses the newer Nyano card skin so the whole UI looks cohesive.
 */
export function CardMini({ card, owner, subtle = false, onClick, title, className = "" }: CardMiniProps) {
  const inner = (
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
