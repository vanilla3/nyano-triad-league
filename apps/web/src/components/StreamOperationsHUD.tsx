/**
 * StreamOperationsHUD.tsx
 * 
 * A prominent, always-visible "Heads-Up Display" for the /stream page.
 * Shows the most critical operational info at a glance:
 * - Current turn / controlled side / to-play
 * - strictAllowed hash & allowlist count
 * - Vote status & remaining time
 * - Connection/sync status
 * 
 * This replaces the buried "Live status" / "Vote control" sub-panels 
 * as the PRIMARY information source during a stream.
 * 
 * Design: game-like HUD with glowing accent borders, 
 * monospaced counters, and real-time pulse indicators.
 */
import React from "react";
import type { OverlayStateV1 } from "@/lib/streamer_bus";
import {
  cellIndexToCoord,
  computeEmptyCells,
  computeRemainingCardIndices,
  computeWarningMarksRemaining,
  fnv1a32Hex,
  toViewerMoveText,
} from "@/lib/triad_vote_utils";

/* ─────────────────────────────────────────────────────────────
   HELPERS (shared in @/lib/triad_vote_utils)
   ───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────
   MAIN HUD COMPONENT
   ───────────────────────────────────────────────────────────── */

export interface StreamOpsHUDProps {
  /** Live overlay state from /match or /replay */
  live: OverlayStateV1 | null;
  /** Which side the stream controls */
  controlledSide: 0 | 1;
  /** Is a vote currently open */
  voteOpen: boolean;
  /** When the current vote ends (ms timestamp) */
  voteEndsAtMs: number | null;
  /** Total votes cast in current round */
  totalVotes: number;
  /** Current vote round's turn number */
  voteTurn: number | null;
}

