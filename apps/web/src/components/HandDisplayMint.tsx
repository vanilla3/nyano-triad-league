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
  onSelect?: (index: number) => void;
  disabled?: boolean;
}

export function HandDisplayMint({
  cards,
  owner,
  usedIndices,
  selectedIndex,
  onSelect,
  disabled = false,
}: HandDisplayMintProps) {
  const preview = useCardPreview();

  return (
    <div className="mint-hand">
      {cards.map((card, idx) => {
        const isUsed = usedIndices.has(idx);
        const isSelected = selectedIndex === idx;
        const isDisabled = isUsed || disabled;

        const classes = [
          "mint-hand-card",
          owner === 0 ? "mint-hand-card--a" : "mint-hand-card--b",
          isSelected && "mint-hand-card--selected",
          isUsed && "mint-hand-card--used",
        ].filter(Boolean).join(" ");

        return (
          <button
            key={idx}
            className={classes}
            disabled={isDisabled}
            onClick={() => { if (!isDisabled) onSelect?.(idx); }}
            onPointerEnter={(e) => { if (!isUsed) preview.show(card, owner, e.currentTarget); }}
            onPointerLeave={() => preview.hide()}
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
