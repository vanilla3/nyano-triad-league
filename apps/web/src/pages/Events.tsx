import React from "react";
import { useToast } from "@/components/Toast";
import { Link, useSearchParams } from "react-router-dom";
import { GlassPanel } from "@/components/mint/GlassPanel";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintIcon, type MintIconName } from "@/components/mint/icons/MintIcon";

import { EVENTS, formatEventPeriod, getEventStatus } from "@/lib/events";
import { parseDeckRestriction } from "@/lib/deck_restriction";
import {
  clearAllEventAttempts,
  clearEventAttempts,
  deleteEventAttempt,
  listAllEventAttempts,
  listEventAttempts,
  upsertEventAttempt,
} from "@/lib/event_attempts";
import { writeClipboardText } from "@/lib/clipboard";
import { buildSeasonArchiveSummaries, formatSeasonArchiveMarkdown } from "@/lib/season_archive";
import { buildSeasonProgressSummary, formatSeasonProgressMarkdown } from "@/lib/season_progress";
import {
  applySettledPointsToAttempts,
  parseVerifiedLadderRecordsImportJson,
  parseSettledPointsImportJson,
  type SettledPointsImportIssue,
} from "@/lib/settled_points_import";
import { appendThemeToPath, resolveAppTheme } from "@/lib/theme";

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

type SettledImportUiReport = {
  inputCount: number;
  validCount: number;
  updatedCount: number;
  matchedCount: number;
  unchangedCount: number;
  noLocalAttemptCount: number;
  mismatchCount: number;
  issues: SettledPointsImportIssue[];
};

