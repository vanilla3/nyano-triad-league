import React from "react";
import type { CardData, TraitType } from "@nyano/triad-engine";
import { NyanoCardArt } from "./NyanoCardArt";

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

export const JANKEN_ICONS: Record<0 | 1 | 2, { emoji: string; label: string; color: string }> = {
  0: { emoji: "✊", label: "Rock", color: "text-amber-600" },
  1: { emoji: "✋", label: "Paper", color: "text-emerald-600" },
  2: { emoji: "✌️", label: "Scissors", color: "text-violet-600" },
};

export const TRAIT_STYLES: Record<TraitType, { bg: string; text: string; border: string; icon: string }> = {
  none: { bg: "bg-surface-100", text: "text-surface-500", border: "border-surface-200", icon: "—" },
  cosmic: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", icon: "✦" },
  light: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: "☀" },
  shadow: { bg: "bg-slate-800", text: "text-slate-100", border: "border-slate-600", icon: "☾" },
  forest: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: "🌿" },
  metal: { bg: "bg-zinc-200", text: "text-zinc-700", border: "border-zinc-300", icon: "⚙" },
  flame: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: "🔥" },
  aqua: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200", icon: "💧" },
  thunder: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", icon: "⚡" },
  wind: { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", icon: "🍃" },
  earth: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", icon: "🪨" },
};

export const OWNER_STYLES = {
  0: {
    border: "border-player-a-400",
    bg: "bg-player-a-50",
    glow: "shadow-glow-a",
    accent: "text-player-a-600",
    label: "A",
  },
  1: {
    border: "border-player-b-400",
    bg: "bg-player-b-50",
    glow: "shadow-glow-b",
    accent: "text-player-b-600",
    label: "B",
  },
};

function formatTraitLabel(trait: TraitType): string {
  if (trait === "none") return "—";
  return trait.charAt(0).toUpperCase() + trait.slice(1);
}

/* ═══════════════════════════════════════════════════════════════════════════
   EDGE VALUE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

function EdgeValue({
  value,
  position,
  highlight = false,
}: {
  value: number;
  position: "up" | "right" | "down" | "left";
  highlight?: boolean;
}) {
  const positionStyles = {
    up: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
    right: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
    down: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
    left: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  const strengthColor =
    value >= 8
      ? "bg-amber-500 text-white"
      : value >= 6
        ? "bg-emerald-500 text-white"
        : value >= 4
          ? "bg-sky-500 text-white"
          : "bg-surface-200 text-surface-700";

  return (
    <div
      className={[
        "absolute z-10 flex items-center justify-center",
        "w-6 h-6 rounded-full",
        "text-xs font-bold font-display",
        "border-2 border-white",
        "transition-all duration-200",
        positionStyles[position],
        strengthColor,
        highlight && "ring-2 ring-amber-400 ring-offset-1 scale-110",
      ].join(" ")}
    >
      {value}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CARD COMPONENT - FULL SIZE
   ═══════════════════════════════════════════════════════════════════════════ */

