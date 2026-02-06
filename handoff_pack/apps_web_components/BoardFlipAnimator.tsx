/**
 * BoardFlipAnimator.tsx
 * 
 * Board transition animation manager for /match page.
 * Tracks previous board state, computes placed/flipped deltas,
 * and exposes animation state for BoardView props.
 * 
 * Usage:
 *   const anim = useBoardFlipAnimation(boardNow, sim.ok);
 *   <BoardView ... placedCell={anim.placedCell} flippedCells={anim.flippedCells} />
 */
import React from "react";

export interface BoardAnimState {
  /** Cell index where a card was just placed (null = no animation) */
  placedCell: number | null;
  /** Cell indices that were flipped this turn */
  flippedCells: number[];
  /** Total flip count for the current animation cycle */
  flipCount: number;
  /** Whether an animation is currently active */
  isAnimating: boolean;
  /** Manually clear animation (e.g. on reset) */
  clear: () => void;
}

const EMPTY_BOARD = Array.from({ length: 9 }, () => null);

/**
 * Duration (ms) for the flip animation.
 * Matches the `card-flip` keyframe in tailwind.config.ts (400ms)
 * plus a brief hold so the glow effect is visible.
 */
const ANIM_DURATION_MS = 900;

/**
 * Hook that tracks board state transitions and exposes animation info.
 */
export function useBoardFlipAnimation(
  boardNow: any[],
  simReady: boolean
): BoardAnimState {
  const [placedCell, setPlacedCell] = React.useState<number | null>(null);
  const [flippedCells, setFlippedCells] = React.useState<number[]>([]);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const prevBoardRef = React.useRef<any[]>(EMPTY_BOARD);
  const timerRef = React.useRef<number | null>(null);

  const clear = React.useCallback(() => {
    setPlacedCell(null);
    setFlippedCells([]);
    setIsAnimating(false);
    prevBoardRef.current = EMPTY_BOARD;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!simReady) return;

    const prev = prevBoardRef.current;
    const next = boardNow;

    let placed: number | null = null;
    const flipped: number[] = [];

    for (let i = 0; i < 9; i++) {
      const a = prev[i];
      const b = next[i];

      // New card placed on an empty cell
      if (!a && b) {
        placed = i;
        continue;
      }

      // Owner changed → flip
      if (a && b && a.owner !== b.owner) {
        flipped.push(i);
      }
    }

    // Only trigger animation if there's an actual change
    if (placed !== null || flipped.length > 0) {
      setPlacedCell(placed);
      setFlippedCells(flipped);
      setIsAnimating(true);

      // Clear animation after duration
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setPlacedCell(null);
        setFlippedCells([]);
        setIsAnimating(false);
        timerRef.current = null;
      }, ANIM_DURATION_MS);
    }

    prevBoardRef.current = next;

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [boardNow, simReady]);

  return {
    placedCell,
    flippedCells,
    flipCount: flippedCells.length,
    isAnimating,
    clear,
  };
}

/**
 * Presentational: brief "Last Move" feedback strip.
 * Shows what just happened (placed cell, flipped count) with animation.
 */
export function LastMoveFeedback({
  placedCell,
  flippedCells,
  turnPlayer,
}: {
  placedCell: number | null;
  flippedCells: number[];
  turnPlayer: "A" | "B";
}) {
  if (placedCell === null && flippedCells.length === 0) return null;

  return (
    <div className="animate-fade-in-up flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm shadow-soft-sm border-flip/30 bg-gradient-to-r from-amber-50 to-white">
      {/* Placed indicator */}
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-flip animate-pulse" />
        <span className="font-display font-bold text-amber-700">
          {turnPlayer} → cell {placedCell}
        </span>
      </div>

      {/* Flip indicator */}
      {flippedCells.length > 0 && (
        <>
          <div className="w-px h-4 bg-surface-200" />
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-chain animate-pulse" />
            <span className="font-display font-bold text-violet-700">
              Flipped {flippedCells.length}
            </span>
            <span className="text-xs text-surface-400 font-mono">
              [{flippedCells.join(", ")}]
            </span>
          </div>
        </>
      )}
    </div>
  );
}
