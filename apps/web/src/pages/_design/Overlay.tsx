import React from "react";
import type { BoardState, PlayerIndex } from "@nyano/triad-engine";

type TurnSummary = {
  turnIndex: number;
  by: PlayerIndex;
  cell: number;
  cardIndex: number;
  warningMarkCell?: number | null;
  // Optional fields (engine-dependent)
  flipCount?: number;
  comboCount?: number;
  comboEffect?: string;
  triadPlus?: number;
  ignoreWarningMark?: boolean;
};
import { NyanoImage } from "@/components/NyanoImage";
import { TurnLogCompact } from "@/components/TurnLogCompact";

/* ═══════════════════════════════════════════════════════════════════════════
   OBS OVERLAY - PREMIUM DESIGN
   
   Designed for streaming overlays in OBS.
   Features:
   - Transparent background support
   - Compact, readable layout
   - Vote countdown display
   - Animated state changes
   - Dark/light theme support
   ═══════════════════════════════════════════════════════════════════════════ */

export interface OverlayState {
  // Match state
  eventId?: string;
  eventTitle?: string;
  turn?: number;
  firstPlayer?: PlayerIndex;
  board?: BoardState;
  scoreA?: number;
  scoreB?: number;
  winner?: PlayerIndex | "draw" | null;
  
  // Turn history
  turns?: TurnSummary[];
  
  // Vote state
  voteStatus?: "closed" | "open";
  voteEndsAtMs?: number;
  voteTotalCount?: number;
  voteTopMoves?: Array<{ move: { cell: number; cardIndex: number }; count: number }>;
  
  // Timestamps
  updatedAtMs?: number;
}

