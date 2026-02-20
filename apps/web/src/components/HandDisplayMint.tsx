import React from "react";
import type { CardData, PlayerIndex } from "@nyano/triad-engine";
import { CardNyanoDuel } from "./CardNyanoDuel";
import { CardPreviewPanel } from "./CardPreviewPanel";
import { useCardPreview } from "@/hooks/useCardPreview";

/* ═══════════════════════════════════════════════════════════════════════════
   HAND DISPLAY MINT — Nintendo-level UX Hand (NIN-UX-022)

   Features:
   - Horizontal card row with touch-friendly sizing
   - Selected card lifts up with visual feedback
   - Mobile confirm flow: tap → preview → confirm (NIN-UX-022)
   - Used cards greyed out and shrunk
   - Fully compatible with HandDisplayRPGProps interface
   ═══════════════════════════════════════════════════════════════════════════ */

export interface HandDisplayMintProps {
  cards: CardData[];
  owner: PlayerIndex;
  usedIndices: Set<number>;
  selectedIndex: number | null;
  forcedIndex?: number | null;
  onSelect?: (index: number) => void;
  disabled?: boolean;
  /** Enable desktop drag-and-drop from hand to board */
  enableDragDrop?: boolean;
  onCardDragStart?: (index: number) => void;
  onCardDragEnd?: () => void;
}

export function HandDisplayMint({
  cards,
  owner,
  usedIndices,
  selectedIndex,
  forcedIndex = null,
  onSelect,
  disabled = false,
  enableDragDrop = false,
  onCardDragStart,
  onCardDragEnd,
}: HandDisplayMintProps) {
  const preview = useCardPreview();

  return (
    <div className="mint-hand" role="listbox" aria-label={`Player ${owner === 0 ? "A" : "B"} hand`}>
      {cards.map((card, idx) => {
        const isUsed = usedIndices.has(idx);
        const isSelected = selectedIndex === idx;
        const isForcedMismatch = forcedIndex !== null && idx !== forcedIndex;
        const isDisabled = isUsed || disabled || isForcedMismatch;

        const classes = [
          "mint-hand-card",
          owner === 0 ? "mint-hand-card--a" : "mint-hand-card--b",
          isSelected && "mint-hand-card--selected",
          isUsed && "mint-hand-card--used",
          enableDragDrop && !isDisabled && "mint-hand-card--draggable",
        ].filter(Boolean).join(" ");

        const lp = !isUsed ? preview.longPressHandlers(card, owner) : undefined;

        return (
          <button
            key={idx}
            role="option"
            aria-selected={isSelected}
            aria-disabled={isDisabled}
            aria-label={`Card ${idx + 1}: edges ${card.edges.up}/${card.edges.right}/${card.edges.down}/${card.edges.left}${isUsed ? " (used)" : ""}`}
            className={classes}
            disabled={isDisabled}
            draggable={enableDragDrop && !isDisabled}
            data-hand-card={idx}
            onClick={() => { if (!isDisabled) onSelect?.(idx); }}
            onDragStart={(e) => {
              if (!enableDragDrop || isDisabled) {
                e.preventDefault();
                return;
              }
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("application/x-nytl-card-index", String(idx));
              e.dataTransfer.setData("text/plain", String(idx));
              onCardDragStart?.(idx);
            }}
            onDragEnd={() => {
              if (!enableDragDrop) return;
              onCardDragEnd?.();
            }}
            onPointerEnter={(e) => { if (!isUsed) preview.show(card, owner, e.currentTarget); }}
            onPointerLeave={() => preview.hide()}
            onTouchStart={lp?.onTouchStart}
            onTouchEnd={lp?.onTouchEnd}
            onTouchMove={lp?.onTouchMove}
            onContextMenu={lp?.onContextMenu}
          >
            {/* Slot number badge */}
            <div
              className={[
                "mint-hand-card__slot",
                owner === 0 ? "mint-hand-card__slot--a" : "mint-hand-card__slot--b",
              ].join(" ")}
            >
              {idx + 1}
            </div>

            {/* Card content */}
            <CardNyanoDuel card={card} owner={owner} className={!isSelected ? "opacity-80" : ""} />

            {/* Used overlay */}
            {isUsed && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-xl"
                style={{ background: "rgba(255,255,255,0.5)" }}
              >
                <span className="text-lg text-surface-400">✓</span>
              </div>
            )}
          </button>
        );
      })}

      {/* Card preview popover (PREV-0501) */}
      {preview.state.visible && preview.state.card && preview.state.anchorRect && (
        <CardPreviewPanel
          card={preview.state.card}
          owner={preview.state.owner!}
          anchorRect={preview.state.anchorRect}
          position={preview.state.position}
          onClose={preview.hide}
        />
      )}
    </div>
  );
}
