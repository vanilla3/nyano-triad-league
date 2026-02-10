import React from "react";
import { createPortal } from "react-dom";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";
import { CardNyanoDuel } from "./CardNyanoDuel";
import { JANKEN_ICONS, TRAIT_STYLES } from "./CardNyano";

/* ═══════════════════════════════════════════════════════════════════════════
   PREV-0501: CardPreviewPanel — Large card inspection popover

   Shows an enlarged CardNyanoDuel with full stats.
   Rendered as a React portal to escape overflow clipping.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface CardPreviewPanelProps {
  card: CardData;
  owner: PlayerIndex;
  anchorRect: DOMRect;
  position: "left" | "right";
  onClose: () => void;
}

/** Format trait name for display */
function formatTrait(trait: string | undefined): string {
  if (!trait || trait === "none") return "—";
  return trait.charAt(0).toUpperCase() + trait.slice(1);
}

/** Compute fixed positioning from anchor rect and preferred side */
function computeStyle(anchorRect: DOMRect, position: "left" | "right"): React.CSSProperties {
  const panelWidth = 220;
  const gap = 12;

  let left: number;
  if (position === "right") {
    left = anchorRect.right + gap;
    // Clamp to viewport
    if (left + panelWidth > window.innerWidth - 8) {
      left = anchorRect.left - panelWidth - gap;
    }
  } else {
    left = anchorRect.left - panelWidth - gap;
    if (left < 8) {
      left = anchorRect.right + gap;
    }
  }

  // Vertically center on the anchor, clamped to viewport
  let top = anchorRect.top + anchorRect.height / 2 - 160;
  top = Math.max(8, Math.min(top, window.innerHeight - 340));

  return { top, left };
}

export function CardPreviewPanel({
  card,
  owner,
  anchorRect,
  position,
  onClose,
}: CardPreviewPanelProps) {
  const style = computeStyle(anchorRect, position);
  const trait = card.trait ?? "none";
  const traitStyle = TRAIT_STYLES[trait];
  const janken = JANKEN_ICONS[card.jankenHand];

  return createPortal(
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="mint-preview-panel"
      style={style}
      onClick={(e) => e.stopPropagation()}
      onPointerLeave={onClose}
    >
      {/* Large card art */}
      <div className="mint-preview-panel__card">
        <CardNyanoDuel card={card} owner={owner} />
      </div>

      {/* Stats section */}
      <div className="mint-preview-panel__stats">
        {/* Token ID */}
        <div className="mint-preview-panel__stat-row">
          <span className="mint-preview-panel__stat-label">Token</span>
          <span className="mint-preview-panel__stat-value">#{card.tokenId.toString()}</span>
        </div>

        {/* Janken */}
        <div className="mint-preview-panel__stat-row">
          <span className="mint-preview-panel__stat-label">Janken</span>
          <span className="mint-preview-panel__stat-value">{janken.emoji} {janken.label}</span>
        </div>

        {/* Trait */}
        {trait !== "none" && (
          <div className="mint-preview-panel__stat-row">
            <span className="mint-preview-panel__stat-label">Trait</span>
            <span className="mint-preview-panel__stat-value">{traitStyle.icon} {formatTrait(trait)}</span>
          </div>
        )}

        {/* Edges */}
        <div className="mint-preview-panel__stat-row">
          <span className="mint-preview-panel__stat-label">Edges</span>
          <span className="mint-preview-panel__stat-value">
            {Number(card.edges.up)} / {Number(card.edges.right)} / {Number(card.edges.down)} / {Number(card.edges.left)}
          </span>
        </div>

        {/* Combat stat sum */}
        <div className="mint-preview-panel__stat-row">
          <span className="mint-preview-panel__stat-label">Combat</span>
          <span className="mint-preview-panel__stat-value">{card.combatStatSum}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