export interface CardNyanoProps {
  card: CardData;
  owner: 0 | 1;
  /** Show image (default true for full card) */
  showImage?: boolean;
  /** Highlight specific edge (for battle explanation) */
  highlightEdge?: "up" | "right" | "down" | "left" | null;
  /** Show trait badge */
  showTrait?: boolean;
  /** Is this card selected/active */
  selected?: boolean;
  /** Is this card disabled (already used) */
  disabled?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Show glow effect */
  glow?: boolean;
  /** Additional className */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export function CardNyano({
  card,
  owner,
  showImage = true,
  highlightEdge = null,
  showTrait = true,
  selected = false,
  disabled = false,
  size = "md",
  glow = false,
  className = "",
  onClick,
}: CardNyanoProps) {
  const ownerStyle = OWNER_STYLES[owner];
  const janken = JANKEN_ICONS[card.jankenHand];
  const trait = card.trait ?? "none";
  const traitStyle = TRAIT_STYLES[trait];

  const sizeClasses = {
    sm: "w-20 h-28",
    md: "w-28 h-40",
    lg: "w-36 h-52",
    xl: "w-48 h-68",
  };

  return (
    <div
      className={[
        "relative rounded-2xl overflow-hidden",
        "bg-white border-2",
        "transition-all duration-200",
        sizeClasses[size],
        ownerStyle.border,
        selected && "ring-2 ring-nyano-500 ring-offset-2",
        disabled && "opacity-50 grayscale",
        glow && ownerStyle.glow,
        onClick && !disabled && "cursor-pointer hover:scale-105 active:scale-100",
        className,
      ].join(" ")}
      onClick={disabled ? undefined : onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
    >
      {/* Background gradient based on owner */}
      <div
        className={[
          "absolute inset-0 opacity-20",
          owner === 0
            ? "bg-gradient-to-br from-player-a-200 to-transparent"
            : "bg-gradient-to-br from-player-b-200 to-transparent",
        ].join(" ")}
      />

      {/* Edge values */}
      <EdgeValue value={Number(card.edges.up)} position="up" highlight={highlightEdge === "up"} />
      <EdgeValue value={Number(card.edges.right)} position="right" highlight={highlightEdge === "right"} />
      <EdgeValue value={Number(card.edges.down)} position="down" highlight={highlightEdge === "down"} />
      <EdgeValue value={Number(card.edges.left)} position="left" highlight={highlightEdge === "left"} />

      {/* Card content */}
      <div className="relative h-full flex flex-col p-2">
        {/* Header: Token ID & Trait */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-surface-400">#{card.tokenId.toString()}</span>
          {showTrait && trait !== "none" && (
            <span
              className={[
                "px-1.5 py-0.5 rounded-md",
                "text-[9px] font-semibold",
                "border",
                traitStyle.bg,
                traitStyle.text,
                traitStyle.border,
              ].join(" ")}
            >
              {traitStyle.icon} {formatTraitLabel(trait)}
            </span>
          )}
        </div>

        {/* Center: Nyano Image */}
        {showImage && (
          <div className="flex-1 flex items-center justify-center py-2">
            <NyanoCardArt
              tokenId={card.tokenId}
              size={size === "sm" ? "sm" : size === "md" ? "md" : "lg"}
              className="rounded-xl"
            />
          </div>
        )}

        {/* Bottom: Janken & Stats */}
        <div className="mt-auto">
          {/* Janken hand indicator */}
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className={["text-lg", janken.color].join(" ")}>{janken.emoji}</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-surface-500">Σ{card.combatStatSum}</span>
            <span className={["font-bold", ownerStyle.accent].join(" ")}>{ownerStyle.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPACT CARD COMPONENT - FOR BOARD & LISTS
   ═══════════════════════════════════════════════════════════════════════════ */

export interface CardNyanoCompactProps {
  card: CardData;
  owner: 0 | 1;
  /** Highlight specific edge */
  highlightEdge?: "up" | "right" | "down" | "left" | null;
  /** Is newly placed (show animation) */
  isPlaced?: boolean;
  /** Is flipped this turn (show animation) */
  isFlipped?: boolean;
  /** Additional className */
  className?: string;
}

export function CardNyanoCompact({
  card,
  owner,
  highlightEdge = null,
  isPlaced = false,
  isFlipped = false,
  className = "",
}: CardNyanoCompactProps) {
  const ownerStyle = OWNER_STYLES[owner];
  const janken = JANKEN_ICONS[card.jankenHand];
  const trait = card.trait ?? "none";
  const traitStyle = TRAIT_STYLES[trait];

  return (
    <div
      className={[
        "mint-compact-card",
        "relative w-full h-full rounded-xl overflow-hidden",
        "bg-white border-2",
        ownerStyle.border,
        isPlaced && "animate-card-place",
        isFlipped && "animate-card-flip",
        className,
      ].join(" ")}
    >
      {/* Owner background tint */}
      <div
        className={[
          "absolute inset-0 opacity-10",
          owner === 0 ? "bg-player-a-500" : "bg-player-b-500",
        ].join(" ")}
      />

      {/* Card art watermark (P1-100) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <NyanoCardArt tokenId={card.tokenId} size="sm" className="opacity-[0.12]" />
      </div>

      {/* Main content grid - 3x3 for edges */}
      <div className="relative h-full grid grid-cols-3 grid-rows-3 gap-0.5 p-1">
        {/* Top row */}
        <div />
        <div
          className={[
            "flex items-center justify-center rounded text-[10px] font-bold",
            "bg-surface-100",
            highlightEdge === "up" && "bg-amber-200 ring-1 ring-amber-400",
          ].join(" ")}
        >
          {Number(card.edges.up)}
        </div>
        <div />

        {/* Middle row */}
        <div
          className={[
            "flex items-center justify-center rounded text-[10px] font-bold",
            "bg-surface-100",
            highlightEdge === "left" && "bg-amber-200 ring-1 ring-amber-400",
          ].join(" ")}
        >
          {Number(card.edges.left)}
        </div>
        <div
          className={[
            "flex items-center justify-center rounded-lg text-sm",
            "font-bold",
            janken.color,
            trait !== "none" ? traitStyle.bg : "bg-surface-50",
          ].join(" ")}
        >
          {janken.emoji}
        </div>
        <div
          className={[
            "flex items-center justify-center rounded text-[10px] font-bold",
            "bg-surface-100",
            highlightEdge === "right" && "bg-amber-200 ring-1 ring-amber-400",
          ].join(" ")}
        >
          {Number(card.edges.right)}
        </div>

        {/* Bottom row */}
        <div />
        <div
          className={[
            "flex items-center justify-center rounded text-[10px] font-bold",
            "bg-surface-100",
            highlightEdge === "down" && "bg-amber-200 ring-1 ring-amber-400",
          ].join(" ")}
        >
          {Number(card.edges.down)}
        </div>
        <div />
      </div>

      {/* Trait accent bar (P1-100) */}
      {trait !== "none" && (
        <div className={["absolute top-0 inset-x-0 h-[2px]", traitStyle.bg].join(" ")} />
      )}

      {/* Token ID overlay */}
      <div className="absolute top-0.5 left-1 text-[8px] font-mono text-surface-400">
        #{card.tokenId.toString().slice(-3)}
      </div>

      {/* Owner indicator */}
      <div
        className={[
          "absolute bottom-0.5 right-1 text-[8px] font-bold",
          ownerStyle.accent,
        ].join(" ")}
      >
        {ownerStyle.label}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CARD SLOT COMPONENT - EMPTY PLACEHOLDER
   ═══════════════════════════════════════════════════════════════════════════ */

export interface CardSlotProps {
  index?: number;
  empty?: boolean;
  label?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CardSlot({
  index,
  selected = false,
  disabled = false,
  onClick,
  className = "",
}: CardSlotProps) {
  return (
    <button
      className={[
        "w-full h-full rounded-xl",
        "border-2 border-dashed",
        "flex items-center justify-center",
        "transition-all duration-200",
        selected
          ? "border-nyano-500 bg-nyano-50 text-nyano-600"
          : "border-surface-300 bg-surface-50 text-surface-400",
        !disabled && "hover:border-surface-400 hover:bg-surface-100",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      ].join(" ")}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <span className="text-xs font-mono">{index}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HAND DISPLAY COMPONENT - PLAYER'S CARDS
   ═══════════════════════════════════════════════════════════════════════════ */

export interface HandDisplayProps {
  cards: CardData[];
  owner: 0 | 1;
  usedIndices: Set<number>;
  selectedIndex: number | null;
  onSelect?: (index: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function HandDisplay({
  cards,
  owner,
  usedIndices,
  selectedIndex,
  onSelect,
  disabled = false,
  size = "md",
}: HandDisplayProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {cards.map((card, idx) => {
        const isUsed = usedIndices.has(idx);
        const isSelected = selectedIndex === idx;

        return (
          <div key={idx} className="relative">
            <CardNyano
              card={card}
              owner={owner}
              size={size}
              selected={isSelected}
              disabled={isUsed || disabled}
              showImage={size !== "sm"}
              showTrait={size !== "sm"}
              onClick={onSelect && !isUsed ? () => onSelect(idx) : undefined}
            />
            {/* Slot number indicator */}
            <div
              className={[
                "absolute -bottom-1 -right-1",
                "w-5 h-5 rounded-full",
                "flex items-center justify-center",
                "text-[10px] font-bold",
                "border-2 border-white",
                isUsed
                  ? "bg-surface-300 text-surface-500"
                  : isSelected
                    ? "bg-nyano-500 text-white"
                    : "bg-surface-600 text-white",
              ].join(" ")}
            >
              {idx + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
