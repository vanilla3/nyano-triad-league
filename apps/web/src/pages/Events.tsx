import React from "react";
import { useToast } from "@/components/Toast";
import { Link } from "react-router-dom";

import { EVENTS, formatEventPeriod, getEventStatus } from "@/lib/events";
import { parseDeckRestriction } from "@/lib/deck_restriction";
import { clearAllEventAttempts, clearEventAttempts, deleteEventAttempt, listAllEventAttempts, listEventAttempts } from "@/lib/event_attempts";
import { writeClipboardText } from "@/lib/clipboard";
import { buildSeasonArchiveSummaries, formatSeasonArchiveMarkdown } from "@/lib/season_archive";
import { buildSeasonProgressSummary, formatSeasonProgressMarkdown } from "@/lib/season_progress";

function StatusBadge(props: { status: string }) {
  const variant =
    props.status === "active" || props.status === "always"
      ? "badge-emerald"
      : props.status === "upcoming"
        ? "badge-sky"
        : "badge-slate";

  return <span className={["badge", variant].join(" ")}>{props.status}</span>;
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

function formatPercent(v: number): string {
  return `${v.toFixed(1)}%`;
}

/**
 * Determine the "best" attempt for an event.
 * Priority: win (A=0) > tile advantage (tilesA - tilesB) > newest.
 * Returns the attempt ID of the best record, or null if no attempts.
 */
function findBestAttemptId(
  attempts: { id: string; winner: 0 | 1; tilesA: number; tilesB: number; createdAt: string }[],
): string | null {
  if (attempts.length === 0) return null;

  let best = attempts[0];
  for (let i = 1; i < attempts.length; i++) {
    const a = attempts[i];
    const bestIsWin = best.winner === 0;
    const aIsWin = a.winner === 0;

    if (aIsWin && !bestIsWin) { best = a; continue; }
    if (!aIsWin && bestIsWin) continue;

    // Both won or both lost — compare tile advantage
    const bestDiff = best.tilesA - best.tilesB;
    const aDiff = a.tilesA - a.tilesB;
    if (aDiff > bestDiff) { best = a; continue; }
    if (aDiff < bestDiff) continue;

    // Same tile diff — prefer newer
    if (a.createdAt > best.createdAt) { best = a; }
  }

  return best.id;
}

export function EventsPage() {
  const [refresh, setRefresh] = React.useState(0);
  const [selectedSeasonId, setSelectedSeasonId] = React.useState<number | null>(null);
  const toast = useToast();

  const seasonArchive = React.useMemo(() => {
    void refresh;
    return buildSeasonArchiveSummaries(EVENTS, listAllEventAttempts());
  }, [refresh]);

  React.useEffect(() => {
    if (seasonArchive.length === 0) {
      setSelectedSeasonId(null);
      return;
    }
    if (selectedSeasonId === null || !seasonArchive.some((s) => s.seasonId === selectedSeasonId)) {
      setSelectedSeasonId(seasonArchive[0].seasonId);
    }
  }, [seasonArchive, selectedSeasonId]);

  const selectedSeason =
    selectedSeasonId !== null
      ? seasonArchive.find((s) => s.seasonId === selectedSeasonId) ?? seasonArchive[0] ?? null
      : seasonArchive[0] ?? null;
  const selectedSeasonProgress = React.useMemo(
    () => (selectedSeason ? buildSeasonProgressSummary(selectedSeason) : null),
    [selectedSeason],
  );

  const copyWithToast = async (label: string, v: string) => {
    await writeClipboardText(v);
    toast.success("Copied", label);
  };

  const copySeasonSummary = async () => {
    if (!selectedSeason) return;
    const chunks = [formatSeasonArchiveMarkdown(selectedSeason)];
    if (selectedSeasonProgress) chunks.push(formatSeasonProgressMarkdown(selectedSeasonProgress));
    await writeClipboardText(chunks.join("\n\n"));
    toast.success("Copied", "season archive + progress markdown");
  };

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
        <div className="card">
          <div className="card-hd flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-base font-semibold">Season Archive (local)</div>
              <div className="text-xs text-slate-500">ローカル保存された挑戦ログを、season単位で振り返り</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn" onClick={() => void copySeasonSummary()} disabled={!selectedSeason}>
                Copy summary
              </button>
              <button
                className="btn"
                onClick={() => {
                  if (!window.confirm("Clear all local event attempts across all seasons?")) return;
                  clearAllEventAttempts();
                  setRefresh((v) => v + 1);
                  toast.success("Cleared", "all local event attempts");
                }}
                disabled={seasonArchive.length === 0}
              >
                Clear all local
              </button>
            </div>
          </div>

          <div className="card-bd grid gap-3">
            {seasonArchive.length === 0 || !selectedSeason ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                まだローカルアーカイブがありません。Event をプレイして Replay で Save するとここに集計されます。
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {seasonArchive.map((s) => {
                    const active = s.seasonId === selectedSeason.seasonId;
                    return (
                      <button
                        key={s.seasonId}
                        className={[
                          "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "border-nyano-300 bg-nyano-50 text-nyano-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                        ].join(" ")}
                        onClick={() => setSelectedSeasonId(s.seasonId)}
                      >
                        Season {s.seasonId}
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-2 md:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">Attempts</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">{selectedSeason.totalAttempts}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">Win / Loss</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedSeason.totalWins} / {selectedSeason.totalLosses}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">Win rate</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">{formatPercent(selectedSeason.winRatePercent)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">Latest</div>
                    <div className="mt-1 text-xs font-mono text-slate-700">{selectedSeason.latestAttemptAt ?? "—"}</div>
                  </div>
                </div>

                {selectedSeasonProgress ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-700">Local season points (provisional)</div>
                      <span className="badge badge-nyano">{selectedSeasonProgress.currentTier.label}</span>
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-4">
                      <div>
                        <div className="text-[11px] text-slate-500">Points</div>
                        <div className="text-sm font-semibold text-slate-800">{selectedSeasonProgress.totalPoints}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">Clears</div>
                        <div className="text-sm font-semibold text-slate-800">{selectedSeasonProgress.clearCount}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">Next</div>
                        <div className="text-sm font-semibold text-slate-800">
                          {selectedSeasonProgress.nextTier ? selectedSeasonProgress.nextTier.label : "MAX"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">To next</div>
                        <div className="text-sm font-semibold text-slate-800">
                          {selectedSeasonProgress.nextTier ? `+${selectedSeasonProgress.pointsToNextTier}` : "0"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.round(selectedSeasonProgress.progressToNextTier * 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      Rule: Win +{selectedSeasonProgress.scoringRule.winPoints} / Loss +{selectedSeasonProgress.scoringRule.lossPoints} / Event clear +
                      {selectedSeasonProgress.scoringRule.clearBonusPoints}
                    </div>
                    {selectedSeasonProgress.nextTier ? (
                      <div className="mt-1 text-[11px] text-slate-500">
                        Reward hint: {selectedSeasonProgress.nextTier.rewardHint}
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-slate-500">
                        Reward hint: {selectedSeasonProgress.currentTier.rewardHint}
                      </div>
                    )}
                  </div>
                ) : null}

                {selectedSeasonProgress ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-xs font-semibold text-slate-700">Season points board (local provisional)</div>
                    <div className="mt-2 grid gap-1">
                      {selectedSeasonProgress.rankedEvents.map((entry) => (
                        <div
                          key={entry.eventId}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 font-mono text-[11px] text-slate-500">#{entry.rank}</span>
                            <span className="font-medium text-slate-800">{entry.eventTitle}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-800">{entry.points} pts</span>
                            <span>
                              W/L {entry.wins}/{entry.losses}
                            </span>
                            {entry.clearAchieved ? <span className="badge badge-emerald">clear</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2">
                  {selectedSeason.events.map((eventSummary) => (
                    <div key={eventSummary.eventId} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-slate-800">{eventSummary.eventTitle}</div>
                          <StatusBadge status={eventSummary.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {eventSummary.latestReplayUrl ? (
                            <a className="btn no-underline" href={eventSummary.latestReplayUrl} target="_blank" rel="noreferrer">
                              Latest replay
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span>attempts: <span className="font-medium text-slate-800">{eventSummary.attemptCount}</span></span>
                        <span>win/loss: <span className="font-medium text-slate-800">{eventSummary.winCount}/{eventSummary.lossCount}</span></span>
                        <span>win rate: <span className="font-medium text-slate-800">{formatPercent(eventSummary.winRatePercent)}</span></span>
                        <span>best diff: <span className="font-medium text-slate-800">{eventSummary.bestTileDiff ?? "—"}</span></span>
                        <span>latest: <span className="font-mono text-slate-700">{eventSummary.latestAttemptAt ?? "—"}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

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

                {e.deckRestriction && (
                  <div className="flex items-center gap-2">
                    <span className="badge badge-sky">{parseDeckRestriction(e.deckRestriction).label}</span>
                    <span className="text-[11px] text-slate-500">{parseDeckRestriction(e.deckRestriction).description}</span>
                  </div>
                )}

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  Nyano deck tokenIds: <span className="font-mono">{e.nyanoDeckTokenIds.join(", ")}</span>
                </div>

                {(() => {
                  void refresh;
                  const attempts = listEventAttempts(e.id);
                  if (attempts.length === 0) {
                    return (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        My Pawprints 🐾: まだ足跡がありません。Replay 画面で <span className="font-medium">Save</span> するとここに表示されます。
                      </div>
                    );
                  }

                  const bestId = findBestAttemptId(attempts);

                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-medium text-slate-600">My Pawprints 🐾 ({attempts.length})</div>
                        <button
                          className="btn"
                          onClick={() => {
                            if (!window.confirm("Clear all local attempts for this event?")) return;
                            clearEventAttempts(e.id);
                            setRefresh((v) => v + 1);
                            toast.success("Cleared", "local attempts");
                          }}
                        >
                          Clear local
                        </button>
                      </div>

                      <div className="mt-2 grid gap-2">
                        {attempts.slice(0, 5).map((a) => {
                          const isBest = a.id === bestId;
                          return (
                          <div
                            key={a.id}
                            className={[
                              "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2",
                              isBest
                                ? "border-amber-300 bg-amber-50 ring-1 ring-amber-200"
                                : "border-slate-200 bg-slate-50",
                            ].join(" ")}
                          >
                            <div className="grid gap-0.5">
                              <div className="flex items-center gap-2">
                                <div className="text-[11px] text-slate-500">{formatIsoShort(a.createdAt)}</div>
                                {isBest && (
                                  <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                    ⭐ BEST
                                  </span>
                                )}
                              </div>
                              <div className="text-xs">
                                winner: <span className="font-medium">{winnerLabel(a.winner)}</span> · tiles A:{a.tilesA}/B:{a.tilesB}
                                {a.winner === 0 && <span className="ml-1 text-emerald-600 font-medium">WIN</span>}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">matchId: {a.matchId}</div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <a className="btn no-underline" href={a.replayUrl} target="_blank" rel="noreferrer">
                                Open
                              </a>
                              <button className="btn" onClick={() => void copyWithToast("replay url", a.replayUrl)}>
                                Copy
                              </button>
                              <button
                                className="btn"
                                onClick={() => {
                                  if (!window.confirm("Remove this attempt from local storage?")) return;
                                  deleteEventAttempt(e.id, a.id);
                                  setRefresh((v) => v + 1);
                                  toast.success("Removed", "attempt");
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          );
                        })}
                        {attempts.length > 5 ? <div className="text-[11px] text-slate-500">…and {attempts.length - 5} more</div> : null}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-wrap items-center gap-2">
                  <Link className="btn btn-primary no-underline" to={`/match?event=${encodeURIComponent(e.id)}&ui=mint`}>
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
