import React from "react";
import { Link, useSearchParams } from "react-router-dom";

import { CardMini } from "@/components/CardMini";
import { readStoredOverlayState, subscribeOverlayState, type OverlayStateV1 } from "@/lib/streamer_bus";

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

export function OverlayPage() {
  const [searchParams] = useSearchParams();
  const controls = searchParams.get("controls") !== "0";
  const bg = searchParams.get("bg");
  const transparent = isTransparentBg(bg);

  const [state, setState] = React.useState<OverlayStateV1 | null>(() => readStoredOverlayState());
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    // keep a small "age" indicator fresh (when controls are on)
    if (!controls) return;
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, [controls]);

  React.useEffect(() => {
    const unsub = subscribeOverlayState((s) => setState(s));
    return () => unsub();
  }, []);

  const rootClass = [
    "min-h-screen",
    transparent ? "bg-transparent" : "bg-gradient-to-b from-rose-50 via-white to-sky-50",
    "text-slate-900",
  ].join(" ");

  const board: any[] = Array.isArray((state as any)?.board) ? ((state as any).board as any[]) : Array.from({ length: 9 }, () => null);

  const title = state?.eventTitle ? state.eventTitle : "Nyano Triad League";
  const sub =
    state?.status?.finished && state?.status?.winner
      ? `Winner: ${state.status.winner}`
      : typeof state?.turn === "number"
        ? `Turn ${state.turn}/9`
        : "Waiting…";

  return (
    <div className={rootClass}>
      <div className={controls ? "container-page" : "p-0"}>
        {controls ? (
          <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800">
                🎥 Overlay · <span className="text-rose-600">{title}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {state?.updatedAtMs ? `Updated ${ageLabel(state.updatedAtMs)} · ` : null}
                {sub}
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
            </div>
          </div>
        ) : null}

        <div className={controls ? "grid gap-4 md:grid-cols-[1fr,320px]" : "grid gap-3 p-4"}>
          <div className="rounded-3xl border border-slate-200 bg-white/75 p-3 shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }, (_, i) => {
                const cell = board[i];
                const owner = cell?.owner;
                const card = cell?.card;

                return (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl border border-slate-200 bg-white/60 p-2 shadow-sm"
                    title={`Cell ${i}`}
                  >
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
              <div className="text-xs font-semibold text-slate-800">✨ Now Playing</div>
              <div className="mt-1 text-sm text-slate-700">{title}</div>
              <div className="mt-1 text-xs text-slate-500">{sub}</div>
            </div>

            {state?.aiNote ? (
              <div className="callout callout-info">
                <div className="text-xs font-semibold">Nyano says</div>
                <div className="mt-1 text-sm">{state.aiNote}</div>
              </div>
            ) : null}

            {state?.error ? (
              <div className="callout callout-warn">
                <div className="text-xs font-semibold">Overlay notice</div>
                <div className="mt-1 text-sm whitespace-pre-wrap">{state.error}</div>
              </div>
            ) : null}

            {!state ? (
              <div className="callout callout-muted">
                <div className="text-xs font-semibold">No signal yet</div>
                <div className="mt-1 text-sm text-slate-700">
                  Open <span className="font-mono">/match</span>, load cards, then start a match.
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
