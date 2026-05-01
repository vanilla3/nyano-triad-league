import React from "react";
import { useToast } from "@/components/Toast";
import { Link } from "react-router-dom";
import { MintPageGuide } from "@/components/mint/MintPageGuide";
import { MintPressable } from "@/components/mint/MintPressable";
import { MintTitleText } from "@/components/mint/MintTypography";
import { MintIcon } from "@/components/mint/icons/MintIcon";

import { EVENTS, formatEventPeriod, getEventStatus } from "@/lib/events";
import { MINT_PAGE_GUIDES } from "@/lib/mint_page_guides";
import { NYANO_MINI_IMAGE_URL } from "@/lib/nyano_assets";
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
  const [refresh, setRefresh] = React.useState(0);
  const [selectedSeasonId, setSelectedSeasonId] = React.useState<number | null>(null);
  const [settledImportMode, setSettledImportMode] = React.useState<SettledImportMode>("settled_events");
  const [settledImportText, setSettledImportText] = React.useState("");
  const [settledImportReport, setSettledImportReport] = React.useState<SettledImportUiReport | null>(null);
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

  const activeEvents = EVENTS.filter((event) => {
    const status = getEventStatus(event);
    return status === "active" || status === "always";
  }).length;

  return (
    <div className="events-page mint-game-page">
      <section className="mint-game-page-hero mint-game-page-hero--events events-page__hero">
        <div className="mint-game-page-hero__copy">
          <div className="mint-game-page-kicker">
            <MintIcon name="events" size={16} />
            <span>Challenge Board</span>
          </div>
          <MintTitleText as="h2" className="mint-game-page-hero__title">
            今日の挑戦を選ぼう
          </MintTitleText>
          <p className="mint-game-page-hero__lead">
            ルール固定のイベントに挑んで、勝ち筋をリプレイとして残そう。
          </p>
          <div className="mint-game-page-hero__actions">
            <MintPressable to={`/match?event=${encodeURIComponent(EVENTS[0]?.id ?? "")}&ui=mint`} tone="primary">
              <MintIcon name="match" size={18} />
              <span>挑戦する</span>
            </MintPressable>
            <MintPressable to="/replay?theme=mint" tone="soft">
              <MintIcon name="replay" size={18} />
              <span>足跡を見る</span>
            </MintPressable>
          </div>
        </div>
        <div className="mint-game-page-mascot mint-game-page-mascot--events" aria-hidden="true">
          <img src={NYANO_MINI_IMAGE_URL} alt="" loading="lazy" />
        </div>
        <div className="mint-game-page-scoreboard" aria-label="Event summary">
          <span>
            <strong>{EVENTS.length}</strong>
            挑戦
          </span>
          <span>
            <strong>{activeEvents}</strong>
            開催中
          </span>
          <span>
            <strong>{seasonArchive.length}</strong>
            シーズン記録
          </span>
        </div>
      </section>

      <MintPageGuide spec={MINT_PAGE_GUIDES.events} />

      <section className="grid gap-3">
        <div className="card">
          <div className="card-hd flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-base font-semibold">挑戦の足跡</div>
              <div className="text-xs text-slate-500">保存したリプレイを、シーズンごとに振り返ります</div>
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
                  <Link className="btn btn-primary no-underline" to={`/match?event=${encodeURIComponent(e.id)}&ui=mint`}>
                    挑戦開始
                  </Link>
                  <Link className="btn no-underline" to="/decks">
                    デッキ準備
                  </Link>
                  <Link className="btn no-underline" to="/replay">
                    リプレイを見る
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
