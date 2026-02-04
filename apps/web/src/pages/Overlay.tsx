import React from "react";
import { Link, useSearchParams } from "react-router-dom";

import { CardMini } from "@/components/CardMini";
import { readStoredOverlayState, readStoredStreamVoteState, subscribeOverlayState, subscribeStreamVoteState, type OverlayStateV1, type StreamVoteStateV1 } from "@/lib/streamer_bus";

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

export function OverlayPage() {
  const [searchParams] = useSearchParams();
  const controls = searchParams.get("controls") !== "0";
  const bg = searchParams.get("bg");
  const transparent = isTransparentBg(bg);
  const voteEnabled = searchParams.get("vote") !== "0";

  const [state, setState] = React.useState<OverlayStateV1 | null>(() => readStoredOverlayState());
  const [voteState, setVoteState] = React.useState<StreamVoteStateV1 | null>(() => readStoredStreamVoteState());
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
  // keep "age" and vote countdown fresh
  const needTick = controls || voteState?.status === "open";
  if (!needTick) return;
  const t = window.setInterval(() => setTick((x) => x + 1), 500);
  return () => window.clearInterval(t);
}, [controls, voteState?.status]);

  React.useEffect(() => {
    const unsub = subscribeOverlayState((s) => setState(s));
    return () => unsub();
  }, []);

  React.useEffect(() => {
    const unsub = subscribeStreamVoteState((s) => setVoteState(s));
    return () => unsub();
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

const toPlay = React.useMemo(() => {
  if (!state) return null;
  if (state?.status?.finished) return null;
  if (typeof state.turn !== "number") return null;
  if (typeof state.firstPlayer !== "number") return null;
  if (state.turn >= 9) return null;
  const p = ((state.firstPlayer + (state.turn % 2)) % 2) as 0 | 1;
  return p === 0 ? "A" : "B";
}, [state?.updatedAtMs]);

  const lastCell = typeof state?.lastMove?.cell === "number" ? state.lastMove.cell : null;
  const markCell = typeof state?.lastMove?.warningMarkCell === "number" ? state.lastMove.warningMarkCell : null;


const prevOwnersRef = React.useRef<Array<0 | 1 | null>>(Array.from({ length: 9 }, () => null));
const [lastFlipCount, setLastFlipCount] = React.useState<number | null>(null);
const [lastFlippedCells, setLastFlippedCells] = React.useState<number[]>([]);

React.useEffect(() => {
  const b: any[] = Array.isArray((state as any)?.board) ? ((state as any).board as any[]) : [];
  const owners: Array<0 | 1 | null> = Array.from({ length: 9 }, (_, i) => {
    const o = (b[i] as any)?.owner;
    return o === 0 || o === 1 ? (o as 0 | 1) : null;
  });

  const prev = prevOwnersRef.current;
  prevOwnersRef.current = owners;

  if (!state?.lastMove) {
    setLastFlipCount(null);
    setLastFlippedCells([]);
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

        <div className={controls ? "grid gap-4 md:grid-cols-[1fr,340px]" : "grid gap-3 p-4"}>
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
                      <div className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        {i}
                      </div>
                    ) : null}

                    {isLast ? (
                      <div className="absolute right-2 top-2 rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                        ✨
                      </div>
                    ) : null}

                    {isMark ? (
                      <div className="absolute right-2 bottom-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                        !
                      </div>
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
              <div className="mt-1 text-xs text-slate-500">{sub} {toPlay ? (<span className="badge badge-sky">Next: {toPlay}</span>) : null}</div>
              {matchIdShort ? <div className="mt-1 text-[11px] text-slate-400">match: {matchIdShort}</div> : null}
            </div>

            {state?.lastMove ? (
              <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
                <div className="text-xs font-semibold text-slate-800">Last move</div>
                <div className="mt-1 text-sm text-slate-700">
                  Turn {state.lastMove.turnIndex + 1}: <span className="font-semibold">{state.lastMove.by === 0 ? "A" : "B"}</span> placed{" "}
                  <span className="font-mono">#{state.lastMove.cardIndex}</span> at cell <span className="font-mono">{state.lastMove.cell}</span>
                </div>
                {typeof state.lastMove.warningMarkCell === "number" ? (
                  <div className="mt-1 text-xs text-slate-500">
                    warning mark → cell <span className="font-mono">{state.lastMove.warningMarkCell}</span>
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
                    OBS BrowserSource: use <span className="font-mono">/overlay?controls=0</span>
                  </li>
                  <li>
                    Transparent mode: <span className="font-mono">/overlay?controls=0&amp;bg=transparent</span>
                  </li>
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* avoid unused tick warning */}
      <span className="hidden">{tick}</span>
    </div>
  );
}
