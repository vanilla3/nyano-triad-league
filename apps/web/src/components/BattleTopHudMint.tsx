import React from "react";
import type { BoardCell, PlayerIndex } from "@nyano/triad-engine";

function countTiles(board: readonly (BoardCell | null)[]): { a: number; b: number } {
  let a = 0;
  let b = 0;
  for (const cell of board) {
    if (!cell) continue;
    if (cell.owner === 0) a++;
    if (cell.owner === 1) b++;
  }
  return { a, b };
}

export interface BattleTopHudMintProps {
  board: readonly (BoardCell | null)[];
  turnCount: number;
  maxTurns: number;
  currentPlayer: PlayerIndex;
  className?: string;
}

export function BattleTopHudMint({
  board,
  turnCount,
  maxTurns,
  currentPlayer,
  className = "",
}: BattleTopHudMintProps) {
  const tiles = countTiles(board);
  const clampedTurn = Math.max(0, Math.min(turnCount, maxTurns));
  const currentPlayerLabel = currentPlayer === 0 ? "A" : "B";

  return (
    <div
      className={["mint-top-hud", className].filter(Boolean).join(" ")}
      role="region"
      aria-label="Match top HUD"
    >
      <div className="mint-top-hud__logo" aria-label="Nyano Triad League">
        <span className="mint-top-hud__logo-main">Nyano Triad</span>
        <span className="mint-top-hud__logo-sub">League</span>
      </div>

      <div
        className="mint-top-hud__score"
        role="status"
        aria-live="polite"
        aria-label={`Score A ${tiles.a}, B ${tiles.b}`}
      >
        <span className="mint-top-hud__score-side mint-top-hud__score-side--a">
          <span className="mint-top-hud__score-icon" aria-hidden="true" />
          <span className="mint-top-hud__score-label">A</span>
          <span className="mint-top-hud__score-value">{tiles.a}</span>
        </span>
        <span className="mint-top-hud__score-separator" aria-hidden="true">
          -
        </span>
        <span className="mint-top-hud__score-side mint-top-hud__score-side--b">
          <span className="mint-top-hud__score-icon" aria-hidden="true" />
          <span className="mint-top-hud__score-label">B</span>
          <span className="mint-top-hud__score-value">{tiles.b}</span>
        </span>
        <span className="mint-top-hud__current-player" aria-label={`Current player ${currentPlayerLabel}`}>
          {currentPlayerLabel}
        </span>
      </div>

      <div
        className="mint-top-hud__turn"
        role="status"
        aria-live="polite"
        aria-label={`Turn ${clampedTurn} of ${maxTurns}`}
      >
        <span className="mint-top-hud__turn-label">TURN</span>
        <span className="mint-top-hud__turn-value">
          {clampedTurn}/{maxTurns}
        </span>
      </div>
    </div>
  );
}