export function StreamOperationsHUD({
  live,
  controlledSide,
  voteOpen,
  voteEndsAtMs,
  totalVotes,
  voteTurn,
}: StreamOpsHUDProps) {
  // ── Computed state ──
  const turn = typeof live?.turn === "number" ? live.turn : null;
  const firstPlayer =
    typeof live?.firstPlayer === "number" ? (live.firstPlayer as 0 | 1) : null;
  const toPlay =
    firstPlayer !== null && turn !== null
      ? (((firstPlayer + (turn % 2)) % 2) as 0 | 1)
      : null;
  const isControlledTurn = toPlay === controlledSide;
  const mode = live?.mode ?? null;

  // ── Allowlist computation ──
  const emptyCells = computeEmptyCells(live);
  // strictAllowed should reflect the *actual* side-to-play (not always controlledSide).
  const allowlistSide: 0 | 1 = toPlay !== null ? toPlay : controlledSide;
  const remainCards = computeRemainingCardIndices(live, allowlistSide);
  const wmRemaining = computeWarningMarksRemaining(live, allowlistSide);

  const legalMoves = React.useMemo(() => {
    const moves: string[] = [];
    for (const cell of emptyCells) {
      for (const ci of remainCards) {
        moves.push(toViewerMoveText({ cell, cardIndex: ci }));
      }
    }
    return moves.sort();
  }, [emptyCells, remainCards]);

  const allowlistHash = React.useMemo(
    () => fnv1a32Hex(legalMoves.join("\n")),
    [legalMoves]
  );

  // ── Vote timer ──
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!voteOpen || !voteEndsAtMs) {
      setTimeLeft(null);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((voteEndsAtMs - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const t = window.setInterval(tick, 250);
    return () => window.clearInterval(t);
  }, [voteOpen, voteEndsAtMs]);

  // ── Sync status ──
  const age =
    live?.updatedAtMs ? Math.floor((Date.now() - live.updatedAtMs) / 1000) : null;
  const isFresh = age !== null && age < 5;

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Background gradient with animated border */}
      <div
        className={[
          "absolute inset-0 rounded-2xl",
          voteOpen
            ? "bg-gradient-to-r from-nyano-500/10 via-violet-500/10 to-nyano-500/10"
            : "bg-gradient-to-r from-surface-100 via-surface-50 to-surface-100",
        ].join(" ")}
      />
      <div
        className={[
          "relative border-2 rounded-2xl",
          voteOpen
            ? "border-nyano-400 shadow-glow-nyano"
            : isControlledTurn
              ? "border-nyano-300"
              : "border-surface-200",
        ].join(" ")}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-surface-100 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-display font-bold text-surface-800">
              ⚡ Live Operations
            </span>
            {voteOpen && (
              <span className="badge badge-solid badge-nyano badge-sm animate-pulse">
                VOTE OPEN
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            {/* Sync indicator */}
            <div className="flex items-center gap-1.5">
              <div
                className={[
                  "w-2 h-2 rounded-full",
                  isFresh
                    ? "bg-emerald-500 animate-pulse"
                    : age !== null
                      ? "bg-amber-500"
                      : "bg-surface-300",
                ].join(" ")}
              />
              <span className="text-surface-500 font-mono">
                {age !== null ? (age < 2 ? "live" : `${age}s`) : "—"}
              </span>
            </div>
            <span className="text-surface-300">·</span>
            <span className="font-mono text-surface-500">
              {mode ?? "—"}
            </span>
          </div>
        </div>

        {/* Main HUD grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-100">
          {/* Turn & Player */}
          <HUDCell
            label="Turn"
            primary={turn !== null ? `${turn}/9` : "—"}
            secondary={
              toPlay !== null
                ? `${toPlay === 0 ? "A" : "B"} to play`
                : "waiting"
            }
            accentColor={
              toPlay === 0
                ? "player-a"
                : toPlay === 1
                  ? "player-b"
                  : "surface"
            }
          />

          {/* Controlled Side & Status */}
          <HUDCell
            label="Control"
            primary={controlledSide === 0 ? "Side A" : "Side B"}
            secondary={
              isControlledTurn
                ? "✅ Your turn"
                : toPlay !== null
                  ? "⏳ Opponent"
                  : "—"
            }
            accentColor={isControlledTurn ? "nyano" : "surface"}
          />

          {/* Allowlist */}
          <HUDCell
            label="strictAllowed"
            primary={`${legalMoves.length} moves`}
            secondary={
              <span className="font-mono text-[10px]" title={allowlistHash}>
                hash {allowlistHash}
              </span>
            }
            accentColor={legalMoves.length > 0 ? "emerald" : "surface"}
          />

          {/* Vote Status */}
          <HUDCell
            label={voteOpen ? "Vote Timer" : "Vote Status"}
            primary={
              voteOpen
                ? timeLeft !== null
                  ? `${timeLeft}s`
                  : "…"
                : "CLOSED"
            }
            secondary={
              voteOpen ? (
                <span>
                  {totalVotes} vote{totalVotes !== 1 ? "s" : ""} · turn{" "}
                  {voteTurn ?? "?"}
                </span>
              ) : (
                "Start vote to begin"
              )
            }
            accentColor={voteOpen ? "nyano" : "surface"}
            large={voteOpen}
          />
        </div>

        {/* Vote progress bar (only when vote is open) */}
        {voteOpen && voteEndsAtMs && (
          <VoteProgressBar endsAtMs={voteEndsAtMs} />
        )}

        {/* Secondary info row */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-white/60 border-t border-surface-100 text-xs text-surface-500">
          <span>
            Empty cells:{" "}
            <span className="font-mono font-medium text-surface-700">
              {emptyCells.map(cellIndexToCoord).join(", ") || "—"}
            </span>
          </span>
          <span className="text-surface-200">|</span>
          <span>
            Hand slots:{" "}
            <span className="font-mono font-medium text-surface-700">
              {remainCards.map((i) => `A${i + 1}`).join(", ") || "—"}
            </span>
          </span>
          <span className="text-surface-200">|</span>
          <span>
            WM remaining:{" "}
            <span className="font-mono font-medium text-surface-700">
              {wmRemaining}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
   ───────────────────────────────────────────────────────────── */

function HUDCell({
  label,
  primary,
  secondary,
  accentColor = "surface",
  large = false,
}: {
  label: string;
  primary: React.ReactNode;
  secondary: React.ReactNode;
  accentColor?: string;
  large?: boolean;
}) {
  const colorMap: Record<string, string> = {
    "player-a": "text-player-a-600",
    "player-b": "text-player-b-600",
    nyano: "text-nyano-600",
    emerald: "text-emerald-600",
    surface: "text-surface-700",
  };
  const primaryColor = colorMap[accentColor] ?? "text-surface-700";

  return (
    <div className="bg-white px-4 py-3 flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
        {label}
      </span>
      <span
        className={[
          "font-display font-bold font-mono tabular-nums",
          large ? "text-2xl" : "text-lg",
          primaryColor,
        ].join(" ")}
      >
        {primary}
      </span>
      <span className="text-[11px] text-surface-500">{secondary}</span>
    </div>
  );
}

function VoteProgressBar({ endsAtMs }: { endsAtMs: number }) {
  const startedRef = React.useRef(Date.now());
  const [pct, setPct] = React.useState(100);

  // Reset progress baseline whenever a new vote window starts.
  React.useEffect(() => {
    startedRef.current = Date.now();
    setPct(100);
  }, [endsAtMs]);

  React.useEffect(() => {
    const tick = () => {
      const totalDuration = Math.max(1, endsAtMs - startedRef.current);
      const elapsed = Date.now() - startedRef.current;
      const remaining = Math.max(0, 1 - elapsed / totalDuration);
      setPct(remaining * 100);
    };
    tick();
    const t = window.setInterval(tick, 50);
    return () => window.clearInterval(t);
  }, [endsAtMs]);

  return (
    <div className="h-1.5 bg-surface-100 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-nyano-500 to-nyano-400 transition-[width] duration-100 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
