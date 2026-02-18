/**
 * StreamOperationsHUD.tsx
 *
 * A prominent, always-visible "Heads-Up Display" for the /stream page.
 * Shows the most critical operational info at a glance:
 * - Current turn / controlled side / to-play
 * - strictAllowed hash & allowlist count
 * - Vote status & remaining time
 * - Connection/sync status
 * - Connection health dots (overlay / match / warudo / bus)
 * - Ops log (collapsible, last N entries)
 *
 * This replaces the buried "Live status" / "Vote control" sub-panels
 * as the PRIMARY information source during a stream.
 *
 * Design: game-like HUD with glowing accent borders,
 * monospaced counters, and real-time pulse indicators.
 */
import React from "react";
import type { OverlayStateV1, BoardCellLite } from "@/lib/streamer_bus";
import {
  cellIndexToCoord,
  computeEmptyCells,
  computeRemainingCardIndices,
  computeStrictAllowed,
  computeToPlay,
} from "@/lib/triad_vote_utils";
import { BoardMiniPreview } from "@/components/stream/BoardMiniPreview";
import { writeClipboardText } from "@/lib/clipboard";

/* ─────────────────────────────────────────────────────────────
   EXPORTED PURE FUNCTIONS (testable)
   ───────────────────────────────────────────────────────────── */

/**
 * Compute sync status from an overlay's updatedAtMs timestamp.
 * Returns age in seconds and boolean flags for UI tier coloring.
 */
// eslint-disable-next-line react-refresh/only-export-components -- pure fn export alongside component is intentional
export function computeSyncStatus(updatedAtMs: number | undefined): {
  age: number | null;
  isFresh: boolean;
  isDelayed: boolean;
  isStale: boolean;
} {
  if (updatedAtMs === undefined || updatedAtMs === null) {
    return { age: null, isFresh: false, isDelayed: false, isStale: false };
  }
  const age = Math.floor((Date.now() - updatedAtMs) / 1000);
  return {
    age,
    isFresh: age < 5,
    isDelayed: age >= 5 && age < 10,
    isStale: age >= 10,
  };
}

/** Connection health summary for all integration points. */
export type ConnectionHealth = {
  overlayConnected: boolean;
  matchConnected: boolean;
  warudoConfigured: boolean;
  warudoLastOk: boolean | null;
};

/**
 * Derive connection health from current state.
 * - overlayConnected: overlay state received and fresh (<10s)
 * - matchConnected: overlay state has a valid mode (match/replay)
 * - warudoConfigured: warudo base URL is non-empty
 * - warudoLastOk: last warudo result was OK, or null if no result
 */
// eslint-disable-next-line react-refresh/only-export-components -- pure fn export alongside component is intentional
export function computeConnectionHealth(
  live: OverlayStateV1 | null,
  warudoBaseUrl: string,
  lastExternalResult: ExternalResult | null,
): ConnectionHealth {
  const sync = computeSyncStatus(live?.updatedAtMs);
  return {
    overlayConnected: live !== null && !sync.isStale,
    matchConnected: live !== null && (live.mode === "live" || live.mode === "replay"),
    warudoConfigured: warudoBaseUrl.trim().length > 0,
    warudoLastOk:
      lastExternalResult && lastExternalResult.kind === "warudo"
        ? lastExternalResult.ok
        : null,
  };
}

/* ─────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────── */

export type ExternalResult = {
  kind: "warudo" | "rpc" | "bus";
  ok: boolean;
  message: string;
  timestampMs: number;
};

/** A single entry in the operations log. */
export type OpsLogEntry = {
  timestampMs: number;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
};

/** Persistent error info displayed until explicitly dismissed (P0-ERR). */
export type PersistentError = {
  message: string;
  timestampMs: number;
};

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
  /** Last external integration result (warudo/rpc) */
  lastExternalResult?: ExternalResult | null;
  /** Connection health summary */
  connectionHealth?: ConnectionHealth;
  /** Recent operations log entries */
  opsLog?: OpsLogEntry[];
  /** Whether settings are locked */
  settingsLocked?: boolean;
  /** Persistent error that stays until dismissed (P0-ERR) */
  lastError?: PersistentError | null;
  /** Callback to dismiss the persistent error */
  onDismissError?: () => void;
}

