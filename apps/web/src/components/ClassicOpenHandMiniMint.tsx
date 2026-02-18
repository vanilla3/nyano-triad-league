import React from "react";
import type { CardData } from "@nyano/triad-engine";

function toIndexSet(v?: ReadonlySet<number> | readonly number[] | null): ReadonlySet<number> {
  if (!v) return new Set<number>();
  if (v instanceof Set) return v;
  return new Set(v);
}

export interface ClassicOpenHandMiniMintProps {
  sideLabel: string;
  cards: readonly (CardData | null)[];
  openCardIndices?: ReadonlySet<number> | readonly number[] | null;
  usedCardIndices?: ReadonlySet<number> | readonly number[] | null;
  modeLabel?: string | null;
  className?: string;
}

export function ClassicOpenHandMiniMint({
  sideLabel,
  cards,
  openCardIndices,
  usedCardIndices,
  modeLabel = null,
  className = "",
}: ClassicOpenHandMiniMintProps) {
  const openSet = toIndexSet(openCardIndices);
  const usedSet = toIndexSet(usedCardIndices);
  const slotCount = Math.max(5, cards.length);

  return (
    <section
      className={["mint-openhand-mini", className].filter(Boolean).join(" ")}
      aria-label={`${sideLabel} 公開手札`}
    >
      <header className="mint-openhand-mini__header">
        <span className="mint-openhand-mini__label">{sideLabel}</span>
        {modeLabel ? <span className="mint-openhand-mini__mode">{modeLabel}</span> : null}
      </header>

      <div className="mint-openhand-mini__slots">
        {Array.from({ length: slotCount }, (_, idx) => {
          const card = cards[idx] ?? null;
          const isUsed = usedSet.has(idx);
          const isOpen = openSet.has(idx);
          const stateLabel = isUsed ? "used" : isOpen ? "open" : "hidden";
          const slotClass = [
            "mint-openhand-mini__slot",
            isOpen ? "mint-openhand-mini__slot--open" : "mint-openhand-mini__slot--hidden",
            isUsed && "mint-openhand-mini__slot--used",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div
              key={`${sideLabel}-slot-${idx}`}
              className={slotClass}
              role="img"
              aria-label={`${sideLabel} slot ${idx + 1} ${stateLabel}`}
            >
              {isOpen && card ? (
                <div className="mint-openhand-mini__face">
                  <span className="mint-openhand-mini__edge mint-openhand-mini__edge--up">{card.edges.up}</span>
                  <span className="mint-openhand-mini__edge mint-openhand-mini__edge--left">{card.edges.left}</span>
                  <span className="mint-openhand-mini__edge mint-openhand-mini__edge--right">{card.edges.right}</span>
                  <span className="mint-openhand-mini__edge mint-openhand-mini__edge--down">{card.edges.down}</span>
                </div>
              ) : (
                <span className="mint-openhand-mini__back" aria-hidden="true">
                  {isUsed ? "済" : "?"}
                </span>
              )}
              <span className="mint-openhand-mini__slot-index" aria-hidden="true">
                {idx + 1}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
