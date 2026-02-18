import React from "react";
import type { PlayerIndex } from "@nyano/triad-engine";
import { NyanoAvatar } from "./NyanoAvatar";
import type { ExpressionName } from "@/lib/expression_map";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export type GameResult = {
  winner: PlayerIndex | "draw";
  tilesA: number;
  tilesB: number;
  matchId?: string;
};

export interface GameResultOverlayProps {
  result: GameResult;
  /** Which player is "you" (for personalized message) */
  perspective?: PlayerIndex | null;
  /** Show overlay */
  show: boolean;
  /** Handler for dismissing */
  onDismiss?: () => void;
  /** Handler for rematch (same conditions) */
  onRematch?: () => void;
  /** Handler for replay */
  onReplay?: () => void;
  /** Handler for sharing */
  onShare?: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONFETTI COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

function Confetti({ color }: { color: string }) {
  const particles = React.useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.5}s`,
      size: 4 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: p.left,
            top: "-10px",
            width: p.size,
            height: p.size,
            backgroundColor: color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN RESULT OVERLAY
   ═══════════════════════════════════════════════════════════════════════════ */

export function GameResultOverlay({
  result,
  perspective = null,
  show,
  onDismiss,
  onRematch,
  onReplay,
  onShare,
}: GameResultOverlayProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (show) {
      // Small delay for entrance animation
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [show]);

  if (!show) return null;

  const isWinner =
    perspective !== null && result.winner !== "draw" && result.winner === perspective;
  const isLoser =
    perspective !== null && result.winner !== "draw" && result.winner !== perspective;
  const isDraw = result.winner === "draw";

  // Determine display state
  const state = isWinner ? "victory" : isLoser ? "defeat" : isDraw ? "draw" : "neutral";

  const stateConfig = {
    victory: {
      title: "Victory!",
      subtitle: "おめでとう！",
      bgClass: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      textClass: "text-white",
      accentColor: "#10B981",
      showConfetti: true,
      expression: "happy" as ExpressionName,
    },
    defeat: {
      title: "Defeat",
      subtitle: "また挑戦しよう！",
      bgClass: "bg-gradient-to-br from-surface-600 to-surface-800",
      textClass: "text-white",
      accentColor: "#78716C",
      showConfetti: false,
      expression: "sadTears" as ExpressionName,
    },
    draw: {
      title: "Draw!",
      subtitle: "引き分け",
      bgClass: "bg-gradient-to-br from-amber-400 to-amber-600",
      textClass: "text-white",
      accentColor: "#F59E0B",
      showConfetti: true,
      expression: "calm" as ExpressionName,
    },
    neutral: {
      title: result.winner === "draw" ? "Draw!" : `Player ${result.winner === 0 ? "A" : "B"} Wins!`,
      subtitle: "Game Over",
      bgClass:
        result.winner === 0
          ? "bg-gradient-to-br from-player-a-400 to-player-a-600"
          : result.winner === 1
            ? "bg-gradient-to-br from-player-b-400 to-player-b-600"
            : "bg-gradient-to-br from-amber-400 to-amber-600",
      textClass: "text-white",
      accentColor: result.winner === 0 ? "#0EA5E9" : result.winner === 1 ? "#F43F5E" : "#F59E0B",
      showConfetti: true,
      expression: "playful" as ExpressionName,
    },
  };

  const config = stateConfig[state];

  return (
    <div
      className={[
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/50 backdrop-blur-sm",
        "transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      onClick={onDismiss}
    >
      {/* Confetti */}
      {config.showConfetti && visible && <Confetti color={config.accentColor} />}

      {/* Main card */}
      <div
        className={[
          "relative w-[90%] max-w-sm",
          "rounded-3xl overflow-hidden",
          "shadow-2xl",
          "transition-all duration-500",
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4",
          state === "victory" && "animate-victory",
          state === "defeat" && "animate-shake",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className={["px-6 py-8 text-center", config.bgClass, config.textClass].join(" ")}>
          {/* Nyano mascot */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <NyanoAvatar
                expression={config.expression}
                size={96}
                className={[
                  "border-4 border-white/30",
                  state === "victory" && "animate-bounce-subtle",
                ].filter(Boolean).join(" ")}
              />
              {state === "victory" && (
                <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🎉</div>
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold font-display mb-1">{config.title}</h2>
          <p className="text-lg opacity-90">{config.subtitle}</p>
        </div>

        {/* Score section */}
        <div className="bg-white px-6 py-6">
          <div className="flex items-center justify-center gap-8">
            {/* Player A score */}
            <div className="text-center">
              <div
                className={[
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-2",
                  "text-3xl font-bold font-display",
                  result.winner === 0 ? "bg-player-a-500 text-white" : "bg-player-a-100 text-player-a-700",
                ].join(" ")}
              >
                {result.tilesA}
              </div>
              <div className="text-sm font-semibold text-player-a-600">Player A</div>
              {result.winner === 0 && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  Winner
                </span>
              )}
            </div>

            {/* VS divider */}
            <div className="text-2xl font-bold text-surface-300">:</div>

            {/* Player B score */}
            <div className="text-center">
              <div
                className={[
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-2",
                  "text-3xl font-bold font-display",
                  result.winner === 1 ? "bg-player-b-500 text-white" : "bg-player-b-100 text-player-b-700",
                ].join(" ")}
              >
                {result.tilesB}
              </div>
              <div className="text-sm font-semibold text-player-b-600">Player B</div>
              {result.winner === 1 && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  Winner
                </span>
              )}
            </div>
          </div>

          {/* Match ID */}
          {result.matchId && (
            <div className="mt-4 text-center">
              <div className="text-xs text-surface-400 mb-1">Match ID</div>
              <div className="text-xs font-mono text-surface-500 truncate">{result.matchId}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-surface-50 px-6 py-4 flex gap-3">
          {onRematch && (
            <button className="btn btn-secondary flex-1" onClick={onRematch}>
              🔄 Rematch
            </button>
          )}
          {onReplay && (
            <button className="btn btn-secondary flex-1" onClick={onReplay}>
              📼 Replay
            </button>
          )}
          {onShare && (
            <button className="btn btn-primary flex-1" onClick={onShare}>
              📤 Share
            </button>
          )}
          {!onRematch && !onReplay && !onShare && onDismiss && (
            <button className="btn btn-primary flex-1" onClick={onDismiss}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INLINE RESULT BANNER (for non-overlay usage)
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GameResultBannerProps {
  result: GameResult;
  compact?: boolean;
  className?: string;
}

export function GameResultBanner({ result, compact = false, className = "" }: GameResultBannerProps) {
  const winnerLabel =
    result.winner === "draw"
      ? "Draw"
      : result.winner === 0
        ? "Player A Wins"
        : "Player B Wins";

  const bgClass =
    result.winner === "draw"
      ? "bg-amber-50 border-amber-200"
      : result.winner === 0
        ? "bg-player-a-50 border-player-a-200"
        : "bg-player-b-50 border-player-b-200";

  const textClass =
    result.winner === "draw"
      ? "text-amber-700"
      : result.winner === 0
        ? "text-player-a-700"
        : "text-player-b-700";

  if (compact) {
    return (
      <div
        className={[
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border",
          bgClass,
          className,
        ].join(" ")}
      >
        <span className={["text-sm font-bold font-display", textClass].join(" ")}>
          {winnerLabel}
        </span>
        <span className="text-xs text-surface-500">
          ({result.tilesA}:{result.tilesB})
        </span>
      </div>
    );
  }

  return (
    <div className={["rounded-2xl border p-4", bgClass, className].join(" ")}>
      <div className="flex items-center justify-between">
        <div>
          <div className={["text-lg font-bold font-display", textClass].join(" ")}>{winnerLabel}</div>
          <div className="text-sm text-surface-600">
            Final Score: {result.tilesA} - {result.tilesB}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={[
              "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold",
              result.winner === 0 ? "bg-player-a-500 text-white" : "bg-player-a-100 text-player-a-600",
            ].join(" ")}
          >
            {result.tilesA}
          </div>
          <span className="text-surface-400">:</span>
          <div
            className={[
              "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold",
              result.winner === 1 ? "bg-player-b-500 text-white" : "bg-player-b-100 text-player-b-600",
            ].join(" ")}
          >
            {result.tilesB}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TURN INDICATOR COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export interface TurnIndicatorProps {
  currentPlayer: PlayerIndex;
  turnNumber: number;
  totalTurns?: number;
  className?: string;
}

export function TurnIndicator({
  currentPlayer,
  turnNumber,
  totalTurns = 9,
  className = "",
}: TurnIndicatorProps) {
  return (
    <div
      className={[
        "flex items-center gap-3 px-4 py-2 rounded-2xl",
        "bg-surface-100",
        className,
      ].join(" ")}
    >
      {/* Player indicator */}
      <div
        className={[
          "flex items-center gap-2 px-3 py-1 rounded-full",
          "text-sm font-semibold",
          currentPlayer === 0
            ? "bg-player-a-100 text-player-a-700"
            : "bg-player-b-100 text-player-b-700",
        ].join(" ")}
      >
        <span
          className={[
            "w-2 h-2 rounded-full animate-pulse",
            currentPlayer === 0 ? "bg-player-a-500" : "bg-player-b-500",
          ].join(" ")}
        />
        Player {currentPlayer === 0 ? "A" : "B"}
      </div>

      {/* Turn counter */}
      <div className="text-sm text-surface-600">
        Turn{" "}
        <span className="font-bold font-display text-surface-900">
          {turnNumber + 1}
        </span>
        <span className="text-surface-400"> / {totalTurns}</span>
      </div>

      {/* Progress bar */}
      <div className="flex-1 max-w-[100px] h-2 rounded-full bg-surface-200 overflow-hidden">
        <div
          className="h-full bg-nyano-500 transition-all duration-300"
          style={{ width: `${((turnNumber + 1) / totalTurns) * 100}%` }}
        />
      </div>
    </div>
  );
}
