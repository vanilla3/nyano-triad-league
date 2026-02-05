import React from "react";
import { Link, useSearchParams } from "react-router-dom";

import { CardMini } from "@/components/CardMini";
import {
  readStoredOverlayState,
  readStoredStreamVoteState,
  subscribeOverlayState,
  subscribeStreamVoteState,
  type OverlayStateV1,
  type StreamVoteStateV1,
} from "@/lib/streamer_bus";

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

function normalizeWinner(w: unknown): string | null {
  if (w === null || w === undefined) return null;
  if (w === 0 || w === "0") return "A";
  if (w === 1 || w === "1") return "B";
  if (typeof w === "string") {
    const s = w.trim().toUpperCase();
    if (s === "A" || s === "B") return s;
  }
  return String(w);
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

function computeToPlay(state: OverlayStateV1 | null): "A" | "B" | null {
  if (!state) return null;
  if (state?.status?.finished) return null;
  if (typeof state.turn !== "number") return null;
  if (typeof state.firstPlayer !== "number") return null;
  if (state.turn >= 9) return null;
  const p = ((state.firstPlayer + (state.turn % 2)) % 2) as 0 | 1;
  return p === 0 ? "A" : "B";
}

type LastTurnSummary = {
  flipCount: number;
  comboCount: number;
  comboEffect: "none" | "momentum" | "domination" | "fever";
  triadPlus: number;
  ignoreWarningMark: boolean;
  warningTriggered: boolean;
  warningPlaced: number | null;
};

function safeLastTurnSummary(state: OverlayStateV1 | null): LastTurnSummary | null {
  const s = (state as any)?.lastTurnSummary;
  if (!s) return null;
  if (typeof s.flipCount !== "number") return null;
  return s as LastTurnSummary;
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

  const board: any[] = Array.isArray((state as any)?.board) ? ((state as any).board as any[]) : Array.from({ length: 9 }, () => null);

  const title = state?.eventTitle ? state.eventTitle : "Nyano Triad League";
  const modeBadge =
    state?.mode === "live" ? <span className="badge badge-nyano">LIVE</span> : state?.mode === "replay" ? <span className="badge badge-sky">REPLAY</span> : null;

  const winnerLabel = normalizeWinner(state?.status?.winner);
  const tilesA = typeof state?.status?.tilesA === "number" ? state?.status?.tilesA : null;
  const tilesB = typeof state?.status?.tilesB === "number" ? state?.status?.tilesB : null;
  const matchIdShort = state?.status?.matchId ? shortId(state.status.matchId) : null;

  const sub =
    state?.status?.finished && winnerLabel
      ? `Winner: ${winnerLabel}${tilesA !== null && tilesB !== null ? ` · tiles A:${tilesA}/B:${tilesB}` : ""}`
      : typeof state?.turn === "number"
        ? `Turn ${state.turn}/9`
        : "Waiting…";

  const toPlay = React.useMemo(() => computeToPlay(state), [state?.updatedAtMs]);

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


// Prefer engine-provided flip traces if available (more accurate than owner-diff heuristics).
if (Array.isArray((lastTurnSummary as any)?.flips)) {
  const flips = (lastTurnSummary as any).flips as any[];
  const cells = Array.from(
    new Set(
      flips
        .map((f) => Number(f.to))
        .filter((n) => Number.isFinite(n))
    )
  ).sort((a, b) => a - b);

  setLastFlippedCells(cells);
  if (typeof (lastTurnSummary as any)?.flipCount === "number") setLastFlipCount(Number((lastTurnSummary as any).flipCount));
  else setLastFlipCount(cells.length);
  return;
}

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
    voteState?.status === "open" && typeof voteState.endsAtMs === "number" ? Math.max(0, Math.ceil((voteState.endsAtMs - nowMs()) / 1000)) : null;

  const flipCountLabel =
    typeof lastTurnSummary?.flipCount === "number"
      ? lastTurnSummary.flipCount
      : typeof lastFlipCount === "number"
        ? lastFlipCount
        : null;

  const flipBadgeLabel = flipCountLabel === null ? "flip×?" : `flip×${flipCountLabel}`;

  const swingBadge =
    typeof flipCountLabel === "number" && flipCountLabel >= 3 ? <span className="badge badge-nyano">BIG SWING</span> : null;

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

        <div className={controls ? "grid gap-4 md:grid-cols-[1fr,360px]" : "grid gap-3 p-4"}>
          <div className="rounded-3xl border border-slate-200 bg-white/75 p-3 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }, (_, i) => {
                const cell = board[i];
                const owner = cell?.owner;
                const card = cell?.card;

                const isLast = lastCell === i;
                const isMark = markCell === i;

                return (
                  <div key={i} className={cellClass(i)} title={`Cell ${i}`}>
                    {controls ? (
                      <div className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{i}</div>
                    ) : null}

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

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-800">✨ Now Playing</div>
                {modeBadge}
              </div>
              <div className="mt-1 text-sm text-slate-700">{title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{sub}</span>
                {toPlay ? <span className="badge badge-sky">Next: {toPlay}</span> : null}
              </div>
              {matchIdShort ? <div className="mt-1 text-[11px] text-slate-400">match: {matchIdShort}</div> : null}
            </div>

            {voteEnabled && voteState?.status === "open" ? (
              <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-800">🗳️ Chat voting</div>
                  <span className="badge badge-emerald">OPEN · {voteRemainingSec ?? "?"}s</span>
                </div>

                <div className="mt-1 text-xs text-slate-600">
                  controls: <span className="font-mono">{voteState.controlledSide === 1 ? "B" : "A"}</span> · votes:{" "}
                  <span className="font-mono">{typeof voteState.totalVotes === "number" ? voteState.totalVotes : 0}</span>
                </div>

                {Array.isArray(voteState.top) && voteState.top.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {voteState.top.slice(0, 3).map((x, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono">
                          cell {x.move.cell} · card {x.move.cardIndex}
                          {typeof x.move.warningMarkCell === "number" ? ` · wm ${x.move.warningMarkCell}` : ""}
                        </span>
                        <span className="badge badge-sky">{x.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500">No votes yet…</div>
                )}

                {voteState.note ? <div className="mt-2 text-[11px] text-slate-500">{voteState.note}</div> : null}
              </div>
            ) : null}

            {state?.lastMove ? (
              <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
                <div className="text-xs font-semibold text-slate-800">Last move</div>
                <div className="mt-1 text-sm text-slate-700">
                  Turn {state.lastMove.turnIndex + 1}: <span className="font-semibold">{state.lastMove.by === 0 ? "A" : "B"}</span> placed{" "}
                  <span className="font-mono">#{state.lastMove.cardIndex}</span> at cell <span className="font-mono">{state.lastMove.cell}</span>
                </div>

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
                </div>

                {typeof state.lastMove.warningMarkCell === "number" ? (
                  <div className="mt-1 text-xs text-slate-500">
                    warning mark → cell <span className="font-mono">{state.lastMove.warningMarkCell}</span>
                  </div>
                ) : null}

                {typeof lastTurnSummary?.warningPlaced === "number" ? (
                  <div className="mt-1 text-xs text-slate-500">
                    placed warning mark → cell <span className="font-mono">{lastTurnSummary.warningPlaced}</span>
                  </div>
                ) : null}

                {lastFlippedCells.length > 0 ? (
                  <div className="mt-1 text-[11px] text-slate-500">
                    flipped: <span className="font-mono">{lastFlippedCells.join(", ")}</span>
                  </div>
                ) : null}


{controls && lastTurnSummary && Array.isArray(lastTurnSummary.flips) && lastTurnSummary.flips.length > 0 ? (
  <div className="mt-3 rounded-xl border border-slate-200 bg-white/60 px-3 py-2">
    <div className="flex items-center justify-between gap-2">
      <div className="text-[11px] font-semibold text-slate-700">Flip traces</div>
      <div className="text-[11px] text-slate-500">（実況・デバッグ用 / OBSでは通常非表示）</div>
    </div>
    <div className="mt-2 space-y-1">
      {lastTurnSummary.flips.slice(0, 8).map((f, i) => (
        <div key={i} className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-mono">
            {f.to} ← {f.from}{" "}
            {f.kind === "ortho" ? (f.dir ? `(${f.dir})` : "") : f.vert && f.horiz ? `(${f.vert}+${f.horiz})` : "(diag)"}
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

                <div className="mt-2 text-[11px] text-slate-400">
                  phase 2: engine turn summary now available (combo/plus/mark). Next: add edge/formation reasoning with traces.
                </div>
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
