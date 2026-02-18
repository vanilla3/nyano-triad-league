import React from "react";
import { Link, useSearchParams } from "react-router-dom";

import { CardNyanoDuel } from "@/components/CardNyanoDuel";
import "../mint-theme/mint-theme.css";
import { NyanoReactionBadge, pickReactionKind, type NyanoReactionInput } from "@/components/NyanoReaction";
import { NyanoAvatar } from "@/components/NyanoAvatar";
import { reactionToExpression } from "@/lib/expression_map";
import { AiReasonBadge } from "@/components/AiReasonDisplay";
import { AdvantageBadge } from "@/components/AdvantageBadge";
import { AdvantageBar } from "@/components/AdvantageBar";
import { MoveQualityTip } from "@/components/MoveQualityTip";
import { generateMoveTipWithNarrative } from "@/lib/ai/move_tips";
import type { AiReasonCode } from "@/lib/ai/nyano_ai";
import { assessBoardAdvantageDetailed, type AdvantageLevel, type AdvantageReason } from "@/lib/ai/board_advantage";
import { ScoreBar } from "@/components/ScoreBar";
import { FlipTraceBadges, FlipTraceDetailList } from "@/components/FlipTraceBadges";
import { flipTracesReadout, flipTracesSummary } from "@/components/flipTraceDescribe";
import {
  cellIndexToCoord,
  computeStrictAllowed,
  computeToPlay,
  toViewerMoveText,
  type PlayerSide,
} from "@/lib/triad_vote_utils";
import {
  readStoredOverlayState,
  readStoredStreamVoteState,
  subscribeOverlayState,
  subscribeStreamVoteState,
  type BoardCellLite,
  type OverlayStateV1,
  type StreamVoteStateV1,
} from "@/lib/streamer_bus";
import { readStringSetting, writeStringSetting } from "@/lib/local_settings";
import { appAbsoluteUrl, appPath } from "@/lib/appUrl";
import { resolveClassicMetadataFromOverlayState } from "@/lib/classic_ruleset_visibility";
import type { CardData, FlipTraceV1, PlayerIndex } from "@nyano/triad-engine";

// ── Overlay Theme System ──────────────────────────────────────────────

export type OverlayTheme = "720p-minimal" | "720p-standard" | "1080p-standard" | "1080p-full";

const OVERLAY_THEMES: OverlayTheme[] = ["720p-minimal", "720p-standard", "1080p-standard", "1080p-full"];

const THEME_LABELS: Record<OverlayTheme, string> = {
  "720p-minimal": "720p Minimal",
  "720p-standard": "720p Standard",
  "1080p-standard": "1080p Standard",
  "1080p-full": "1080p Full",
};

type ThemeDensity = "minimal" | "standard" | "full";

function themeDensity(theme: OverlayTheme): ThemeDensity {
  if (theme === "720p-minimal") return "minimal";
  if (theme === "1080p-full") return "full";
  return "standard";
}

function themeAvatarSize(theme: OverlayTheme): number {
  switch (theme) {
    case "720p-minimal": return 22;
    case "720p-standard": return 26;
    case "1080p-standard": return 32;
    case "1080p-full": return 38;
  }
}

function themeBoardGap(theme: OverlayTheme): string {
  switch (theme) {
    case "720p-minimal": return "gap-1.5";
    case "720p-standard": return "gap-2";
    case "1080p-standard": return "gap-3";
    case "1080p-full": return "gap-3";
  }
}

function resolveTheme(param: string | null, stored: string): OverlayTheme {
  if (param && OVERLAY_THEMES.includes(param as OverlayTheme)) return param as OverlayTheme;
  if (OVERLAY_THEMES.includes(stored as OverlayTheme)) return stored as OverlayTheme;
  return "1080p-standard";
}

const SETTINGS_KEY_OVERLAY_THEME = "nyano.overlay.theme";

function nowMs() {
  return Date.now();
}

function ageLabel(updatedAtMs: number): string {
  const delta = Math.max(0, nowMs() - updatedAtMs);
  const s = Math.floor(delta / 1000);
  if (s < 1) return "たった今";
  if (s < 60) return `${s}秒前`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  return `${h}時間前`;
}

function isTransparentBg(bg: string | null): boolean {
  return bg === "transparent" || bg === "0" || bg === "false";
}

function normalizeWinner(w: unknown): "A" | "B" | "DRAW" | null {
  if (w === null || w === undefined) return null;
  if (w === 0 || w === "0") return "A";
  if (w === 1 || w === "1") return "B";
  if (typeof w === "string") {
    const s0 = w.trim();
    if (!s0) return null;
    const s = s0.toUpperCase();
    if (s === "A" || s === "B") return s;
    if (s === "DRAW") return "DRAW";
  }
  // last resort: don't throw, but show something stable-ish
  const raw = String(w).trim();
  if (!raw) return null;
  const up = raw.toUpperCase();
  if (up === "A" || up === "B") return up as "A" | "B";
  if (up === "DRAW") return "DRAW";
  return null;
}

function winnerForScoreBar(state: OverlayStateV1 | null): PlayerIndex | "draw" | null {
  if (!state?.status?.finished) return null;
  const w: string | number | undefined = state.status.winner as string | number | undefined;
  if (w === "A" || w === 0 || w === "0") return 0;
  if (w === "B" || w === 1 || w === "1") return 1;
  if (typeof w === "string" && w.trim().toLowerCase() === "draw") return "draw";
  return null;
}

