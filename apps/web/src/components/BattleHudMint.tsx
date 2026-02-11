import React from "react";
import type { BoardCell, PlayerIndex } from "@nyano/triad-engine";
import { assessBoardAdvantage } from "@/lib/ai/board_advantage";
import type { MoveTip } from "@/lib/ai/move_tips";
import { reasonCodeLabel, type AiReasonCode } from "@/lib/ai/nyano_ai";

/* ═══════════════════════════════════════════════════════════════════════════
   BattleHudMint — Frosted-glass battle HUD for Mint duel mode (P3-300)

   Displays: Turn counter + progress bar, advantage badge, move tip,
   AI reason badge, phase + player dot.
   Replaces ScoreBar in mint mode. Pure presentational component.
   ═══════════════════════════════════════════════════════════════════════════ */

const TIP_ICONS: Record<string, string> = {
  warning_dodge: "🛡️",
  warning_triggered: "⚠️",
  warning_trap: "🪤",
  domination_combo: "👑",
  big_swing: "💥",
  chain_combo: "⛓️",
  corner_control: "📐",
  center_hold: "🎯",
};

export interface BattleHudMintProps {
  board: (BoardCell | null)[];
  turnCount: number;
  maxTurns: number;
  currentPlayer: PlayerIndex;
  gamePhase: "select_card" | "select_cell" | "ai_turn" | "game_over";
  moveTip?: MoveTip | null;
  aiReasonCode?: AiReasonCode | null;
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
  moveTip,
  aiReasonCode,
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

      {/* Move tip badge (P1-120) */}
      {moveTip && (
        <div
          className={[
            "mint-battle-hud__tip",
            `mint-battle-hud__tip--${moveTip.key}`,
          ].join(" ")}
          title={moveTip.labelEn}
        >
          <span className="mint-battle-hud__tip-icon">
            {TIP_ICONS[moveTip.key] ?? "💡"}
          </span>
          <span className="mint-battle-hud__tip-label">
            {moveTip.labelJa}
          </span>
        </div>
      )}

      {/* AI reason badge (P3-312) */}
      {aiReasonCode && (
        <div className="mint-battle-hud__ai-reason" title={reasonCodeLabel(aiReasonCode)}>
          <span className="mint-battle-hud__ai-reason-icon">🐱</span>
          <span className="mint-battle-hud__ai-reason-label">
            {reasonCodeLabel(aiReasonCode)}
          </span>
        </div>
      )}

      {/* Active player tag + phase indicator */}
      <div className="mint-battle-hud__phase">
        <span
          className={[
            "mint-battle-hud__player-tag",
            currentPlayer === 0
              ? "mint-battle-hud__player-tag--a"
              : "mint-battle-hud__player-tag--b",
          ].join(" ")}
          aria-label={`Current player: ${currentPlayer === 0 ? "A" : "B"}`}
        >
          {gamePhase === "ai_turn" ? "🐱 Nyano" : currentPlayer === 0 ? "A" : "B"}
        </span>
        <span className="mint-battle-hud__phase-label">
          {PHASE_LABELS[gamePhase]}
        </span>
      </div>
    </div>
  );
}
