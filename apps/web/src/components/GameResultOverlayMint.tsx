import React from "react";
import { NyanoAvatar } from "./NyanoAvatar";
import type { ExpressionName } from "@/lib/expression_map";
import type { GameResultOverlayProps } from "./GameResultOverlay";
import { type MoveAnnotation, QUALITY_DISPLAY } from "@/lib/ai/replay_annotations";

/* ═══════════════════════════════════════════════════════════════════════════
   GAME RESULT OVERLAY MINT — Soft, Nintendo-feel result screen

   Uses same props as GameResultOverlay for seamless swapping.
   Visual: white frosted glass, soft shadows, NyanoAvatar reaction.
   Celebration: confetti + rays + score count-up on victory
   (one-shot, honors prefers-reduced-motion and [data-vfx]).
   ═══════════════════════════════════════════════════════════════════════════ */

interface GameResultOverlayMintProps extends GameResultOverlayProps {
  /** P1-150: AI move quality annotations for post-game summary */
  annotations?: MoveAnnotation[];
  /** Open a share-to-X (Twitter) intent for this result */
  onShareX?: () => void;
}

const CONFETTI_PIECE_COUNT = 16;

/** True when celebratory motion should be skipped (reduced-motion / low VFX). */
function prefersStaticResult(): boolean {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  } catch {
    /* matchMedia unavailable (tests) */
  }
  const vfx = document.documentElement.dataset.vfx;
  return vfx === "off" || vfx === "low";
}

/** Animate a number from 0 to target once `active` turns true (rAF count-up). */
function useScoreCountUp(target: number, active: boolean, durationMs: number, delayMs: number): number {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    if (prefersStaticResult()) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now + delayMs;
      const elapsed = now - start;
      if (elapsed < 0) {
        raf = window.requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [target, active, durationMs, delayMs]);

  return value;
}

export function GameResultOverlayMint({
  result,
  perspective = null,
  show,
  onDismiss,
  onRematch,
  onReplay,
  onShare,
  onShareX,
  annotations,
}: GameResultOverlayMintProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }
    // Trigger transitions on the next animation frame for stable first paint.
    const raf = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(raf);
  }, [show]);

  const isWinner =
    perspective !== null && result.winner !== "draw" && result.winner === perspective;
  const isLoser =
    perspective !== null && result.winner !== "draw" && result.winner !== perspective;
  const isDraw = result.winner === "draw";

  const state = isWinner ? "victory" : isLoser ? "defeat" : isDraw ? "draw" : "neutral";

  // Celebrate when the viewer won, or in neutral PvP view when anyone won.
  const celebrate = state === "victory" || (state === "neutral" && result.winner !== "draw");

  const scoreA = useScoreCountUp(result.tilesA, show, 620, 220);
  const scoreB = useScoreCountUp(result.tilesB, show, 620, 300);

  if (!show) return null;

  const config: Record<string, {
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
      titleJa: "惜敗…",
      titleEn: "Defeat",
      subtitleJa: "また挑戦しよう！",
      expression: "sadTears",
      titleClass: "mint-result__title--defeat",
    },
    draw: {
      titleJa: "引き分け",
      titleEn: "Draw!",
      subtitleJa: "いい勝負！",
      expression: "calm",
      titleClass: "mint-result__title--draw",
    },
    neutral: {
      titleJa: result.winner === "draw"
        ? "引き分け"
        : `プレイヤー${result.winner === 0 ? "A" : "B"}の勝ち！`,
      titleEn: result.winner === "draw"
        ? "Draw!"
        : `Player ${result.winner === 0 ? "A" : "B"} Wins!`,
      subtitleJa: "Game Over",
      expression: "playful",
      titleClass: result.winner === 0
        ? "mint-result__title--victory"
        : result.winner === 1
          ? "mint-result__title--defeat"
          : "mint-result__title--draw",
    },
  };

  const c = config[state];

  return (
    <div
      className={[
        "mint-result-overlay",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      style={{ transition: "opacity var(--transition-slow)" }}
      onClick={onDismiss}
    >
      {/* Celebration confetti (pointer-events: none, behind the panel) */}
      {celebrate ? (
        <div className="mint-result__confetti" aria-hidden="true">
          {Array.from({ length: CONFETTI_PIECE_COUNT }, (_, i) => (
            <span key={i} className="mint-result__confetti-piece" />
          ))}
        </div>
      ) : null}

      <div
        className={[
          "mint-result-panel",
          onShare ? "mint-result-panel--shareworthy" : "",
          visible ? "scale-100" : "scale-95",
        ].join(" ")}
        style={{ transition: "transform var(--transition-bounce)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nyano mascot + victory rays */}
        <div className="mint-result__hero">
          {celebrate ? <div className="mint-result__rays" aria-hidden="true" /> : null}
          <NyanoAvatar expression={c.expression} size={88} />
        </div>

        {/* Title */}
        <div className={["mint-result__title", c.titleClass].join(" ")}>
          {c.titleJa}
        </div>
        <div className="mint-result__subtitle">
          {c.titleEn} — {c.subtitleJa}
        </div>

        {/* Scores */}
        <div className="mint-result__scores">
          <div>
            <div className="mint-result__score-val mint-result__score-val--a">
              {scoreA}
            </div>
            <div style={{ fontSize: 12, color: "var(--mint-pa)", fontWeight: 700, marginTop: 4 }}>
              Player A
            </div>
          </div>

          <div className="mint-result__divider">:</div>

          <div>
            <div className="mint-result__score-val mint-result__score-val--b">
              {scoreB}
            </div>
            <div style={{ fontSize: 12, color: "var(--mint-pb)", fontWeight: 700, marginTop: 4 }}>
              Player B
            </div>
          </div>
        </div>

        {/* Post-game summary (P1-150) */}
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

        {onShare ? (
          <div className="mint-result__share-cue" role="note">
            Capture this panel now for the best share.
          </div>
        ) : null}

        {/* Actions */}
        <div className="mint-result__actions">
          {onRematch && (
            <button className="mint-result__btn" onClick={onRematch}>
              🔄 もう一回
            </button>
          )}
          {onReplay && (
            <button className="mint-result__btn" onClick={onReplay}>
              📼 リプレイ
            </button>
          )}
          {onShare && (
            <button className="mint-result__btn mint-result__btn--primary" onClick={onShare}>
              📤 シェア
            </button>
          )}
          {onShareX && (
            <button
              className="mint-result__btn mint-result__btn--x"
              onClick={onShareX}
              title="リプレイURLをX（Twitter）でポスト"
            >
              𝕏 ポスト
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
