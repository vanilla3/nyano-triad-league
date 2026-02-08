import React from "react";
import type { BoardState, PlayerIndex } from "@nyano/triad-engine";

function countTiles(board: BoardState): { a: number; b: number } {
  let a = 0;
  let b = 0;
  for (const cell of board) {
    if (!cell) continue;
    if (cell.owner === 0) a++;
    if (cell.owner === 1) b++;
  }
  return { a, b };
}

function winnerLabel(w: PlayerIndex | "draw"): string {
  if (w === "draw") return "DRAW";
  return w === 0 ? "A WIN" : "B WIN";
}

export function ScoreBar(props: {
  board: BoardState;
  /** number of executed moves (0..maxMoves) */
  moveCount: number;
  maxMoves?: number;
  /** optional winner, typically for replay or completed matches */
  winner?: PlayerIndex | "draw" | null;
  labelA?: string;
  labelB?: string;
  className?: string;
  /** Size variant: "sm" (default), "md", "lg" (overlay-friendly). */
  size?: "sm" | "md" | "lg";
}) {
  const {
    board,
    moveCount,
    maxMoves = 9,
    winner = null,
    labelA = "A",
    labelB = "B",
    className = "",
    size = "sm",
  } = props;

  const tiles = React.useMemo(() => countTiles(board), [board]);
  const progress = Math.max(0, Math.min(1, maxMoves > 0 ? moveCount / maxMoves : 0));

  const showWinner = winner !== null && moveCount >= maxMoves;

  const tileBadgeCls = size === "lg" ? "badge badge-lg" : "badge";
  const tileNumCls = size === "lg" ? "font-bold text-base" : "font-bold";
  const moveTextCls = size === "lg" ? "text-sm font-semibold text-surface-600" : "text-xs font-semibold text-surface-600";
  const barH = size === "lg" ? "h-3" : "h-2";
  const winnerBadgeCls = size === "lg" ? "badge badge-lg" : "badge";

  return (
    <div className={["flex items-center justify-between gap-3", className].join(" ")}>
      <div className="flex items-center gap-2">
        <span className={[tileBadgeCls, "badge-sky"].join(" ")}>
          {labelA}: <span className={tileNumCls}>{tiles.a}</span>
        </span>
        <span className={[tileBadgeCls, "badge-rose"].join(" ")}>
          {labelB}: <span className={tileNumCls}>{tiles.b}</span>
        </span>
      </div>

      <div className="flex min-w-[140px] flex-1 flex-col items-center gap-1">
        <div className={moveTextCls}>
          moves {Math.min(moveCount, maxMoves)}/{maxMoves}
        </div>
        <div className={[barH, "w-full max-w-[220px] overflow-hidden rounded-full bg-surface-100"].join(" ")}>
          <div
            className={[barH, "rounded-full bg-nyano-400 transition-[width]"].join(" ")}
            style={{ width: `${Math.round(progress * 100)}%` }}
            aria-label="progress"
          />
        </div>
      </div>

      <div className="flex items-center justify-end">
        {showWinner ? (
          <span className={[winnerBadgeCls, winner === "draw" ? "badge-violet" : winner === 0 ? "badge-sky" : "badge-rose"].join(" ")}>
            {winnerLabel(winner)}
          </span>
        ) : (
          <span className={winnerBadgeCls}>—</span>
        )}
      </div>
    </div>
  );
}