export function StreamOperationsHUD({
  live,
  controlledSide,
  voteOpen,
  voteEndsAtMs,
  totalVotes,
  voteTurn,
  lastExternalResult,
  connectionHealth,
  opsLog,
  settingsLocked,
  lastError,
  onDismissError,
}: StreamOpsHUDProps) {
  // ── Computed state ──
  const turn = typeof live?.turn === "number" ? live.turn : null;
  const toPlay = computeToPlay(live);
  const isControlledTurn = toPlay === controlledSide;
  const mode = live?.mode ?? null;

  // ── Allowlist computation ──
  const strictAllowed = React.useMemo(() => computeStrictAllowed(live), [live]);

  const emptyCells = computeEmptyCells(live);
  const remainCards = toPlay !== null ? computeRemainingCardIndices(live, toPlay) : [];

  // ── Mini board data ──
  const miniBoard: (BoardCellLite | null)[] = React.useMemo(() => {
    if (!live?.board || !Array.isArray(live.board)) return Array(9).fill(null);
    return live.board.map((cell) => {
      if (cell == null) return null;
      const owner = typeof cell.owner === "number" ? cell.owner : null;
      if (owner !== 0 && owner !== 1) return null;
      return { owner } as BoardCellLite;
    });
  }, [live?.board]);
  const lastCell = live?.lastMove?.cell ?? null;

  const allowlistHash = strictAllowed?.hash ?? "—";
  const strictCount = strictAllowed?.count ?? 0;
  const wmRemaining = strictAllowed?.warningMark.remaining ?? 0;

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

  // ── Sync status (3-tier: fresh / delayed / stale) ──
  const { age, isFresh, isDelayed, isStale } = computeSyncStatus(live?.updatedAtMs);

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
              ⚡ ライブ運用
            </span>
            {settingsLocked && (
              <span className="badge badge-sm bg-red-100 text-red-700 border-red-200">
                🔒 LOCKED
              </span>
            )}
            {voteOpen && (
              <span className="badge badge-solid badge-nyano badge-sm animate-pulse">
                投票受付中
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
                    : isDelayed
                      ? "bg-amber-500"
                      : isStale
                        ? "bg-red-500 animate-pulse"
                        : "bg-surface-300",
                ].join(" ")}
              />
              <span className={[
                "font-mono",
                isStale ? "text-red-600 font-semibold" : "text-surface-500",
              ].join(" ")}>
                {age !== null ? (age < 2 ? "live" : `${age}s`) : "—"}
              </span>
            </div>
            <span className="text-surface-300">·</span>
            <span className="font-mono text-surface-500">
              {mode ?? "—"}
            </span>
          </div>
        </div>

        {/* Persistent error banner (P0-ERR) */}
        {lastError && (
          <LastErrorBanner error={lastError} onDismiss={onDismissError} />
        )}

        {/* Main HUD grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-100">
          {/* Turn & Player */}
          <HUDCell
            label="ターン"
            primary={turn !== null ? `${turn}/9` : "—"}
            secondary={
              toPlay !== null
                ? `${toPlay === 0 ? "A" : "B"} の手番`
                : "待機中"
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
            label="操作側"
            primary={controlledSide === 0 ? "A側" : "B側"}
            secondary={
              isControlledTurn
                ? "✅ あなたの手番"
                : toPlay !== null
                  ? "⏳ 相手の手番"
                  : "—"
            }
            accentColor={isControlledTurn ? "nyano" : "surface"}
          />

          {/* Allowlist */}
          <HUDCell
            label="strictAllowed"
            primary={`${strictCount} 手`}
            secondary={
              <span className="font-mono text-[10px]" title={allowlistHash}>
                hash {allowlistHash}
              </span>
            }
            accentColor={strictCount > 0 ? "emerald" : "surface"}
          />

          {/* Vote Status */}
          <HUDCell
            label={voteOpen ? "投票タイマー" : "投票状態"}
            primary={
              voteOpen
                ? timeLeft !== null
                  ? `${timeLeft}s`
                  : "…"
                : "受付終了"
            }
            secondary={
              voteOpen ? (
                <span>
                  {totalVotes} 票 · ターン{" "}
                  {voteTurn ?? "?"}
                </span>
              ) : (
                "投票開始で受付"
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
            空きセル:{" "}
            <span className="font-mono font-medium text-surface-700">
              {emptyCells.map(cellIndexToCoord).join(", ") || "—"}
            </span>
          </span>
          <span className="text-surface-200">|</span>
          <span>
            手札スロット:{" "}
            <span className="font-mono font-medium text-surface-700">
              {remainCards.map((i) => `A${i + 1}`).join(", ") || "—"}
            </span>
          </span>
          <span className="text-surface-200">|</span>
          <span>
            WM残り:{" "}
            <span className="font-mono font-medium text-surface-700">
              {wmRemaining}
            </span>
          </span>
        </div>

        {/* External integration status (warudo/rpc) */}
        {lastExternalResult && (
          <ExternalStatusRow result={lastExternalResult} />
        )}

        {/* Connection health dots */}
        {connectionHealth && (
          <ConnectionHealthRow health={connectionHealth} />
        )}

        {/* Board mini preview + log export */}
        <div className="flex items-center justify-between gap-3 border-t border-surface-100 px-4 py-1.5 bg-white/60">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">盤面</span>
            <BoardMiniPreview board={miniBoard} lastCell={lastCell} />
          </div>
          {opsLog && opsLog.length > 0 && (
            <button
              className="text-[10px] font-semibold text-surface-500 hover:text-surface-700 transition-colors"
              onClick={() => {
                const lines = opsLog.map((e) => {
                  const t = new Date(e.timestampMs);
                  const ts = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`;
                  return `[${ts}] [${e.source}] ${e.message}`;
                });
                void writeClipboardText(lines.join("\n"));
              }}
              title="運用ログをクリップボードへコピー"
            >
              ログ出力
            </button>
          )}
        </div>

        {/* Ops log (collapsible) */}
        {opsLog && opsLog.length > 0 && (
          <OpsLogRow entries={opsLog} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
   ───────────────────────────────────────────────────────────── */

function LastErrorBanner({ error, onDismiss }: { error: PersistentError; onDismiss?: () => void }) {
  const ageSec = Math.max(0, Math.floor((Date.now() - error.timestampMs) / 1000));
  const ageText = ageSec < 2 ? "たった今" : ageSec < 60 ? `${ageSec}秒前` : `${Math.floor(ageSec / 60)}分前`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-200 text-xs text-red-800">
      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
      <span className="font-semibold">直近エラー</span>
      <span className="truncate flex-1">{error.message}</span>
      <span className="text-red-500 shrink-0">{ageText}</span>
      {onDismiss && (
        <button
          type="button"
          className="ml-1 px-1.5 py-0.5 rounded text-red-600 hover:bg-red-100 font-bold"
          onClick={onDismiss}
          title="エラーを閉じる"
        >
          ✕
        </button>
      )}
    </div>
  );
}

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

function ExternalStatusRow({ result }: { result: ExternalResult }) {
  const ageSec = Math.max(0, Math.floor((Date.now() - result.timestampMs) / 1000));
  const ageText = ageSec < 2 ? "たった今" : ageSec < 60 ? `${ageSec}秒前` : `${Math.floor(ageSec / 60)}分前`;

  return (
    <div className={[
      "flex items-center gap-2 px-4 py-1.5 border-t text-xs",
      result.ok
        ? "border-emerald-100 bg-emerald-50/50 text-emerald-700"
        : "border-red-100 bg-red-50/50 text-red-700",
    ].join(" ")}>
      <div className={[
        "w-2 h-2 rounded-full shrink-0",
        result.ok ? "bg-emerald-500" : "bg-red-500 animate-pulse",
      ].join(" ")} />
      <span className="font-mono font-medium">{result.kind}</span>
      <span className="truncate">{result.ok ? "OK" : result.message}</span>
      <span className="ml-auto shrink-0 text-surface-400">{ageText}</span>
    </div>
  );
}

function ConnectionHealthRow({ health }: { health: ConnectionHealth }) {
  const dots: Array<{ label: string; ok: boolean | null }> = [
    { label: "overlay", ok: health.overlayConnected },
    { label: "match", ok: health.matchConnected },
    { label: "warudo", ok: health.warudoConfigured ? health.warudoLastOk : false },
    { label: "bus", ok: health.overlayConnected }, // bus mirrors overlay connectivity
  ];

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 border-t border-surface-100 bg-white/60">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">
        連携状態
      </span>
      {dots.map((d) => (
        <div key={d.label} className="flex items-center gap-1">
          <div
            className={[
              "w-2 h-2 rounded-full",
              d.ok === true
                ? "bg-emerald-500"
                : d.ok === false
                  ? "bg-red-500"
                  : "bg-amber-400",
            ].join(" ")}
          />
          <span className="text-[10px] text-surface-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function OpsLogRow({ entries }: { entries: OpsLogEntry[] }) {
  const recent = entries.slice(-5);
  const levelColor: Record<string, string> = {
    info: "text-surface-600",
    warn: "text-amber-700",
    error: "text-red-700",
  };

  return (
    <details className="border-t border-surface-100">
      <summary className="flex items-center gap-2 px-4 py-1.5 bg-white/60 cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-surface-400 select-none">
        操作ログ ({entries.length})
      </summary>
      <div className="px-4 py-1.5 bg-surface-50/50 space-y-0.5 max-h-32 overflow-y-auto">
        {recent.map((entry, i) => {
          const t = new Date(entry.timestampMs);
          const ts = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`;
          return (
            <div
              key={`${entry.timestampMs}-${i}`}
              className={[
                "font-mono text-[10px] leading-tight",
                levelColor[entry.level] ?? "text-surface-600",
              ].join(" ")}
            >
              [{ts}] [{entry.source}] {entry.message}
            </div>
          );
        })}
      </div>
    </details>
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
