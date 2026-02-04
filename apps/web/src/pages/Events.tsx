import React from "react";
import { Link } from "react-router-dom";

import { EVENTS, formatEventPeriod, getEventStatus } from "@/lib/events";
import { clearEventAttempts, deleteEventAttempt, listEventAttempts } from "@/lib/event_attempts";

function StatusBadge(props: { status: string }) {
  const cls =
    props.status === "active" || props.status === "always"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : props.status === "upcoming"
        ? "border-sky-200 bg-sky-50 text-sky-900"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return <span className={`rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>{props.status}</span>;
}


function formatIsoShort(iso: string): string {
  // "2026-02-04T12:34:56.000Z" -> "2026-02-04 12:34:56Z"
  if (!iso) return "";
  const x = iso.replace("T", " ");
  return x.length >= 20 ? x.slice(0, 19) + "Z" : x;
}

function winnerLabel(w: number): string {
  return w === 0 ? "A" : "B";
}

export function EventsPage() {
  const [refresh, setRefresh] = React.useState(0);

  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">Events</div>
          <div className="text-xs text-slate-500">挑戦 → Replay共有 → 議論、が勝手に回る仕組みを作る</div>
        </div>

        <div className="card-bd grid gap-3 text-sm text-slate-700">
          <p>
            Event は「運営がいなくなっても盛り上がる」ための装置です。まずは off-chain（transcript共有）で成立させ、
            将来オンチェーン提出・ランキングへ段階的に拡張します。
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            ポイント：<span className="font-medium">ルール（rulesetId）</span>と<span className="font-medium">相手（Nyano AI）</span>が固定されると、
            Replay が比較可能になり、自然に議論が起きます。
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        {EVENTS.map((e) => {
          const status = getEventStatus(e);
          return (
            <div key={e.id} className="card">
              <div className="card-hd flex flex-wrap items-center justify-between gap-2">
                <div className="grid gap-1">
                  <div className="text-base font-semibold">{e.title}</div>
                  <div className="text-xs text-slate-500">{e.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  <div className="text-xs text-slate-500">{formatEventPeriod(e)}</div>
                </div>
              </div>

              <div className="card-bd grid gap-3 text-sm text-slate-700">
                <p>{e.description}</p>

                <div className="grid gap-2 md:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">Ruleset</div>
                    <div className="mt-1 font-mono text-xs">{e.rulesetKey}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">Season</div>
                    <div className="mt-1 font-mono text-xs">{e.seasonId}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">First Player</div>
                    <div className="mt-1 font-mono text-xs">{e.firstPlayer === 0 ? "A first" : "B first"}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">AI</div>
                    <div className="mt-1 font-mono text-xs">{e.aiDifficulty}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  Nyano deck tokenIds: <span className="font-mono">{e.nyanoDeckTokenIds.join(", ")}</span>
                </div>

                {(() => {
                  void refresh;
                  const attempts = listEventAttempts(e.id);
                  if (attempts.length === 0) {
                    return (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        My Attempts: none yet. Replay 画面で <span className="font-medium">Save</span> するとここに表示されます。
                      </div>
                    );
                  }

                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-medium text-slate-600">My Attempts ({attempts.length})</div>
                        <button
                          className="btn"
                          onClick={() => {
                            clearEventAttempts(e.id);
                            // trigger re-render for the current page
                            setRefresh((v) => v + 1);
                          }}
                        >
                          Clear local
                        </button>
                      </div>

                      <div className="mt-2 grid gap-2">
                        {attempts.slice(0, 5).map((a) => (
                          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="grid gap-0.5">
                              <div className="text-[11px] text-slate-500">{formatIsoShort(a.createdAt)}</div>
                              <div className="text-xs">
                                winner: <span className="font-medium">{winnerLabel(a.winner)}</span> · tiles A:{a.tilesA}/B:{a.tilesB}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">matchId: {a.matchId}</div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <a className="btn no-underline" href={a.replayUrl} target="_blank" rel="noreferrer">
                                Open
                              </a>
                              <button
                                className="btn"
                                onClick={() => {
                                  deleteEventAttempt(e.id, a.id);
                                  setRefresh((v) => v + 1);
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        {attempts.length > 5 ? <div className="text-[11px] text-slate-500">…and {attempts.length - 5} more</div> : null}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-wrap items-center gap-2">
                  <Link className="btn btn-primary no-underline" to={`/match?event=${encodeURIComponent(e.id)}`}>
                    Start (Match)
                  </Link>
                  <Link className="btn no-underline" to="/decks">
                    Prepare your deck
                  </Link>
                  <Link className="btn no-underline" to="/replay">
                    Watch replays
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="card">
        <div className="card-hd">
          <div className="text-base font-semibold">運用メモ</div>
        </div>
        <div className="card-bd grid gap-2 text-sm text-slate-700">
          <ul className="list-disc pl-6 text-slate-600">
            <li>Event を増やす場合は <span className="font-mono">apps/web/src/lib/events.ts</span> に追記します。</li>
            <li>“公式Nyanoデッキ” は後で差し替え可能ですが、Event ID はできるだけ固定してください（共有リンクのため）。</li>
            <li>将来オンチェーン提出をする場合、Nyanoデッキの所有者（playerB）問題が出ます（ERC-6551/1271設計へ）。</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
