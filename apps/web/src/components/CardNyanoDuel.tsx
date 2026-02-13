import React from "react";
import type { CardData } from "@nyano/triad-engine";
import { NyanoCardArt } from "./NyanoCardArt";
import { JANKEN_ICONS, TRAIT_STYLES } from "./CardNyano";

/* ═══════════════════════════════════════════════════════════════════════════
   CARD-0101: CardNyanoDuel — Art-forward "duel" card skin

   Renders NFT art as the hero image (full-bleed) with a glass overlay
   panel showing edge numbers in a cross pattern.

   Designed to replace CardNyanoCompact in Mint theme contexts.
   Uses same prop interface for easy drop-in replacement.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface CardNyanoDuelProps {
  card: CardData;
  owner: 0 | 1;
  /** Highlight specific edge (flip winner indicator) */
  highlightEdge?: "up" | "right" | "down" | "left" | null;
  /** Show placement animation */
  isPlaced?: boolean;
  /** Show flip animation */
  isFlipped?: boolean;
  /** Additional className */
  className?: string;
}

/** Classify edge value for strength coloring */
function edgeStrengthClass(value: number): string {
  if (value >= 8) return "mint-duel-card__edge--high";
  if (value >= 4) return "mint-duel-card__edge--mid";
  return "mint-duel-card__edge--low";
}

export const CardNyanoDuel = React.memo(function CardNyanoDuel({
  card,
  owner,
  highlightEdge = null,
  isPlaced = false,
  isFlipped = false,
  className = "",
}: CardNyanoDuelProps) {
  const janken = JANKEN_ICONS[card.jankenHand];
  const trait = card.trait ?? "none";
  const traitStyle = TRAIT_STYLES[trait];

  const up = Number(card.edges.up);
  const right = Number(card.edges.right);
  const down = Number(card.edges.down);
  const left = Number(card.edges.left);

  const renderEdge = (side: "up" | "right" | "down" | "left", value: number) => (
    <div
      className={[
        "mint-duel-card__edge",
        `mint-duel-card__edge--${side}`,
        edgeStrengthClass(value),
        highlightEdge === side && "mint-duel-card__edge--highlight",
      ].filter(Boolean).join(" ")}
    >
      <span className="mint-duel-card__edge-value">{value}</span>
    </div>
  );

  return (
    <div
      className={[
        "mint-duel-card",
        "relative w-full h-full",
        `mint-duel-card--owner-${owner === 0 ? "a" : "b"}`,
        isPlaced && "mint-duel-card--placed",
        isFlipped && "mint-duel-card--flipped",
        className,
      ].filter(Boolean).join(" ")}
    >
      {/* NFT Art Hero — full bleed background */}
      <div className="mint-duel-card__art">
        <NyanoCardArt tokenId={card.tokenId} fill className="rounded-none" />
      </div>

      {/* Owner tint overlay */}
      <div
        className={[
          "mint-duel-card__tint",
          owner === 0 ? "bg-sky-400" : "bg-rose-400",
        ].join(" ")}
      />

      {/* Trait accent bar at top */}
      {trait !== "none" && (
        <div className={["mint-duel-card__trait", traitStyle.bg].join(" ")} />
      )}

      {/* Token ID label */}
      <div className="mint-duel-card__token-id">
        #{card.tokenId.toString().slice(-3)}
      </div>

      {/* Glass bottom panel with edge numbers */}
      <div className="mint-duel-card__glass">
        <div className="mint-duel-card__edges">
          {/* Row 1: empty | UP | empty */}
          <div />
          {renderEdge("up", up)}
          <div />

          {/* Row 2: LEFT | JANKEN | RIGHT */}
          {renderEdge("left", left)}
          <div className="mint-duel-card__janken" title={janken.label}>
            <span className="mint-duel-card__janken-glyph">{janken.emoji}</span>
          </div>
          {renderEdge("right", right)}

          {/* Row 3: empty | DOWN | empty */}
          <div />
          {renderEdge("down", down)}
          <div />
        </div>
      </div>

      {/* Holo foil shimmer overlay */}
      <div className="mint-duel-card__foil" />
    </div>
  );
});