export interface OverlayProps {
  state: OverlayState | null;
  theme?: "light" | "dark" | "transparent";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showVote?: boolean;
  showTurns?: boolean;
  className?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   OVERLAY SCORE DISPLAY
   ═══════════════════════════════════════════════════════════════════════════ */

function OverlayScore({
  scoreA,
  scoreB,
  winner,
  currentPlayer,
}: {
  scoreA: number;
  scoreB: number;
  winner?: PlayerIndex | "draw" | null;
  currentPlayer?: PlayerIndex | null;
}) {
  const isGameOver = winner !== null && winner !== undefined;
  
  return (
    <div className="flex items-center gap-3">
      {/* Player A */}
      <div
        className={[
          "flex items-center gap-2 px-3 py-2 rounded-xl",
          "transition-all duration-300",
          winner === 0
            ? "bg-emerald-500 text-white"
            : currentPlayer === 0
              ? "bg-player-a-500 text-white"
              : "bg-player-a-100 text-player-a-700",
        ].join(" ")}
      >
        <span className="font-bold font-display text-sm">A</span>
        <span className="text-2xl font-bold font-display tabular-nums">{scoreA}</span>
      </div>

      {/* VS / Winner indicator */}
      <div className="text-surface-400 text-sm font-display">
        {isGameOver ? (winner === "draw" ? "DRAW" : "WIN") : "vs"}
      </div>

      {/* Player B */}
      <div
        className={[
          "flex items-center gap-2 px-3 py-2 rounded-xl",
          "transition-all duration-300",
          winner === 1
            ? "bg-emerald-500 text-white"
            : currentPlayer === 1
              ? "bg-player-b-500 text-white"
              : "bg-player-b-100 text-player-b-700",
        ].join(" ")}
      >
        <span className="text-2xl font-bold font-display tabular-nums">{scoreB}</span>
        <span className="font-bold font-display text-sm">B</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   VOTE COUNTDOWN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

function VoteCountdown({
  status,
  endsAtMs,
  totalCount,
  topMoves,
}: {
  status: "closed" | "open";
  endsAtMs?: number;
  totalCount?: number;
  topMoves?: Array<{ move: { cell: number; cardIndex: number }; count: number }>;
}) {
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (status !== "open" || !endsAtMs) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [status, endsAtMs]);

  if (status !== "open") {
    return null;
  }

  const CELL_COORDS = ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"];

  return (
    <div className="rounded-2xl bg-nyano-500 text-white overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-4 py-2 bg-nyano-600 flex items-center justify-between">
        <span className="font-bold font-display text-sm">🗳 VOTE</span>
        <span className="font-mono text-lg font-bold">{timeLeft ?? "—"}s</span>
      </div>

      {/* Progress bar */}
      {timeLeft !== null && endsAtMs && (
        <div className="h-1 bg-nyano-400">
          <div
            className="h-full bg-white/50 transition-all duration-250"
            style={{
              width: `${Math.min(100, (timeLeft / 30) * 100)}%`,
            }}
          />
        </div>
      )}

      {/* Top votes */}
      <div className="px-4 py-3">
        <div className="text-xs text-nyano-100 mb-2">
          {totalCount ?? 0} vote{(totalCount ?? 0) !== 1 ? "s" : ""}
        </div>
        {topMoves && topMoves.length > 0 ? (
          <div className="space-y-1">
            {topMoves.slice(0, 3).map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-mono">
                  #{item.move.cardIndex + 1} → {CELL_COORDS[item.move.cell]}
                </span>
                <span className="font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-nyano-200">Waiting for votes...</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN OVERLAY COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function OverlayPremium({
  state,
  theme = "transparent",
  position = "top-left",
  showVote = true,
  showTurns = true,
  className = "",
}: OverlayProps) {
  if (!state) {
    return (
      <div className={["flex items-center justify-center p-4", className].join(" ")}>
        <div className="text-surface-400 text-sm">Waiting for game state...</div>
      </div>
    );
  }

  const currentPlayer =
    state.firstPlayer !== undefined && state.turn !== undefined
      ? (((state.firstPlayer + (state.turn % 2)) % 2) as PlayerIndex)
      : null;

  const themeStyles = {
    light: "bg-white/95 text-surface-900",
    dark: "bg-surface-900/95 text-white",
    transparent: "bg-white/90 backdrop-blur-sm text-surface-900",
  };

  const positionStyles = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <div
      className={[
        "fixed p-4 rounded-3xl shadow-xl",
        "w-80 max-w-[90vw]",
        themeStyles[theme],
        positionStyles[position],
        className,
      ].join(" ")}
    >
      {/* Header with Nyano and event info */}
      <div className="flex items-center gap-3 mb-4">
        <NyanoImage size={40} variant="avatar" />
        <div className="flex-1 min-w-0">
          <div className="font-bold font-display text-sm truncate">
            {state.eventTitle ?? "Nyano Triad"}
          </div>
          <div className="text-xs text-surface-500">
            Turn {(state.turn ?? 0) + 1} / 9
          </div>
        </div>
      </div>

      {/* Score display */}
      <div className="flex justify-center mb-4">
        <OverlayScore
          scoreA={state.scoreA ?? 0}
          scoreB={state.scoreB ?? 0}
          winner={state.winner}
          currentPlayer={currentPlayer}
        />
      </div>

      {/* Mini board */}
      {state.board && (
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-surface-100 rounded-2xl">
            <div className="grid grid-cols-3 gap-1">
              {state.board.map((cell, idx) => (
                <div
                  key={idx}
                  className={[
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    "text-[10px] font-bold font-display",
                    cell === null
                      ? "bg-surface-200 text-surface-400"
                      : cell.owner === 0
                        ? "bg-player-a-400 text-white"
                        : "bg-player-b-400 text-white",
                  ].join(" ")}
                >
                  {cell ? (cell.owner === 0 ? "A" : "B") : idx}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vote countdown */}
      {showVote && state.voteStatus === "open" && (
        <div className="mb-4">
          <VoteCountdown
            status={state.voteStatus}
            endsAtMs={state.voteEndsAtMs}
            totalCount={state.voteTotalCount}
            topMoves={state.voteTopMoves}
          />
        </div>
      )}

      {/* Recent turns */}
      {showTurns && state.turns && state.turns.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-surface-500 mb-2">Recent</div>
          <TurnLogCompact turns={state.turns} maxItems={3} />
        </div>
      )}

      {/* Winner announcement */}
      {state.winner !== null && state.winner !== undefined && (
        <div
          className={[
            "mt-4 py-3 px-4 rounded-2xl text-center",
            state.winner === "draw"
              ? "bg-amber-100 text-amber-700"
              : state.winner === 0
                ? "bg-player-a-100 text-player-a-700"
                : "bg-player-b-100 text-player-b-700",
          ].join(" ")}
        >
          <div className="text-2xl mb-1">
            {state.winner === "draw" ? "🤝" : "🎉"}
          </div>
          <div className="font-bold font-display">
            {state.winner === "draw"
              ? "Draw!"
              : `Player ${state.winner === 0 ? "A" : "B"} Wins!`}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FULL SCREEN OVERLAY (for OBS browser source)
   ═══════════════════════════════════════════════════════════════════════════ */

export interface FullOverlayProps {
  state: OverlayState | null;
  transparent?: boolean;
}

export function OverlayFullScreen({ state, transparent = true }: FullOverlayProps) {
  return (
    <div
      className={[
        "min-h-screen",
        transparent ? "bg-transparent" : "bg-surface-50",
      ].join(" ")}
      data-theme={transparent ? "transparent" : undefined}
    >
      <OverlayPremium
        state={state}
        theme={transparent ? "transparent" : "light"}
        position="top-left"
        showVote
        showTurns
      />
    </div>
  );
}

export default OverlayPremium;
