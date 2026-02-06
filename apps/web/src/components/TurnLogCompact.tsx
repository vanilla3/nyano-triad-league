import React from "react";
import type { PlayerIndex } from "@nyano/triad-engine";

export type TurnLogCompactItem = {
  turnIndex: number;
  by: PlayerIndex;
  cell: number; // 0..8
  cardIndex: number; // 0..4
  warningMarkCell?: number | null;

  // Optional extra fields
  flipCount?: number;
  comboCount?: number;
  comboEffect?: string;
  triadPlus?: number;
};

export type TurnLogCompactProps = {
  turns: TurnLogCompactItem[];
  /** Max items shown (latest first). Default 5. */
  maxItems?: number;
  className?: string;
};

const CELL_COORDS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"] as const;

export function TurnLogCompact({ turns, maxItems = 5, className = "" }: TurnLogCompactProps) {
  const slice = turns.slice(-maxItems).reverse();

  return (
    <div className={["grid gap-1", className].join(" ")}>
      {slice.map((t) => {
        const by = t.by === 0 ? "A" : "B";
        const coord = CELL_COORDS[t.cell] ?? String(t.cell);
        const wm = typeof t.warningMarkCell === "number" ? CELL_COORDS[t.warningMarkCell] ?? String(t.warningMarkCell) : null;

        return (
          <div
            key={t.turnIndex}
            className="flex items-center justify-between rounded-xl border border-surface-200 bg-white/80 px-3 py-2 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-surface-500">#{t.turnIndex + 1}</span>
              <span
                className={[
                  "badge",
                  by === "A" ? "badge-player-a" : "badge-player-b",
                  "text-2xs",
                ].join(" ")}
              >
                {by}
              </span>
              <span className="font-mono text-surface-700">
                {coord} ← {t.cardIndex + 1}
              </span>
              {wm && <span className="text-surface-500">wm:{wm}</span>}
            </div>

            <div className="flex items-center gap-2 text-2xs text-surface-500">
              {typeof t.triadPlus === "number" && t.triadPlus > 0 && <span>+{t.triadPlus}</span>}
              {typeof t.comboEffect === "string" && t.comboEffect !== "none" && <span>{t.comboEffect}</span>}
              {typeof t.flipCount === "number" && t.flipCount > 0 && <span>flip:{t.flipCount}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
