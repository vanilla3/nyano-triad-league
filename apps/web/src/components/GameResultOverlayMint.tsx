import React from "react";
import { NyanoAvatar } from "./NyanoAvatar";
import type { ExpressionName } from "@/lib/expression_map";
import type { GameResultOverlayProps } from "./GameResultOverlay";
import { type MoveAnnotation, QUALITY_DISPLAY } from "@/lib/ai/replay_annotations";

interface GameResultOverlayMintProps extends GameResultOverlayProps {
  annotations?: MoveAnnotation[];
}

type OverlayState = "victory" | "defeat" | "draw" | "neutral";

const OVERLAY_COPY: Record<Exclude<OverlayState, "neutral">, {
  titleJa: string;
  titleEn: string;
  subtitleJa: string;
  expression: ExpressionName;
  titleClass: string;
}> = {
  victory: {
    titleJa: "勝利！",
    titleEn: "Victory!",
    subtitleJa: "おめでとう！",
    expression: "happy",
    titleClass: "mint-result__title--victory",
  },
  defeat: {
    titleJa: "敗北",
    titleEn: "Defeat",
    subtitleJa: "次は勝てるよ。",
    expression: "sadTears",
    titleClass: "mint-result__title--defeat",
  },
  draw: {
    titleJa: "引き分け",
    titleEn: "Draw!",
    subtitleJa: "いい勝負だったね。",
    expression: "calm",
    titleClass: "mint-result__title--draw",
  },
};

export function GameResultOverlayMint({
  result,
  perspective = null,
  show,
  onDismiss,
  onRematch,
  onReplay,
  onShare,
  annotations,
}: GameResultOverlayMintProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  const isWinner =
    perspective !== null && result.winner !== "draw" && result.winner === perspective;
  const isLoser =
    perspective !== null && result.winner !== "draw" && result.winner !== perspective;
  const isDraw = result.winner === "draw";

  const state: OverlayState = isWinner ? "victory" : isLoser ? "defeat" : isDraw ? "draw" : "neutral";
  const neutralWinnerLabel = result.winner === 0 ? "A" : "B";
  const copy = state === "neutral"
    ? {
      titleJa: result.winner === "draw" ? "引き分け" : `プレイヤー${neutralWinnerLabel}の勝ち！`,
      titleEn: result.winner === "draw" ? "Draw!" : `Player ${neutralWinnerLabel} Wins!`,
      subtitleJa: "Game Over",
      expression: "playful" as const,
      titleClass: result.winner === 0
        ? "mint-result__title--victory"
        : result.winner === 1
          ? "mint-result__title--defeat"
          : "mint-result__title--draw",
    }
    : OVERLAY_COPY[state];

  return (
    <div
      className={[
        "mint-result-overlay",
        "transition-opacity duration-300 ease-out",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      onClick={onDismiss}
    >
      <div
        className={[
          "mint-result-panel",
          "transition-transform duration-500 ease-out",
          visible ? "scale-100" : "scale-95",
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex justify-center">
          <NyanoAvatar expression={copy.expression} size={88} />
        </div>

        <div className={["mint-result__title", copy.titleClass].join(" ")}>
          {copy.titleJa}
        </div>
        <div className="mint-result__subtitle">
          {copy.titleEn} - {copy.subtitleJa}
        </div>

        <div className="mint-result__scores">
          <div>
            <div className="mint-result__score-val mint-result__score-val--a">
              {result.tilesA}
            </div>
            <div style={{ fontSize: 12, color: "var(--mint-pa)", fontWeight: 700, marginTop: 4 }}>
              Player A
            </div>
          </div>

          <div className="mint-result__divider">:</div>

          <div>
            <div className="mint-result__score-val mint-result__score-val--b">
              {result.tilesB}
            </div>
            <div style={{ fontSize: 12, color: "var(--mint-pb)", fontWeight: 700, marginTop: 4 }}>
              Player B
            </div>
          </div>
        </div>

        {annotations && annotations.length > 0 && (() => {
          const best = annotations.reduce((a, b) => b.delta > a.delta ? b : a);
          const worst = annotations.reduce((a, b) => b.delta < a.delta ? b : a);
          return (
            <div className="mint-result__summary">
              <div className="mint-result__summary-line">
                <span className="mint-result__summary-icon">⭐</span>
                <span className="mint-result__summary-text">
                  Best: Turn {best.turnIndex + 1}
                </span>
                <span className={`mint-result__quality mint-result__quality--${best.quality.toLowerCase()}`}>
                  {QUALITY_DISPLAY[best.quality].ja}
                </span>
              </div>
              {worst.quality !== best.quality && (
                <div className="mint-result__summary-line">
                  <span className="mint-result__summary-icon">⚠️</span>
                  <span className="mint-result__summary-text">
                    Risk: Turn {worst.turnIndex + 1}
                  </span>
                  <span className={`mint-result__quality mint-result__quality--${worst.quality.toLowerCase()}`}>
                    {QUALITY_DISPLAY[worst.quality].ja}
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        <div className="mint-result__actions">
          {onRematch && (
            <button className="mint-result__btn" onClick={onRematch}>
              🔁 もう一戦
            </button>
          )}
          {onReplay && (
            <button className="mint-result__btn" onClick={onReplay}>
              ▶️ リプレイ
            </button>
          )}
          {onShare && (
            <button className="mint-result__btn mint-result__btn--primary" onClick={onShare}>
              📤 シェア
            </button>
          )}
          {!onRematch && !onReplay && !onShare && onDismiss && (
            <button className="mint-result__btn mint-result__btn--primary" onClick={onDismiss}>
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