type SettledImportMode = "settled_events" | "verified_records";

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
  const [searchParams] = useSearchParams();
  const theme = resolveAppTheme(searchParams);
  const isMintTheme = theme === "mint";
  const [refresh, setRefresh] = React.useState(0);
  const [selectedSeasonId, setSelectedSeasonId] = React.useState<number | null>(null);
  const [settledImportMode, setSettledImportMode] = React.useState<SettledImportMode>("settled_events");
  const [settledImportText, setSettledImportText] = React.useState("");
  const [settledImportReport, setSettledImportReport] = React.useState<SettledImportUiReport | null>(null);
  const toast = useToast();
  const themed = React.useCallback((to: string) => appendThemeToPath(to, theme), [theme]);
  const quickActions = React.useMemo<Array<{ to: string; label: string; subtitle: string; icon: MintIconName }>>(
    () => [
      { to: themed("/arena"), label: "Arena", subtitle: "Battle modes", icon: "arena" },
      { to: themed("/decks"), label: "Decks", subtitle: "Build loadouts", icon: "decks" },
      { to: themed("/replay"), label: "Replay", subtitle: "Watch matches", icon: "replay" },
      { to: themed("/stream"), label: "Stream", subtitle: "Host tools", icon: "stream" },
    ],
    [themed],
  );

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
  const eventStatusSummary = React.useMemo(() => {
    let active = 0;
    let upcoming = 0;
    let archived = 0;
    for (const event of EVENTS) {
      const status = getEventStatus(event);
      if (status === "active" || status === "always") {
        active += 1;
      } else if (status === "upcoming") {
        upcoming += 1;
      } else {
        archived += 1;
      }
    }
    return { active, upcoming, archived };
  }, []);
  const localAttemptCount = React.useMemo(
    () => seasonArchive.reduce((total, season) => total + season.totalAttempts, 0),
    [seasonArchive],
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

  const loadDefaultSettledJson = async () => {
    try {
      const res = await fetch("/game/settled_events.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setSettledImportText(text);
      toast.success("Loaded", "Fetched /game/settled_events.json");
    } catch (error: unknown) {
      toast.error("Load failed", error instanceof Error ? error.message : "Could not fetch /game/settled_events.json");
    }
  };

  const applySettledImport = () => {
    const text = settledImportText.trim();
    if (!text) {
      toast.warn("Import skipped", "Paste import JSON first.");
      return;
    }

    const parsed = settledImportMode === "verified_records"
      ? parseVerifiedLadderRecordsImportJson(text)
      : parseSettledPointsImportJson(text);
    if (parsed.events.length === 0) {
      setSettledImportReport({
        inputCount: parsed.inputCount,
        validCount: 0,
        updatedCount: 0,
        matchedCount: 0,
        unchangedCount: 0,
        noLocalAttemptCount: 0,
        mismatchCount: 0,
        issues: parsed.issues,
      });
      const message = parsed.issues[0]?.message ?? "No valid import records found.";
      toast.error("Import failed", message);
      return;
    }

    const currentAttempts = listAllEventAttempts();
    const applied = applySettledPointsToAttempts(currentAttempts, parsed.events);

    if (applied.updatedMatchIds.length > 0) {
      const updatedSet = new Set(applied.updatedMatchIds);
      for (const attempt of applied.attempts) {
        if (updatedSet.has(attempt.matchId.toLowerCase())) {
          upsertEventAttempt(attempt);
        }
      }
      setRefresh((v) => v + 1);
    }

    const issues = [...parsed.issues, ...applied.issues];
    setSettledImportReport({
      inputCount: parsed.inputCount,
      validCount: parsed.events.length,
      updatedCount: applied.updatedCount,
      matchedCount: applied.matchedCount,
      unchangedCount: applied.unchangedCount,
      noLocalAttemptCount: applied.noLocalAttemptCount,
      mismatchCount: applied.mismatchCount,
      issues,
    });

    if (applied.updatedCount > 0) {
      toast.success("Settled import applied", `Updated ${applied.updatedCount} local attempt(s).`);
    } else {
      toast.warn("Settled import applied", "No local attempts were updated.");
    }
  };

  return (
    <div className="events-page grid gap-6">
      {isMintTheme ? (
        <section className="mint-events-quicknav" aria-label="Events quick navigation">
          {quickActions.map((action) => (
            <GlassPanel key={action.label} variant="card" className="mint-events-quicknav__card">
              <MintPressable to={action.to} className="mint-events-quicknav__action" fullWidth>
                <MintIcon name={action.icon} size={18} />
                <span className="mint-events-quicknav__label">{action.label}</span>
                <span className="mint-events-quicknav__sub">{action.subtitle}</span>
              </MintPressable>
            </GlassPanel>
          ))}
        </section>
      ) : null}
      {isMintTheme ? (
        <section className="mint-events-summary" aria-label="Events overview">
          <GlassPanel variant="pill" className="mint-events-summary__item">
            <span className="mint-events-summary__label">Active</span>
            <span className="mint-events-summary__value">{eventStatusSummary.active}</span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-events-summary__item">
            <span className="mint-events-summary__label">Upcoming</span>
            <span className="mint-events-summary__value">{eventStatusSummary.upcoming}</span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-events-summary__item">
            <span className="mint-events-summary__label">Local attempts</span>
            <span className="mint-events-summary__value">{localAttemptCount}</span>
          </GlassPanel>
          <GlassPanel variant="pill" className="mint-events-summary__item">
            <span className="mint-events-summary__label">Selected season</span>
            <span className="mint-events-summary__value">
              {selectedSeasonProgress ? `${selectedSeasonProgress.totalPoints} pts` : "No data"}
            </span>
          </GlassPanel>
        </section>
      ) : null}

      <section className="card events-page__hero">
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

      <section className="events-page__content grid gap-3">
        <div className="card events-page__season-card">
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
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-700">Settled points import (local)</div>
                  <div className="text-[11px] text-slate-500">
                    settled event 直取り込みと、署名検証付き ladder records 取り込みを切り替えて適用できます。
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn" onClick={() => void loadDefaultSettledJson()}>
                    Load /game/settled_events.json
                  </button>
                  <button className="btn" onClick={applySettledImport}>
                    Apply import JSON
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      setSettledImportText("");
                      setSettledImportReport(null);
                    }}
                  >
                    Clear input
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                <button
                  className={[
                    "rounded-md border px-2 py-1",
                    settledImportMode === "settled_events"
                      ? "border-nyano-300 bg-nyano-50 text-nyano-700"
                      : "border-slate-200 bg-white text-slate-600",
                  ].join(" ")}
                  onClick={() => setSettledImportMode("settled_events")}
                >
                  Settled events (fast)
                </button>
                <button
                  className={[
                    "rounded-md border px-2 py-1",
                    settledImportMode === "verified_records"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600",
                  ].join(" ")}
                  onClick={() => setSettledImportMode("verified_records")}
                >
                  Verified records (domain + signatures)
                </button>
              </div>
              <textarea
                className="mt-2 h-28 w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-[11px] text-slate-700"
                placeholder={
                  settledImportMode === "verified_records"
                    ? '{"domain":{"chainId":8453,"verifyingContract":"0x..."}, "records":[{"transcript":...,"settled":...,"signatureA":"0x...","signatureB":"0x..."}]}'
                    : '{"settledEvents":[...]} or [{"matchId":"0x...","pointsDeltaA":...}]'
                }
                value={settledImportText}
                onChange={(e) => setSettledImportText(e.target.value)}
                spellCheck={false}
              />
              {settledImportReport ? (
                <div className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-600">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>input {settledImportReport.inputCount}</span>
                    <span>valid {settledImportReport.validCount}</span>
                    <span>updated {settledImportReport.updatedCount}</span>
                    <span>matched {settledImportReport.matchedCount}</span>
                    <span>unchanged {settledImportReport.unchangedCount}</span>
                    <span>no-local {settledImportReport.noLocalAttemptCount}</span>
                    <span>mismatch {settledImportReport.mismatchCount}</span>
                  </div>
                  {settledImportReport.issues.length > 0 ? (
                    <div className="mt-1 text-[10px] text-amber-700">
                      issues: {settledImportReport.issues.slice(0, 3).map((issue) => issue.message).join(" | ")}
                      {settledImportReport.issues.length > 3 ? ` | ... +${settledImportReport.issues.length - 3}` : ""}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

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
                      Source mix: pointsDelta {selectedSeasonProgress.pointsDeltaEvents} / provisional {selectedSeasonProgress.provisionalEvents}
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
                            {entry.pointsSource === "points_delta" ? (
                              <span className="badge badge-sky">delta</span>
                            ) : (
                              <span className="badge badge-slate">provisional</span>
                            )}
                            <span>
                              W/L {entry.wins}/{entry.losses}
                            </span>
                            {entry.pointsSource === "provisional" && entry.pointsDeltaTotal !== null ? (
                              <span>delta coverage {entry.pointsDeltaCoveragePercent.toFixed(0)}%</span>
                            ) : null}
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
                        <span>delta A total: <span className="font-medium text-slate-800">{eventSummary.pointsDeltaTotal ?? "—"}</span></span>
                        <span>delta coverage: <span className="font-medium text-slate-800">{eventSummary.pointsDeltaCoveragePercent.toFixed(1)}%</span></span>
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
            <div key={e.id} className="card events-page__event-card">
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
                                {typeof a.pointsDeltaA === "number" ? (
                                  <span className="ml-1 rounded-full border border-sky-300 bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                                    deltaA {a.pointsDeltaA}
                                  </span>
                                ) : null}
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
                  <Link className="btn btn-primary no-underline" to={themed(`/match?event=${encodeURIComponent(e.id)}&ui=mint`)}>
                    Start (Match)
                  </Link>
                  <Link className="btn no-underline" to={themed("/decks")}>
                    Prepare your deck
                  </Link>
                  <Link className="btn no-underline" to={themed("/replay")}>
                    Watch replays
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="card events-page__memo">
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
