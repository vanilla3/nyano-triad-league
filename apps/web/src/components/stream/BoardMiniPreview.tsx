import React from "react";
import type { BoardCellLite } from "@/lib/streamer_bus";

/* ═══════════════════════════════════════════════════════════════════════════
   BoardMiniPreview — Compact 3x3 board state indicator for StreamOperationsHUD.

   Shows colored dots: sky=A, rose=B, grey=empty.
   Last-placed cell gets a ring highlight.
   ═══════════════════════════════════════════════════════════════════════════ */

export type { BoardCellLite };

export interface BoardMiniPreviewProps {
  board: (BoardCellLite | null)[];
  lastCell?: number | null;
}

export const BoardMiniPreview: React.FC<BoardMiniPreviewProps> = React.memo(
  function BoardMiniPreview({ board, lastCell }) {
    return (
      <div className="inline-grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }, (_, i) => {
          const cell = board[i] ?? null;
          const isLast = lastCell === i;
          const bgColor = cell
            ? cell.owner === 0
              ? "bg-sky-400"
              : "bg-rose-400"
            : "bg-slate-200";
          const ring = isLast ? "ring-2 ring-amber-400" : "";

          return (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-sm ${bgColor} ${ring}`}
              title={`Cell ${i}: ${cell ? (cell.owner === 0 ? "A" : "B") : "empty"}${isLast ? " (last)" : ""}`}
            />
          );
        })}
      </div>
    );
  },
);
