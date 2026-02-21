import React from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Skeleton — shimmer-based loading placeholders.

   Uses the `skeleton-base` CSS class (index.css) which provides:
   - bg-surface-200 background
   - rounded-xl corners
   - animated shimmer overlay via ::after pseudo-element
   ═══════════════════════════════════════════════════════════════════════════ */

type BoxProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
};

/**
 * SkeletonBox — the base building block.
 * A rounded rectangle with a shimmer animation.
 */
export function SkeletonBox({ className = "", width, height }: BoxProps) {
  return (
    <div
      className={["skeleton-base", className].join(" ")}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

type CardProps = {
  className?: string;
};

/**
 * SkeletonCard — card-shaped loading placeholder.
 * Mimics the card component layout with header and body lines.
 */
export function SkeletonCard({ className = "" }: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-surface-200 bg-white p-5",
        "animate-pulse-soft",
        className,
      ].join(" ")}
      aria-hidden="true"
    >
      {/* Icon placeholder */}
      <div className="skeleton-base w-10 h-10 rounded-xl mb-3" />
      {/* Title line */}
      <div className="skeleton-base h-5 w-3/4 mb-2" />
      {/* Description line */}
      <div className="skeleton-base h-4 w-full mb-1" />
      <div className="skeleton-base h-4 w-2/3" />
    </div>
  );
}

type BoardProps = {
  className?: string;
};

/**
 * SkeletonBoard — 3x3 grid of square shimmer cells.
 * Mimics the game board layout during loading.
 */
export function SkeletonBoard({ className = "" }: BoardProps) {
  return (
    <div
      className={["grid grid-cols-3 gap-2 aspect-square", className].join(" ")}
      aria-hidden="true"
    >
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          className="skeleton-base aspect-square rounded-2xl"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

type HandProps = {
  /** Number of card slots to show. @default 5 */
  count?: number;
  className?: string;
};

/**
 * SkeletonHand — a row of card-shaped shimmer boxes.
 * Mimics the player's hand during loading.
 */
export function SkeletonHand({ count = 5, className = "" }: HandProps) {
  return (
    <div
      className={["flex gap-2", className].join(" ")}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="skeleton-base flex-1 aspect-[3/4] rounded-xl"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}
