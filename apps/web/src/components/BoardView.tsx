import React from "react";
import type { BoardState } from "@nyano/triad-engine";
import { CardMini } from "./CardMini";

function toSet(xs?: number[] | null): Set<number> {
  return new Set(xs ?? []);
}

export function BoardView(props: {
  board: BoardState;
  focusCell?: number | null;
  placedCell?: number | null;
  flippedCells?: number[] | null;
}) {
  const flipped = toSet(props.flippedCells);
  const placedCell = props.placedCell ?? null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {props.board.map((cell, idx) => {
        const focused = props.focusCell === idx;
        const isPlaced = placedCell === idx;
        const isFlipped = flipped.has(idx);

        return (
          <div
            key={idx}
            className={[
              "aspect-square rounded-xl border p-2 transition",
              isPlaced ? "border-slate-900 ring-2 ring-slate-900" : isFlipped ? "border-amber-300 ring-2 ring-amber-300" : focused ? "border-slate-900" : "border-slate-200",
              "bg-white",
            ].join(" ")}
          >
            {cell ? (
              <CardMini card={cell.card} owner={cell.owner} />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">{idx}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
