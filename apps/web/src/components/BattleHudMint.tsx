import React from "react";
import type { BoardCell, PlayerIndex } from "@nyano/triad-engine";
import { assessBoardAdvantage } from "@/lib/ai/board_advantage";
import type { MoveTip } from "@/lib/ai/move_tips";
import { reasonCodeLabel, type AiReasonCode } from "@/lib/ai/nyano_ai";

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
  tone?: "mint" | "pixi";
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
  tone = "mint",
}: BattleHudMintProps) {
  const adv = assessBoardAdvantage(board);
  const progress = Math.round((turnCount / maxTurns) * 100);
  const tipLabel = moveTip?.labelJa ?? "";
  const aiReasonLabel = aiReasonCode ? reasonCodeLabel(aiReasonCode) : "";

  return (
    <div className={["mint-battle-hud", tone === "pixi" ? "mint-battle-hud--pixi" : ""].filter(Boolean).join(" ")}>
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

      <div
        className={[
          "mint-battle-hud__advantage",
          `mint-battle-hud__advantage--${adv.badgeColor}`,
        ].join(" ")}
      >
        {adv.labelJa}
      </div>

      <div className="mint-battle-hud__insight" aria-live="polite" aria-atomic="true">
        <div
          className={[
            "mint-battle-hud__tip",
            moveTip ? `mint-battle-hud__tip--${moveTip.key}` : "mint-battle-hud__tip--empty",
          ].join(" ")}
          title={moveTip?.labelEn}
          aria-hidden={!moveTip}
        >
          <span className="mint-battle-hud__tip-icon">
            {moveTip ? (TIP_ICONS[moveTip.key] ?? "💡") : ""}
          </span>
          <span className="mint-battle-hud__tip-label">{tipLabel}</span>
        </div>

        <div
          className={[
            "mint-battle-hud__ai-reason",
            aiReasonCode ? "" : "mint-battle-hud__ai-reason--empty",
          ].filter(Boolean).join(" ")}
          title={aiReasonCode ? aiReasonLabel : undefined}
          aria-hidden={!aiReasonCode}
        >
          <span className="mint-battle-hud__ai-reason-icon">{aiReasonCode ? "🐱" : ""}</span>
          <span className="mint-battle-hud__ai-reason-label">{aiReasonLabel}</span>
        </div>
      </div>

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
