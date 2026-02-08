import React from "react";
import { Link, useSearchParams } from "react-router-dom";

import { CardMini } from "@/components/CardMini";
import { NyanoReactionBadge, type NyanoReactionInput } from "@/components/NyanoReaction";
import { ScoreBar } from "@/components/ScoreBar";
import { FlipTraceBadges } from "@/components/FlipTraceBadges";
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
  type OverlayStateV1,
  type StreamVoteStateV1,
} from "@/lib/streamer_bus";
import type { PlayerIndex } from "@nyano/triad-engine";

function nowMs() {
  return Date.now();
}

function ageLabel(updatedAtMs: number): string {
  const delta = Math.max(0, nowMs() - updatedAtMs);
  const s = Math.floor(delta / 1000);
  if (s < 1) return "now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
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
  const w = state.status.winner;
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

function readOwnersFromBoard(board: any[]): Owner[] {
  const out: Owner[] = Array.from({ length: 9 }, () => null);
  for (let i = 0; i < 9; i++) {
    const o = (board[i] as any)?.owner;
    out[i] = o === 0 || o === 1 ? (o as 0 | 1) : null;
  }
  return out;
}

function countTilesFromBoard(board: any[]): { a: number; b: number } {
  let a = 0;
  let b = 0;
  for (const cell of board) {
    if (!cell) continue;
    if ((cell as any).owner === 0) a += 1;
    if ((cell as any).owner === 1) b += 1;
  }
  return { a, b };
}

type LastTurnSummary = NonNullable<OverlayStateV1["lastTurnSummary"]>;

function safeLastTurnSummary(state: OverlayStateV1 | null): LastTurnSummary | null {
  const s = (state as any)?.lastTurnSummary;
  if (!s) return null;
  if (typeof s.flipCount !== "number") return null;
  return s as LastTurnSummary;
}

function sideLabel(side: PlayerSide | null): "A" | "B" | null {
  if (side === 0) return "A";
  if (side === 1) return "B";
  return null;
}

export function OverlayPage() {
  const [searchParams] = useSearchParams();
  const controls = searchParams.get("controls") !== "0";
  const bg = searchParams.get("bg");
  const transparent = isTransparentBg(bg);
  const voteEnabled = searchParams.get("vote") !== "0";

  const [state, setState] = React.useState<OverlayStateV1 | null>(() => readStoredOverlayState());
  const [voteState, setVoteState] = React.useState<StreamVoteStateV1 | null>(() => readStoredStreamVoteState());
  const [_tick, setTick] = React.useState(0);

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

  const rootClass = [
    "min-h-screen",
    transparent ? "bg-transparent" : "bg-gradient-to-b from-rose-50 via-white to-sky-50",
    "text-slate-900",
  ].join(" ");

  const board: any[] = Array.isArray((state as any)?.board)
    ? ((state as any).board as any[])
    : Array.from({ length: 9 }, () => null);

  const title = state?.eventTitle ? state.eventTitle : "Nyano Triad League";
  const modeBadge =
    state?.mode === "live" ? (
      <span className="badge badge-nyano">LIVE</span>
    ) : state?.mode === "replay" ? (
      <span className="badge badge-sky">REPLAY</span>
    ) : null;

  const winnerLabel = normalizeWinner(state?.status?.winner);
  const tiles = React.useMemo(() => countTilesFromBoard(board), [state?.updatedAtMs]);
  const matchIdShort = state?.status?.finished && state?.status?.matchId ? shortId(state.status.matchId) : null;

  const sub =
    state?.status?.finished && winnerLabel
      ? `Winner: ${winnerLabel}${Number.isFinite(tiles.a) && Number.isFinite(tiles.b) ? ` · tiles A:${tiles.a}/B:${tiles.b}` : ""}`
      : typeof state?.turn === "number"
        ? `Turn ${state.turn}/9 · tiles A:${tiles.a}/B:${tiles.b}`
        : "Waiting…";

  const toPlay = React.useMemo(() => computeToPlay(state), [state?.updatedAtMs]);
  const toPlayLabel = sideLabel(toPlay);

  const strictAllowed = React.useMemo(() => computeStrictAllowed(state), [state?.updatedAtMs]);

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
            .map((f) => Number((f as any).to))
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
  }, [state?.updatedAtMs]);

  const cellClass = (i: number): string => {
    const base = "relative aspect-square rounded-2xl border p-2 shadow-sm";
    const neutral = "border-slate-200 bg-white/60";
    const last = "border-rose-300 bg-rose-50/70 ring-2 ring-rose-200";
    const marked = "border-amber-300 bg-amber-50/70 ring-2 ring-amber-200";
    const flipped = "border-sky-300 bg-sky-50/70 ring-2 ring-sky-200";

    if (lastCell === i) return [base, last].join(" ");
    if (markCell === i) return [base, marked].join(" ");
    if (lastFlippedCells.includes(i)) return [base, flipped].join(" ");
    return [base, neutral].join(" ");
  };

  const voteRemainingSec =
    voteState?.status === "open" && typeof voteState.endsAtMs === "number"
      ? Math.max(0, Math.ceil((voteState.endsAtMs - nowMs()) / 1000))
      : null;

  const flipStats = React.useMemo(() => {
    const flips = Array.isArray(lastTurnSummary?.flips) ? lastTurnSummary!.flips : null;
    if (!flips) return null;
    const chain = flips.filter((f: any) => Boolean(f.isChain)).length;
    const diag = flips.filter((f: any) => f.kind === "diag").length;
    const janken = flips.filter((f: any) => Boolean(f.tieBreak)).length;
    const total = flips.length;
    return {
      total,
      chain,
      direct: Math.max(0, total - chain),
      diag,
      ortho: Math.max(0, total - diag),
      janken,
    };
  }, [state?.updatedAtMs]);

  const flipCountLabel =
    typeof lastTurnSummary?.flipCount === "number" ? lastTurnSummary.flipCount : typeof lastFlipCount === "number" ? lastFlipCount : null;

  const flipBadgeLabel = flipCountLabel === null ? "flip×?" : `flip×${flipCountLabel}`;

  const swingBadge =
    typeof flipCountLabel === "number" && flipCountLabel >= 3 ? <span className="badge badge-nyano">BIG SWING</span> : null;

  const flipReadout = React.useMemo(() => {
    if (!state?.lastMove) return null;
    const traces = Array.isArray(lastTurnSummary?.flips) ? (lastTurnSummary!.flips as any[]) : [];
    const byLabel = state.lastMove.by === 0 ? "A" : "B";
    return flipTracesReadout(traces as any, byLabel, state.lastMove.cell);
  }, [state?.updatedAtMs]);

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

    const hasChain = Array.isArray(lastTurnSummary?.flips) ? lastTurnSummary!.flips!.some((f: any) => Boolean(f.isChain)) : false;

    return {
      flipCount,
      hasChain,
      comboEffect: (lastTurnSummary?.comboEffect ?? "none") as any,
      warningTriggered: Boolean(lastTurnSummary?.warningTriggered),
      tilesA: tiles.a,
      tilesB: tiles.b,
      perspective: null,
      finished,
      winner,
    };
  }, [state?.updatedAtMs, lastTurnSummary, lastFlipCount, tiles.a, tiles.b]);

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
                {state?.updatedAtMs ? `Updated ${ageLabel(state.updatedAtMs)} · ` : null}
                {sub}
                {matchIdShort ? <span> · match {matchIdShort}</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a className="btn btn-sm no-underline" href={window.location.href} target="_blank" rel="noreferrer noopener">
                Open
              </a>
              <Link className="btn btn-sm no-underline" to="/stream">
                Stream Studio
              </Link>
              <Link className="btn btn-sm no-underline" to="/match">
                Match
              </Link>
              <Link className="btn btn-sm no-underline" to="/replay">
                Replay
              </Link>
            </div>
          </div>
        ) : null}

        <div className={layoutClass}>
          {/* Board */}
          <div className={controls ? "rounded-3xl border border-slate-200 bg-white/75 p-3 shadow-sm" : "rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-sm"}>
            <div className={controls ? "grid grid-cols-3 gap-2" : "grid grid-cols-3 gap-3"}>
              {Array.from({ length: 9 }, (_, i) => {
                const cell = board[i];
                const owner = cell?.owner;
                const card = cell?.card;

                const isLast = lastCell === i;
                const isMark = markCell === i;

                return (
                  <div key={i} className={cellClass(i)} title={`Cell ${i} (${cellIndexToCoord(i)})`}>
                    <div className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-500">
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
                        <CardMini card={card} owner={owner} />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">…</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right-side HUD */}
          <div className="space-y-3">
            <div className={controls ? "rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm" : "rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm"}>
              <div className="flex items-center justify-between gap-2">
                <div className={controls ? "text-xs font-semibold text-slate-800" : "text-sm font-semibold text-slate-800"}>Now Playing</div>
                <div className="flex items-center gap-2">
                  {reactionInput ? <NyanoReactionBadge input={reactionInput} turnIndex={typeof state?.turn === "number" ? state.turn : 0} /> : null}
                  {modeBadge}
                </div>
              </div>
              <div className={controls ? "mt-1 text-sm text-slate-700" : "mt-1 text-base font-semibold text-slate-800"}>{title}</div>
              <div className={controls ? "mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500" : "mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600"}>
                <span>{sub}</span>
                {toPlayLabel ? (
                  <span className={toPlay === 0 ? "to-play-pill to-play-pill-a" : "to-play-pill to-play-pill-b"}>
                    Next: {toPlayLabel}
                  </span>
                ) : null}
              </div>

              <div className="mt-2">
                <ScoreBar
                  board={board as any}
                  moveCount={typeof state?.turn === "number" ? state.turn : 0}
                  maxMoves={9}
                  winner={winnerForScoreBar(state)}
                  className="!justify-between"
                  size={controls ? "sm" : "lg"}
                />
              </div>

              {matchIdShort ? <div className={controls ? "mt-1 text-[11px] text-slate-400" : "mt-1 text-xs text-slate-400"}>match: {matchIdShort}</div> : null}
            </div>

            {/* strictAllowed HUD (always visible) */}
            <div className={controls ? "rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm" : "rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm"}>
              <div className="flex items-center justify-between gap-2">
                <div className={controls ? "text-xs font-semibold text-slate-800" : "text-sm font-semibold text-slate-800"}>strictAllowed</div>
                {strictAllowed ? (
                  <span className={controls ? "badge badge-slate" : "badge badge-lg badge-slate"}>{strictAllowed.count}</span>
                ) : (
                  <span className="badge">—</span>
                )}
              </div>

              {strictAllowed ? (
                <>
                  <div className={controls ? "mt-1 text-xs text-slate-600" : "mt-1 text-sm text-slate-600"}>
                    toPlay: <span className="font-mono">{sideLabel(strictAllowed.toPlay)}</span> · moves:{" "}
                    <span className="font-mono">{strictAllowed.count}</span>
                    {typeof strictAllowed.warningMark?.remaining === "number" ? (
                      <>
                        {" "}· WM:{" "}
                        <span className="font-mono">{strictAllowed.warningMark.remaining}</span>
                      </>
                    ) : null}
                  </div>

                  <div className={controls ? "mt-1 text-[11px] text-slate-500" : "mt-1 text-xs text-slate-500"}>
                    hash: <span className="font-mono">{strictAllowed.hash}</span>
                  </div>

                  {controls && strictAllowed.warningMark.remaining > 0 ? (
                    <div className="mt-1 text-[11px] text-slate-500">
                      WM candidates: <span className="font-mono">{strictAllowed.warningMark.candidates.join(", ")}</span>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-1 text-xs text-slate-500">Waiting for host…</div>
              )}
            </div>

            {/* Vote status (always visible when vote=1) */}
            {voteEnabled ? (
              <div className={controls ? "rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm" : "rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm"}>
                <div className="flex items-center justify-between gap-2">
                  <div className={controls ? "text-xs font-semibold text-slate-800" : "text-sm font-semibold text-slate-800"}>Chat voting</div>
                  {voteState?.status === "open" ? (
                    <span className={controls ? "badge badge-emerald" : "badge badge-lg badge-emerald"}>OPEN</span>
                  ) : (
                    <span className="badge">CLOSED</span>
                  )}
                </div>

                {/* Vote countdown (OBS-friendly) */}
                {voteState?.status === "open" && voteRemainingSec !== null ? (
                  <div className={controls ? "mt-1 text-xs text-emerald-600 font-semibold" : "mt-2 text-lg text-emerald-600 font-bold tabular-nums"}>{voteRemainingSec}s remaining</div>
                ) : null}

                <div className={controls ? "mt-1 text-xs text-slate-600" : "mt-1 text-sm text-slate-600"}>
                  controls:{" "}
                  <span className="font-mono">{voteState?.controlledSide === 1 ? "B" : voteState?.controlledSide === 0 ? "A" : "—"}</span>
                  {" "}· turn:{" "}
                  <span className="font-mono">{voteState?.status === "open" ? (voteTurn ?? "?") : "—"}</span>
                  {" "}· votes:{" "}
                  <span className="font-mono font-bold">{typeof voteState?.totalVotes === "number" ? voteState.totalVotes : 0}</span>
                </div>

                {/* Sync badges */}
                {voteState?.status === "open" ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {voteTurnOk === true ? <span className="badge badge-slate">turn ok</span> : voteTurnOk === false ? <span className="badge badge-rose">TURN MISMATCH</span> : <span className="badge">turn ?</span>}
                    {voteSideOk === true ? <span className="badge badge-slate">side ok</span> : voteSideOk === false ? <span className="badge badge-rose">SIDE MISMATCH</span> : <span className="badge">side ?</span>}
                    {strictAllowed ? (
                      <span className="badge badge-slate" title={strictAllowed.hash}>
                        strictAllowed {strictAllowed.count} · {strictAllowed.hash}
                      </span>
                    ) : (
                      <span className="badge">strictAllowed —</span>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500">Vote is closed.</div>
                )}

                {voteState?.status === "open" && Array.isArray(voteState.top) && voteState.top.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {voteState.top.slice(0, 3).map((x, i) => (
                      <div key={i} className={controls ? "flex items-center justify-between gap-2 text-xs" : "flex items-center justify-between gap-2 text-sm"}>
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

                {voteState?.note ? <div className={controls ? "mt-2 text-[11px] text-slate-500" : "mt-2 text-xs text-slate-500"}>{voteState.note}</div> : null}
              </div>
            ) : null}

            {state?.lastMove ? (
              <div className={controls ? "rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm" : "rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm"}>
                <div className="flex items-center justify-between gap-2">
                  <div className={controls ? "text-xs font-semibold text-slate-800" : "text-sm font-semibold text-slate-800"}>Last move</div>
                  {state?.updatedAtMs ? <span className={controls ? "text-[11px] text-slate-400" : "text-xs text-slate-400"}>{ageLabel(state.updatedAtMs)}</span> : null}
                </div>

                <div className={controls ? "mt-1 text-sm text-slate-700" : "mt-1 text-base text-slate-800"}>
                  Turn {state.lastMove.turnIndex + 1}:{" "}
                  <span className="font-semibold">{state.lastMove.by === 0 ? "A" : "B"}</span>{" "}
                  <span className="font-mono">
                    {toViewerMoveText({
                      cell: state.lastMove.cell,
                      cardIndex: state.lastMove.cardIndex,
                      ...(typeof state.lastMove.warningMarkCell === "number" ? { warningMarkCell: state.lastMove.warningMarkCell } : {}),
                    })}
                  </span>
                </div>

                {/* flipTracesReadout (P0) */}
                {flipReadout ? <div className={controls ? "mt-1 text-xs text-slate-600" : "mt-1 text-sm text-slate-600"}>{flipReadout}</div> : null}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="badge badge-sky">{flipBadgeLabel}</span>
                  {typeof state.lastMove.warningMarkCell === "number" ? <span className="badge badge-amber">MARK</span> : null}
                  {flipCountLabel === 0 ? <span className="badge">NO FLIP</span> : null}
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
                  {lastTurnSummary?.warningTriggered ? <span className="badge badge-amber">TRIGGERED MARK</span> : null}
                  {typeof lastTurnSummary?.warningPlaced === "number" ? <span className="badge badge-amber">PLACED MARK</span> : null}

                  {lastTurnSummary && Array.isArray(lastTurnSummary.flips) && lastTurnSummary.flips.length > 0 ? (
                    <FlipTraceBadges flipTraces={lastTurnSummary.flips as any} limit={4} />
                  ) : null}
                </div>

                {typeof state.lastMove.warningMarkCell === "number" ? (
                  <div className="mt-1 text-xs text-slate-500">
                    warning mark → <span className="font-mono">{cellIndexToCoord(state.lastMove.warningMarkCell)}</span>
                  </div>
                ) : null}

                {typeof lastTurnSummary?.warningPlaced === "number" ? (
                  <div className="mt-1 text-xs text-slate-500">
                    placed warning mark → <span className="font-mono">{cellIndexToCoord(lastTurnSummary.warningPlaced)}</span>
                  </div>
                ) : null}

                {lastFlippedCells.length > 0 ? (
                  <div className={controls ? "mt-1 text-[11px] text-slate-500" : "mt-1 text-xs text-slate-500"}>
                    flipped: <span className="font-mono">{lastFlippedCells.map(cellIndexToCoord).join(", ")}</span>
                  </div>
                ) : null}

                {lastTurnSummary && Array.isArray(lastTurnSummary.flips) && lastTurnSummary.flips.length > 0 ? (
                  <div className={controls ? "mt-1 text-[11px] text-slate-500" : "mt-1 text-xs text-slate-500"}>
                    {flipTracesSummary(lastTurnSummary.flips as any)}
                  </div>
                ) : null}

                {controls && lastTurnSummary && Array.isArray(lastTurnSummary.flips) && lastTurnSummary.flips.length > 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white/60 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-semibold text-slate-700">Flip traces</div>
                      <div className="text-[11px] text-slate-500">（実況・デバッグ用 / OBSでは通常非表示）</div>
                    </div>
                    <div className="mt-2 space-y-1">
                      {lastTurnSummary.flips.slice(0, 8).map((f: any, i: number) => (
                        <div key={i} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-mono">
                            {cellIndexToCoord(f.to)} ← {cellIndexToCoord(f.from)}{" "}
                            {f.kind === "ortho"
                              ? f.dir
                                ? `(${f.dir})`
                                : ""
                              : f.vert && f.horiz
                                ? `(${f.vert}+${f.horiz})`
                                : "(diag)"}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-slate">
                              a:{f.aVal} / d:{f.dVal}
                            </span>
                            {f.isChain ? <span className="badge">CHAIN</span> : <span className="badge">DIRECT</span>}
                            {f.tieBreak ? <span className="badge badge-rose">JANKEN</span> : null}
                            {f.kind === "diag" ? <span className="badge badge-sky">DIAG</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {state?.aiNote ? (
              <div className="callout callout-info">
                <div className="text-xs font-semibold">Nyano says</div>
                <div className="mt-1 text-sm">{state.aiNote}</div>
              </div>
            ) : null}

            {state?.error ? (
              <div className="callout callout-warn">
                <div className="text-xs font-semibold">Overlay notice</div>
                <div className="mt-1 whitespace-pre-wrap text-sm">{state.error}</div>
              </div>
            ) : null}

            {!state ? (
              <div className="callout callout-muted">
                <div className="text-xs font-semibold">No signal yet</div>
                <div className="mt-1 text-sm text-slate-700">
                  Open <span className="font-mono">/match</span> or <span className="font-mono">/replay</span>, then send state to the overlay.
                  <br />
                  The overlay will pick up the latest state automatically.
                </div>
              </div>
            ) : null}

            {controls ? (
              <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs text-slate-500 shadow-sm">
                Tips:
                <ul className="mt-1 list-disc pl-4">
                  <li>
                    OBS BrowserSource: use <span className="font-mono">/overlay?controls=0</span> (and optionally{" "}
                    <span className="font-mono">bg=transparent</span>)
                  </li>
                  <li>
                    Vote UI: toggle by <span className="font-mono">vote=0</span>
                  </li>
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
