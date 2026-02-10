import React from "react";
import type { BoardCell, PlayerIndex } from "@nyano/triad-engine";
import { assessBoardAdvantage } from "@/lib/ai/board_advantage";

/* ═══════════════════════════════════════════════════════════════════════════
   BattleHudMint — Frosted-glass battle HUD for Mint duel mode (P3-300)

   Displays: Turn counter + progress bar, advantage badge, phase + player dot.
   Replaces ScoreBar in mint mode. Pure presentational component.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface BattleHudMintProps {
  board: (BoardCell | null)[];
  turnCount: number;
  maxTurns: number;
  currentPlayer: PlayerIndex;
  gamePhase: "select_card" | "select_cell" | "ai_turn" | "game_over";
}

const PHASE_LABELS: Record<BattleHudMintProps["gamePhase"], string> = {
  select_card: "カード選択",
  select_cell: "配置先選択",
  ai_turn: "Nyano思考中",
  game_over: "試合終了",
};

export function BattleHudMint({
  board,
  turnCount,
  maxTurns,
  currentPlayer,
  gamePhase,
}: BattleHudMintProps) {
  const adv = assessBoardAdvantage(board);
  const progress = Math.round((turnCount / maxTurns) * 100);

  return (
    <div className="mint-battle-hud">
      {/* Turn counter + progress */}
      <div className="mint-battle-hud__turn">
        <span className="mint-battle-hud__turn-label">TURN</span>
        <span className="mint-battle-hud__turn-value">
          {turnCount}/{maxTurns}
        </span>
        <div className="mint-battle-hud__progress">
          <div
            className="mint-battle-hud__progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Advantage badge */}
      <div
        className={[
          "mint-battle-hud__advantage",
          `mint-battle-hud__advantage--${adv.badgeColor}`,
        ].join(" ")}
      >
        {adv.labelJa}
      </div>

      {/* Phase indicator */}
      <div className="mint-battle-hud__phase">
        <span
          className={[
            "mint-battle-hud__player-dot",
            currentPlayer === 0
              ? "mint-battle-hud__player-dot--a"
              : "mint-battle-hud__player-dot--b",
          ].join(" ")}
        />
        <span className="mint-battle-hud__phase-label">
          {PHASE_LABELS[gamePhase]}
        </span>
      </div>
    </div>
  );
}