function shortId(id: string | undefined): string | null {
  if (!id) return null;
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

type Owner = 0 | 1 | null;

function readOwnersFromBoard(board: (BoardCellLite | null)[]): Owner[] {
  const out: Owner[] = Array.from({ length: 9 }, () => null);
  for (let i = 0; i < 9; i++) {
    const o = board[i]?.owner;
    out[i] = o === 0 || o === 1 ? o : null;
  }
  return out;
}

function countTilesFromBoard(board: (BoardCellLite | null)[]): { a: number; b: number } {
  let a = 0;
  let b = 0;
  for (const cell of board) {
    if (!cell) continue;
    if (cell.owner === 0) a += 1;
    if (cell.owner === 1) b += 1;
  }
  return { a, b };
}

type LastTurnSummary = NonNullable<OverlayStateV1["lastTurnSummary"]>;

function safeLastTurnSummary(state: OverlayStateV1 | null): LastTurnSummary | null {
  const s = state?.lastTurnSummary;
  if (!s) return null;
  if (typeof s.flipCount !== "number") return null;
  return s;
}

function sideLabel(side: PlayerSide | null): "A" | "B" | null {
  if (side === 0) return "A";
  if (side === 1) return "B";
  return null;
}

function formatClassicOpenSlots(indices: readonly number[]): string {
  return indices.map((idx) => String(idx + 1)).join(", ");
}

function formatClassicSwapSlots(aIndex: number, bIndex: number): string {
  return `A${aIndex + 1} <-> B${bIndex + 1}`;
}

export function OverlayPage() {
  const [searchParams] = useSearchParams();
  const controls = searchParams.get("controls") !== "0";
  const bg = searchParams.get("bg");
  const transparent = isTransparentBg(bg);
  const voteEnabled = searchParams.get("vote") !== "0";

  // Theme: URL param takes priority, then localStorage, then default
  const themeParam = searchParams.get("theme");
  const [theme, setTheme] = React.useState<OverlayTheme>(() =>
    resolveTheme(themeParam, readStringSetting(SETTINGS_KEY_OVERLAY_THEME, "1080p-standard")),
  );

  // Re-resolve when URL param changes
  React.useEffect(() => {
    const resolved = resolveTheme(themeParam, readStringSetting(SETTINGS_KEY_OVERLAY_THEME, "1080p-standard"));
    setTheme(resolved);
  }, [themeParam]);

  const handleThemeChange = (t: OverlayTheme) => {
    setTheme(t);
    writeStringSetting(SETTINGS_KEY_OVERLAY_THEME, t);
  };

  const density = themeDensity(theme);
  const avatarSize = themeAvatarSize(theme);
  const boardGap = themeBoardGap(theme);
  const matchPath = React.useMemo(() => appPath("match"), []);
  const replayPath = React.useMemo(() => appPath("replay"), []);
  const themedObsUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set("controls", "0");
    params.set("theme", theme);
    return appAbsoluteUrl(`overlay?${params.toString()}`);
  }, [theme]);
  const obs720pUrl = React.useMemo(
    () => appAbsoluteUrl("overlay?controls=0&theme=720p-standard&bg=transparent"),
    [],
  );
  const obs1080pUrl = React.useMemo(
    () => appAbsoluteUrl("overlay?controls=0&theme=1080p-standard&bg=transparent"),
    [],
  );
  const obsFullUrl = React.useMemo(
    () => appAbsoluteUrl("overlay?controls=0&theme=1080p-full&bg=transparent&vote=0"),
    [],
  );

  const [state, setState] = React.useState<OverlayStateV1 | null>(() => readStoredOverlayState());
  const [voteState, setVoteState] = React.useState<StreamVoteStateV1 | null>(() => readStoredStreamVoteState());
  const [_tick, setTick] = React.useState(0);

  // ── Sticky error display (P0-ERR): keep last error visible for 30s ──
  const [stickyError, setStickyError] = React.useState<string | null>(null);
  const stickyTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!state) return;
    let errorMsg: string | null = null;
    if (state.externalStatus && state.externalStatus.lastOk === false) {
      errorMsg = state.externalStatus.lastMessage ?? "外部連携エラー (External integration error)";
    } else if (state.rpcStatus && !state.rpcStatus.ok) {
      errorMsg = state.rpcStatus.message ?? "RPC接続エラー (RPC connection failed)";
    } else if (state.error) {
      errorMsg = state.error;
    }

    if (errorMsg) {
      setStickyError(errorMsg);
      // Reset timer for 30s visibility
      if (stickyTimerRef.current) window.clearTimeout(stickyTimerRef.current);
      stickyTimerRef.current = window.setTimeout(() => setStickyError(null), 30_000);
    }
  }, [state?.externalStatus, state?.rpcStatus, state?.error]); // eslint-disable-line react-hooks/exhaustive-deps -- only re-run on error fields

  React.useEffect(() => {
    return () => { if (stickyTimerRef.current) window.clearTimeout(stickyTimerRef.current); };
  }, []);

  React.useEffect(() => {
    // keep "age" and vote countdown fresh
    const needTick = controls || voteState?.status === "open";
    if (!needTick) return;
    const t = window.setInterval(() => setTick((x) => x + 1), 500);
    return () => window.clearInterval(t);
  }, [controls, voteState?.status]);

  React.useEffect(() => {
    return subscribeOverlayState((s) => setState(s));
  }, []);

  React.useEffect(() => {
    return subscribeStreamVoteState((s) => setVoteState(s));
  }, []);

  const themeClass = `overlay-theme-${theme}`;
  const rootClass = [
    "min-h-screen",
    transparent ? "bg-transparent" : "bg-gradient-to-b from-rose-50 via-white to-sky-50",
    "text-slate-900",
    themeClass,
    transparent ? "ol-transparent-boost" : "",
  ].filter(Boolean).join(" ");

  const board: (BoardCellLite | null)[] = Array.isArray(state?.board)
    ? state.board
    : Array.from({ length: 9 }, () => null);

  const title = state?.eventTitle ? state.eventTitle : "Nyano Triad League";
  const modeBadge =
    state?.mode === "live" ? (
      <span className="badge badge-nyano">LIVE</span>
    ) : state?.mode === "replay" ? (
      <span className="badge badge-sky">REPLAY</span>
    ) : null;

  const winnerLabel = normalizeWinner(state?.status?.winner);
  const tiles = React.useMemo(() => countTilesFromBoard(board), [board]);
  const matchIdShort = state?.status?.finished && state?.status?.matchId ? shortId(state.status.matchId) : null;

  const sub =
    state?.status?.finished && winnerLabel
      ? `勝者: ${winnerLabel}${Number.isFinite(tiles.a) && Number.isFinite(tiles.b) ? ` · タイル A:${tiles.a}/B:${tiles.b}` : ""}`
      : typeof state?.turn === "number"
        ? `ターン ${state.turn}/9 · タイル A:${tiles.a}/B:${tiles.b}`
        : "待機中…";

  const toPlay = React.useMemo(() => computeToPlay(state), [state]);
  const toPlayLabel = sideLabel(toPlay);

  const strictAllowed = React.useMemo(() => computeStrictAllowed(state), [state]);
  const overlayClassic = React.useMemo(() => resolveClassicMetadataFromOverlayState(state), [state]);
  const overlayClassicOpen = overlayClassic?.open ?? null;

  const lastCell = typeof state?.lastMove?.cell === "number" ? state.lastMove.cell : null;
  const markCell = typeof state?.lastMove?.warningMarkCell === "number" ? state.lastMove.warningMarkCell : null;

  const lastTurnSummary = safeLastTurnSummary(state);

  // Flip detection (best-effort) by comparing owners between last and current board.
  const prevOwnersRef = React.useRef<Owner[]>(Array.from({ length: 9 }, () => null));
  const [lastFlipCount, setLastFlipCount] = React.useState<number | null>(null);
  const [lastFlippedCells, setLastFlippedCells] = React.useState<number[]>([]);

  React.useEffect(() => {
    const owners = readOwnersFromBoard(board);

    const prev = prevOwnersRef.current;
    prevOwnersRef.current = owners;

    if (!state?.lastMove) {
      setLastFlipCount(null);
      setLastFlippedCells([]);
      return;
    }

    // Prefer engine-provided flip traces if available (more accurate than owner-diff heuristics).
    if (Array.isArray(lastTurnSummary?.flips)) {
      const flips = lastTurnSummary.flips;
      const cells = Array.from(
        new Set(
          flips
            .map((f) => Number(f.to))
            .filter((n) => Number.isFinite(n))
        )
      ).sort((a, b) => a - b);

      setLastFlippedCells(cells);
      if (typeof lastTurnSummary?.flipCount === "number") setLastFlipCount(Number(lastTurnSummary.flipCount));
      else setLastFlipCount(cells.length);
      return;
    }

    const by = state.lastMove.by;
    const other: 0 | 1 = by === 0 ? 1 : 0;
    const flips: number[] = [];
    for (let i = 0; i < 9; i++) {
      if (prev[i] === other && owners[i] === by) flips.push(i);
    }
    setLastFlipCount(flips.length);
    setLastFlippedCells(flips);
  }, [state, board]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: recompute when state changes

  const cellClass = (i: number): string => {
    const base = "relative aspect-square rounded-2xl border p-1 shadow-sm overflow-hidden";
    const owner = board[i]?.owner;
    // Owner-colored glow using existing CSS classes (Phase 1 Visual)
    const ownerCls = owner === 0 ? "overlay-cell-a"
                   : owner === 1 ? "overlay-cell-b"
                   : "overlay-cell-empty";
    // Last placed cell: pop-in animation
    if (lastCell === i) return [base, ownerCls, "animate-cell-place"].join(" ");
    // Warning mark: amber ring
    if (markCell === i) return [base, ownerCls, "border-amber-400 ring-2 ring-amber-300"].join(" ");
    // Flipped cells: 3D flip animation with staggered delay
    const flipIdx = lastFlippedCells.indexOf(i);
    if (flipIdx >= 0) {
      const delay = flipIdx < 3 ? `flip-delay-${flipIdx + 1}` : "";
      return [base, ownerCls, "animate-cell-flip", delay].filter(Boolean).join(" ");
    }
    return [base, ownerCls].join(" ");
  };

  const voteRemainingSec =
    voteState?.status === "open" && typeof voteState.endsAtMs === "number"
      ? Math.max(0, Math.ceil((voteState.endsAtMs - nowMs()) / 1000))
      : null;

  const _flipStats = React.useMemo(() => {
    const flips = Array.isArray(lastTurnSummary?.flips) ? lastTurnSummary!.flips : null;
    if (!flips) return null;
    const chain = flips.filter((f: FlipTraceV1) => Boolean(f.isChain)).length;
    const diag = flips.filter((f: FlipTraceV1) => f.kind === "diag").length;
    const janken = flips.filter((f: FlipTraceV1) => Boolean(f.tieBreak)).length;
    const total = flips.length;
    return {
      total,
      chain,
      direct: Math.max(0, total - chain),
      diag,
      ortho: Math.max(0, total - diag),
      janken,
    };
  }, [lastTurnSummary]);

  const flipCountLabel =
    typeof lastTurnSummary?.flipCount === "number" ? lastTurnSummary.flipCount : typeof lastFlipCount === "number" ? lastFlipCount : null;

  const flipBadgeLabel = flipCountLabel === null ? "flip×?" : `flip×${flipCountLabel}`;

  const swingBadge =
    typeof flipCountLabel === "number" && flipCountLabel >= 3 ? <span className="badge badge-nyano">BIG SWING</span> : null;

  const flipReadout = React.useMemo(() => {
    if (!state?.lastMove) return null;
    const traces = Array.isArray(lastTurnSummary?.flips) ? lastTurnSummary!.flips : [];
    const byLabel = state.lastMove.by === 0 ? "A" : "B";
    return flipTracesReadout(traces, byLabel, state.lastMove.cell);
  }, [lastTurnSummary, state?.lastMove]);

  // Phase 1: Move quality tip with narrative (heuristic + context)
  const moveTip = React.useMemo(() => {
    return generateMoveTipWithNarrative(
      lastTurnSummary,
      state?.lastMove ?? null,
      tiles.a > 0 || tiles.b > 0 ? { tilesA: tiles.a, tilesB: tiles.b } : null,
    );
  }, [lastTurnSummary, state?.lastMove, tiles.a, tiles.b]);

  const reactionInput = React.useMemo<NyanoReactionInput | null>(() => {
    if (!state) return null;

    const finished = Boolean(state?.status?.finished) || (typeof state.turn === "number" && state.turn >= 9);
    const winner = finished ? winnerForScoreBar(state) : null;

    const flipCount =
      typeof lastTurnSummary?.flipCount === "number"
        ? lastTurnSummary.flipCount
        : typeof lastFlipCount === "number"
          ? lastFlipCount
          : 0;

    const hasChain = Array.isArray(lastTurnSummary?.flips) ? lastTurnSummary!.flips!.some((f: FlipTraceV1) => Boolean(f.isChain)) : false;

    return {
      flipCount,
      hasChain,
      comboEffect: lastTurnSummary?.comboEffect ?? "none",
      warningTriggered: Boolean(lastTurnSummary?.warningTriggered),
      tilesA: tiles.a,
      tilesB: tiles.b,
      perspective: null,
      finished,
      winner,
    };
  }, [state, lastTurnSummary, lastFlipCount, tiles.a, tiles.b]);

  const voteTurn = typeof voteState?.turn === "number" ? voteState.turn : null;
  const voteSide = typeof voteState?.controlledSide === "number" ? (voteState.controlledSide as PlayerSide) : null;
  const voteTurnOk = voteState?.status === "open" && typeof state?.turn === "number" && voteTurn !== null ? voteTurn === state.turn : null;
  const voteSideOk = voteState?.status === "open" && toPlay !== null && voteSide !== null ? voteSide === toPlay : null;

  const layoutClass = controls ? "grid gap-4 md:grid-cols-[1fr,360px]" : "grid gap-4 p-4 md:grid-cols-[1fr,380px]";

  return (
    <div className={rootClass}>
      <div className={controls ? "container-page" : "p-0"}>
        {controls ? (
          <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800">
                🎥 Overlay · <span className="text-rose-600">{title}</span> {modeBadge}
              </div>
              <div className="text-[11px] text-slate-500">
                {state?.updatedAtMs ? `更新: ${ageLabel(state.updatedAtMs)} · ` : null}
                {sub}
                {matchIdShort ? <span> · 対戦ID {matchIdShort}</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a className="btn btn-sm no-underline" href={window.location.href} target="_blank" rel="noreferrer noopener">
                開く
              </a>
              <Link className="btn btn-sm no-underline" to="/stream">
                配信スタジオ
              </Link>
              <Link className="btn btn-sm no-underline" to="/match?ui=mint">
                Match
              </Link>
              <Link className="btn btn-sm no-underline" to="/replay">
                Replay
              </Link>
            </div>
          </div>
        ) : null}

        {/* Stale data warning banner (Phase 0 stability) */}
        {state?.updatedAtMs && (Date.now() - state.updatedAtMs > 10_000) ? (
          <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 animate-pulse">
            ⚠ データ更新停止 (Data stale) {ageLabel(state.updatedAtMs)} - Match タブの接続を確認してください
          </div>
        ) : null}

        <div className={layoutClass}>
          {/* Board */}
          <div className={controls ? "rounded-3xl border border-slate-200 bg-white/75 p-3 shadow-sm" : "rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-sm"}>
            <div className={controls ? "grid grid-cols-3 gap-2" : `grid grid-cols-3 ${boardGap}`} role="grid" aria-label="Triad game board">
              {Array.from({ length: 9 }, (_, i) => {
                const cell = board[i];
                const owner = cell?.owner;
                const card = cell?.card;

                const isLast = lastCell === i;
                const isMark = markCell === i;

                return (
                  <div key={i} className={cellClass(i)} title={`Cell ${i} (${cellIndexToCoord(i)})`} role="gridcell" aria-label={`${cellIndexToCoord(i)}${board[i]?.owner === 0 ? " Player A" : board[i]?.owner === 1 ? " Player B" : " empty"}`}>
                    <div className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-0.5 font-semibold text-slate-500" style={{ fontSize: controls ? undefined : "var(--ol-cell-label, var(--ol-badge-font, 10px))" }}>
                      {cellIndexToCoord(i)}
                    </div>

                    {isLast ? (
                      <div className="absolute right-2 top-2 rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">✨</div>
                    ) : null}

                    {isMark ? (
                      <div className="absolute right-2 bottom-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">!</div>
                    ) : null}

                    {card ? (
                      <div className="h-full w-full">
                        <CardNyanoDuel card={card as CardData} owner={owner as PlayerIndex} />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">…</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right-side HUD — panel order: Last move → Now Playing → AI → Vote → strictAllowed → Errors */}
          <div className="space-y-3">
            {/* 1. Last move (P0 for stream viewers) — Tier 1: Primary / Dramatic */}
            {state?.lastMove ? (
              <div className={controls
                ? "rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm"
                : [
                    "rounded-2xl border border-slate-200 ol-pad shadow-sm",
                    (lastTurnSummary && (
                      (lastTurnSummary.flipCount ?? 0) >= 3 ||
                      lastTurnSummary.comboEffect === "domination" ||
                      lastTurnSummary.comboEffect === "fever" ||
                      lastTurnSummary.warningTriggered
                    )) ? "ol-panel-dramatic" : "ol-panel-primary",
                  ].join(" ")
              }>
                <div className="flex items-center justify-between gap-2">
                  <div className={controls ? "text-xs font-semibold text-slate-800" : "text-sm font-semibold text-slate-800"}>直前の手</div>
                  {state?.updatedAtMs ? <span className={controls ? "text-xs text-slate-400" : "text-xs text-slate-400"}>{ageLabel(state.updatedAtMs)}</span> : null}
                </div>

                <div className={controls ? "mt-1 text-sm text-slate-700" : "mt-1 font-bold text-slate-800"} style={controls ? undefined : { fontSize: "var(--ol-turn, 16px)" }}>
                  ターン {state.lastMove.turnIndex + 1}:{" "}
                  <span className="font-semibold">{state.lastMove.by === 0 ? "A" : "B"}</span>{" "}
                  <span className="font-mono">
                    {toViewerMoveText({
                      cell: state.lastMove.cell,
                      cardIndex: state.lastMove.cardIndex,
                      ...(typeof state.lastMove.warningMarkCell === "number" ? { warningMarkCell: state.lastMove.warningMarkCell } : {}),
                    })}
                  </span>
                </div>

                {/* flipTracesReadout (P0) — commit-0084: OBS-critical, theme-scaled */}
                {flipReadout ? <div className={controls ? "mt-1 text-xs text-slate-600" : "mt-1 ol-detail-text text-slate-300"}>{flipReadout}</div> : null}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="badge badge-sky">{flipBadgeLabel}</span>
                  {typeof state.lastMove.warningMarkCell === "number" ? <span className="badge badge-amber">MARK</span> : null}
                  {flipCountLabel === 0 ? <span className="badge">反転なし</span> : null}
                  {swingBadge}

                  {lastTurnSummary && lastTurnSummary.comboEffect !== "none" ? (
                    <span className="badge badge-emerald">COMBO: {String(lastTurnSummary.comboEffect).toUpperCase()}</span>
                  ) : null}
                  {lastTurnSummary && typeof lastTurnSummary.comboCount === "number" && lastTurnSummary.comboCount > 0 ? (
                    <span className="badge">combo×{lastTurnSummary.comboCount}</span>
                  ) : null}

                  {lastTurnSummary && typeof lastTurnSummary.triadPlus === "number" && lastTurnSummary.triadPlus > 0 ? (
                    <span className="badge badge-emerald">PLUS +{lastTurnSummary.triadPlus}</span>
                  ) : null}

                  {lastTurnSummary?.ignoreWarningMark ? <span className="badge badge-nyano">IGNORE MARK</span> : null}
                  {lastTurnSummary?.warningTriggered ? <span className="badge badge-amber">MARK発動</span> : null}
                  {typeof lastTurnSummary?.warningPlaced === "number" ? <span className="badge badge-amber">MARK設置</span> : null}

                  {lastTurnSummary && Array.isArray(lastTurnSummary.flips) && lastTurnSummary.flips.length > 0 ? (
                    <FlipTraceBadges flipTraces={lastTurnSummary.flips} limit={controls ? 4 : 6} />
                  ) : null}

                  {/* Phase 1: Move quality tip */}
                  {moveTip ? <MoveQualityTip tip={moveTip} size={controls ? "sm" : "md"} /> : null}
                </div>

                {typeof state.lastMove.warningMarkCell === "number" ? (
                  <div className="mt-1 text-xs text-slate-500">
                    warning mark → <span className="font-mono">{cellIndexToCoord(state.lastMove.warningMarkCell)}</span>
                  </div>
                ) : null}

                {typeof lastTurnSummary?.warningPlaced === "number" ? (
                  <div className="mt-1 text-xs text-slate-500">
                    設置した warning mark → <span className="font-mono">{cellIndexToCoord(lastTurnSummary.warningPlaced)}</span>
                  </div>
                ) : null}

                {density !== "minimal" && lastFlippedCells.length > 0 ? (
                  <div className="mt-1 text-xs text-slate-500">
                    反転: <span className="font-mono">{lastFlippedCells.map(cellIndexToCoord).join(", ")}</span>
                  </div>
                ) : null}

                {density !== "minimal" && lastTurnSummary && Array.isArray(lastTurnSummary.flips) && lastTurnSummary.flips.length > 0 ? (
                  <div className="mt-1 text-xs text-slate-500">
                    {flipTracesSummary(lastTurnSummary.flips)}
                  </div>
                ) : null}

                {/* WS4: Unified flip trace detail (controls mode only) */}
                {controls && lastTurnSummary && Array.isArray(lastTurnSummary.flips) && lastTurnSummary.flips.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white/60 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-700">反転トレース</div>
                      <div className="text-xs text-slate-500">詳細</div>
                    </div>
                    <FlipTraceDetailList flipTraces={lastTurnSummary.flips as FlipTraceV1[]} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* 2. Now Playing — Tier 1: Primary */}
            <div className={controls ? "rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm" : "rounded-2xl border border-slate-200 ol-panel-primary ol-pad shadow-sm"}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {reactionInput ? (
                    <NyanoAvatar
                      size={controls ? 28 : avatarSize}
                      expression={reactionToExpression(pickReactionKind(reactionInput))}
                    />
                  ) : (
                    <NyanoAvatar size={controls ? 28 : avatarSize} expression="calm" />
                  )}
                  <div className={controls ? "text-xs font-semibold text-slate-800" : "text-sm font-semibold text-slate-800"}>対戦中 (Now Playing)</div>
                </div>
                <div className="flex items-center gap-2">
                  {reactionInput ? <NyanoReactionBadge input={reactionInput} turnIndex={typeof state?.turn === "number" ? state.turn : 0} /> : null}
                  {modeBadge}
                </div>
              </div>
              <div className={controls ? "mt-1 text-sm text-slate-700" : "mt-1 text-base font-semibold text-slate-800"}>{title}</div>
              <div className={controls ? "mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500" : "mt-1 flex flex-wrap items-center gap-2 ol-detail-text text-slate-300"}>
                <span className={controls ? "" : "ol-turn-label"} style={controls ? undefined : { fontSize: "var(--ol-turn, 16px)" }}>{sub}</span>
                {toPlayLabel ? (
                  <span className={toPlay === 0 ? "to-play-pill to-play-pill-a" : "to-play-pill to-play-pill-b"}>
                    次手: {toPlayLabel}
                  </span>
                ) : null}
              </div>
              {overlayClassicOpen ? (
                <div className={controls ? "mt-1 text-xs text-slate-500" : "mt-1 ol-detail-text text-slate-300"}>
                  Classic Open:{" "}
                  <span className="font-mono">
                    {overlayClassicOpen.mode === "all_open"
                      ? "全カード公開"
                      : `A[${formatClassicOpenSlots(overlayClassicOpen.playerA)}] / B[${formatClassicOpenSlots(overlayClassicOpen.playerB)}]`}
                  </span>
                </div>
              ) : null}
              {overlayClassic?.swap ? (
                <div className={controls ? "mt-1 text-xs text-slate-500" : "mt-1 ol-detail-text text-slate-300"}>
                  Classic Swap: <span className="font-mono">{formatClassicSwapSlots(overlayClassic.swap.aIndex, overlayClassic.swap.bIndex)}</span>
                </div>
              ) : null}

              <div className="mt-2" style={{ fontSize: controls ? undefined : "var(--ol-score, 22px)" }}>
                <ScoreBar
                  board={board as unknown as import("@nyano/triad-engine").BoardState}
                  moveCount={typeof state?.turn === "number" ? state.turn : 0}
                  maxMoves={9}
                  winner={winnerForScoreBar(state)}
                  className="!justify-between"
                  size={controls ? "sm" : "lg"}
                />
              </div>

              {matchIdShort ? <div className={controls ? "mt-1 text-xs text-slate-400" : "mt-1 ol-detail-text text-slate-400"}>対戦ID: {matchIdShort}</div> : null}
            </div>

            {/* 2.5 Advantage indicator (hidden in minimal density) — Tier 2: Secondary */}
            {density !== "minimal" && (() => {
              const adv = state?.advantage
                ? {
                    scoreA: state.advantage.scoreA,
                    levelA: state.advantage.levelA as AdvantageLevel,
                    levelB: "even" as AdvantageLevel,
                    labelJa: state.advantage.labelJa,
                    badgeColor: state.advantage.badgeColor,
                    reasons: [] as AdvantageReason[],
                    topReason: null as AdvantageReason | null,
                  }
                : board.some((c) => c !== null)
                  ? assessBoardAdvantageDetailed(board as unknown as import("@nyano/triad-engine").BoardState)
                  : null;
              if (!adv) return null;
              if (controls) {
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">形勢</span>
                    <AdvantageBadge advantage={adv} size="sm" showScore />
                  </div>
                );
              }
              return (
                <div className="ol-panel-secondary rounded-2xl px-3 py-2">
                  <AdvantageBar advantage={adv} size={density === "full" ? "lg" : "md"} reasons={adv.reasons} />
                </div>
              );
            })()}

            {/* 3. AI callout (hidden in minimal density) — Tier 2: Secondary */}
            {density !== "minimal" && state?.aiNote ? (
              <div className={controls ? "callout callout-info" : "callout callout-info ol-panel-secondary"}>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold">Nyanoコメント</div>
                  {state.aiReasonCode ? (
                    <AiReasonBadge reasonCode={state.aiReasonCode as AiReasonCode} />
                  ) : null}
                </div>
                <div className="mt-1 text-sm">{state.aiNote}</div>
              </div>
            ) : null}

            {/* 4. Vote status (visible when vote=1) */}
            {/* 4. Vote status — Tier 2: Secondary */}
            {voteEnabled ? (
              <div className={controls ? "rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm" : "rounded-2xl border border-slate-200 ol-panel-secondary ol-pad shadow-sm"}>
                <div className="flex items-center justify-between gap-2">
                  <div className={controls ? "text-xs font-semibold text-slate-800" : "text-sm font-semibold text-slate-800"}>投票状況 (Chat voting)</div>
                  {voteState?.status === "open" ? (
                    <span className={controls ? "badge badge-emerald" : "badge badge-lg badge-emerald"}>OPEN</span>
                  ) : (
                    <span className="badge">CLOSED</span>
                  )}
                </div>

                {/* Vote countdown (OBS-friendly — P2-084 enhanced) */}
                {voteState?.status === "open" && voteRemainingSec !== null ? (
                  <div
                    className={
                      controls
                        ? "mt-1 text-xs text-emerald-600 font-semibold"
                        : [
                            "mt-2 ol-vote-countdown",
                            voteRemainingSec <= 5 ? "ol-vote-countdown--urgent" : "",
                          ].filter(Boolean).join(" ")
                    }
                    style={controls ? undefined : { fontSize: "var(--ol-countdown, 28px)" }}
                    aria-live="polite"
                    aria-label={`残り ${voteRemainingSec} seconds remaining`}
                  >
                    残り {voteRemainingSec}s remaining
                  </div>
                ) : null}

                {/* commit-0084: OBS-critical vote metadata — theme-scaled */}
                <div className={controls ? "mt-1 text-xs text-slate-600" : "mt-1 ol-detail-text text-slate-300"}>
                  操作側:{" "}
                  <span className="font-mono">{voteState?.controlledSide === 1 ? "B" : voteState?.controlledSide === 0 ? "A" : "—"}</span>
                  {" "}· ターン:{" "}
                  <span className="font-mono">{voteState?.status === "open" ? (voteTurn ?? "?") : "—"}</span>
                  {" "}· 票数:{" "}
                  <span className="font-mono font-bold">{typeof voteState?.totalVotes === "number" ? voteState.totalVotes : 0}</span>
                </div>

                {/* Sync badges */}
                {voteState?.status === "open" ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {voteTurnOk === true ? <span className="badge badge-slate">ターン一致</span> : voteTurnOk === false ? <span className="badge badge-rose">TURN MISMATCH</span> : <span className="badge">ターン?</span>}
                    {voteSideOk === true ? <span className="badge badge-slate">操作側一致</span> : voteSideOk === false ? <span className="badge badge-rose">SIDE MISMATCH</span> : <span className="badge">操作側?</span>}
                    {strictAllowed ? (
                      <span className="badge badge-slate" title={strictAllowed.hash}>
                        strictAllowed {strictAllowed.count} · {strictAllowed.hash}
                      </span>
                    ) : (
                      <span className="badge">strictAllowed —</span>
                    )}
                  </div>
                ) : (
                  <div className={controls ? "mt-2 text-xs text-slate-500" : "mt-2 ol-detail-text text-slate-400"}>投票は終了しています。</div>
                )}

                {voteState?.status === "open" && Array.isArray(voteState.top) && voteState.top.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {voteState.top.slice(0, 3).map((x, i) => (
                      <div key={i} className={controls ? "flex items-center justify-between gap-2 text-xs" : "flex items-center justify-between gap-2 ol-vote-display"}>
                        <span className="font-mono">
                          {toViewerMoveText({
                            cell: x.move.cell,
                            cardIndex: x.move.cardIndex,
                            ...(typeof x.move.warningMarkCell === "number" ? { warningMarkCell: x.move.warningMarkCell } : {}),
                          })}
                        </span>
                        <span className={controls ? "badge badge-sky" : "badge badge-lg badge-sky"}>{x.count}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {voteState?.note ? <div className={controls ? "mt-2 text-xs text-slate-500" : "mt-2 ol-detail-text text-slate-400"}>{voteState.note}</div> : null}
              </div>
            ) : null}

            {/* 5. strictAllowed HUD (operator/debug — P2-084: hidden from OBS viewers) — Tier 3: Tertiary */}
            {controls && density !== "minimal" ? <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-800">strictAllowed</div>
                {strictAllowed ? (
                  <span className="badge badge-slate">{strictAllowed.count}</span>
                ) : (
                  <span className="badge">—</span>
                )}
              </div>

              {strictAllowed ? (
                <>
                  <div className="mt-1 text-xs text-slate-600">
                    toPlay: <span className="font-mono">{sideLabel(strictAllowed.toPlay)}</span> · 合法手:{" "}
                    <span className="font-mono">{strictAllowed.count}</span>
                    {typeof strictAllowed.warningMark?.remaining === "number" ? (
                      <>
                        {" "}· WM:{" "}
                        <span className="font-mono">{strictAllowed.warningMark.remaining}</span>
                      </>
                    ) : null}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    hash: <span className="font-mono">{strictAllowed.hash}</span>
                  </div>

                  {strictAllowed.warningMark.remaining > 0 ? (
                    <div className="mt-1 text-xs text-slate-500">
                      WM候補: <span className="font-mono">{strictAllowed.warningMark.candidates.join(", ")}</span>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-1 text-xs text-slate-500">ホスト待機中…</div>
              )}
            </div> : null}

            {/* 5.5. Sticky error banner (P0-ERR): persists for 30s after last error */}
            {stickyError && !state?.error && !(state?.externalStatus?.lastOk === false) && !(state?.rpcStatus && !state.rpcStatus.ok) ? (
              <div className="callout callout-error opacity-80">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <div className="text-xs font-semibold">直近エラー (Last Error)</div>
                </div>
                <div className="mt-1 text-sm">{stickyError}</div>
              </div>
            ) : null}

            {/* 6. Error callout */}
            {state?.error ? (
              <div className="callout callout-error" role="alert">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse" />
                  <div className="text-xs font-semibold">エラー</div>
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm">{state.error}</div>
              </div>
            ) : null}

            {/* 7. External integration error */}
            {state?.externalStatus && state.externalStatus.lastOk === false ? (
              <div className="callout callout-error" role="alert">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse" />
                  <div className="text-xs font-semibold">連携エラー</div>
                </div>
                <div className="mt-1 text-sm">{state.externalStatus.lastMessage ?? "不明なエラー"}</div>
              </div>
            ) : null}

            {/* 7.5. RPC connection error (Phase 0 stability) */}
            {state?.rpcStatus && !state.rpcStatus.ok ? (
              <div className="callout callout-error" role="alert">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse" />
                  <div className="text-xs font-semibold">RPCエラー</div>
                </div>
                <div className="mt-1 text-sm">{state.rpcStatus.message ?? "RPC接続に失敗しました"}</div>
              </div>
            ) : null}

            {!state ? (
              <div className="callout callout-muted">
                <div className="text-xs font-semibold">信号待ち (No signal yet)</div>
                <div className="mt-1 text-sm text-slate-700">
                  <span className="font-mono">{matchPath}</span> または <span className="font-mono">{replayPath}</span> を開き、overlayへ状態を送信してください。
                  <br />
                  overlay は最新状態を自動で受け取ります。
                </div>
              </div>
            ) : null}

            {controls ? (
              <div className="space-y-3">
                {/* Theme picker */}
                <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
                  <div className="text-xs font-semibold text-slate-800">テーマ (Theme)</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {OVERLAY_THEMES.map((t) => (
                      <button
                        key={t}
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          theme === t
                            ? "border-nyano-400 bg-nyano-50 text-nyano-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                        onClick={() => handleThemeChange(t)}
                        aria-label={`Theme: ${THEME_LABELS[t]}`}
                        aria-current={theme === t ? "true" : undefined}
                      >
                        {THEME_LABELS[t]}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate-400">
                    OBS URL: <span className="font-mono">{themedObsUrl}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs text-slate-500 shadow-sm">
                  ヒント:
                  <ul className="mt-1 list-disc pl-4">
                    <li>
                      OBS BrowserSource は <span className="font-mono">{themedObsUrl}</span> を使用（必要なら{" "}
                      <span className="font-mono">bg=transparent</span>）。
                    </li>
                    <li>
                      投票UIは <span className="font-mono">vote=0</span> で非表示化。
                    </li>
                    <li>
                      密度: <span className="font-mono">{density}</span> - {density === "minimal" ? "形勢/AIバッジを省略" : density === "full" ? "情報多め・文字大きめ" : "標準表示"}
                    </li>
                  </ul>
                </div>

                {/* OBS Scene Templates (Phase 1) */}
                <details className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
                  <summary className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
                    OBSシーンテンプレート
                  </summary>
                  <div className="mt-2 grid gap-3 text-xs text-slate-600">
                    <div>
                      <div className="font-semibold text-slate-700">720p配信 (1280x720)</div>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li>Theme: <code className="font-mono bg-slate-100 px-1 rounded">720p-standard</code> または <code className="font-mono bg-slate-100 px-1 rounded">720p-minimal</code></li>
                        <li>Browser Source: 400x720（右側）</li>
                        <li>URL: <code className="font-mono bg-slate-100 px-1 rounded text-[10px]">{obs720pUrl}</code></li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-700">1080p配信 (1920x1080)</div>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li>Theme: <code className="font-mono bg-slate-100 px-1 rounded">1080p-standard</code> または <code className="font-mono bg-slate-100 px-1 rounded">1080p-full</code></li>
                        <li>Browser Source: 500x1080（右側）</li>
                        <li>URL: <code className="font-mono bg-slate-100 px-1 rounded text-[10px]">{obs1080pUrl}</code></li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-700">フルスクリーン Overlay</div>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li>Browser Source: 1920x1080</li>
                        <li>URL: <code className="font-mono bg-slate-100 px-1 rounded text-[10px]">{obsFullUrl}</code></li>
                      </ul>
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                      <code className="font-mono bg-slate-100 px-1 rounded">vote=0</code> を付けると投票パネルを非表示にできます。
                      クロマキー運用は <code className="font-mono bg-slate-100 px-1 rounded">bg=transparent</code> を利用してください。
                    </div>
                  </div>
                </details>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
