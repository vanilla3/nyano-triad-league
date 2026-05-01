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

  return <span className={["badge", variant].join(" ")}>{eventStatusLabel(props.status)}</span>;
}

function eventStatusLabel(status: string): string {
  if (status === "always") return "常設";
  if (status === "active") return "開催中";
  if (status === "upcoming") return "近日開催";
  if (status === "ended") return "終了";
  return status;
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

function aiDifficultyLabel(v: string): string {
  if (v === "easy") return "やさしい";
  if (v === "normal") return "ふつう";
  return v;
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
    toast.success("コピーしました", label);
  };

  const copySeasonSummary = async () => {
    if (!selectedSeason) return;
    const chunks = [formatSeasonArchiveMarkdown(selectedSeason)];
    if (selectedSeasonProgress) chunks.push(formatSeasonProgressMarkdown(selectedSeasonProgress));
    await writeClipboardText(chunks.join("\n\n"));
    toast.success("コピーしました", "シーズン集計と進行メモ");
  };

  const loadDefaultSettledJson = async () => {
    try {
      const res = await fetch("/game/settled_events.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setSettledImportText(text);
      toast.success("読み込みました", "/game/settled_events.json を取得しました");
    } catch (error: unknown) {
      toast.error("読み込みに失敗しました", error instanceof Error ? error.message : "/game/settled_events.json を取得できませんでした");
    }
  };

  const applySettledImport = () => {
    const text = settledImportText.trim();
    if (!text) {
      toast.warn("取り込みを中止しました", "先に取り込み用JSONを貼り付けてください。");
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
      const message = parsed.issues[0]?.message ?? "有効な取り込み記録が見つかりませんでした。";
      toast.error("取り込みに失敗しました", message);
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
      toast.success("確定ポイントを反映しました", `${applied.updatedCount}件のローカル記録を更新しました。`);
    } else {
      toast.warn("確定ポイントを確認しました", "更新できるローカル記録はありませんでした。");
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
            <span>挑戦ボード</span>
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
        <div className="mint-game-page-scoreboard" aria-label="イベント概要">
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
                集計をコピー
              </button>
              <button
                className="btn"
                onClick={() => {
                  if (!window.confirm("すべてのローカル挑戦記録を削除しますか？")) return;
                  clearAllEventAttempts();
                  setRefresh((v) => v + 1);
                  toast.success("削除しました", "すべてのローカル挑戦記録を消しました");
                }}
                disabled={seasonArchive.length === 0}
              >
                ローカル記録を全削除
              </button>
            </div>
          </div>

          <div className="card-bd grid gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-700">確定ポイント取り込み（ローカル）</div>
                  <div className="text-[11px] text-slate-500">
                    確定イベントの高速取り込みと、署名検証付き記録の取り込みを切り替えて適用できます。
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn" onClick={() => void loadDefaultSettledJson()}>
                    /game/settled_events.json を読み込む
                  </button>
                  <button className="btn" onClick={applySettledImport}>
                    JSONを適用
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      setSettledImportText("");
                      setSettledImportReport(null);
                    }}
                  >
                    入力をクリア
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
                  確定イベント（高速）
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
                  検証済み記録（ドメイン + 署名）
                </button>
              </div>
              <textarea
                className="mt-2 h-28 w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-[11px] text-slate-700"
                placeholder={
                  settledImportMode === "verified_records"
                    ? '{"domain":{"chainId":8453,"verifyingContract":"0x..."}, "records":[{"transcript":...,"settled":...,"signatureA":"0x...","signatureB":"0x..."}]}'
                    : '{"settledEvents":[...]} または [{"matchId":"0x...","pointsDeltaA":...}]'
                }
                value={settledImportText}
                onChange={(e) => setSettledImportText(e.target.value)}
                spellCheck={false}
              />
              {settledImportReport ? (
                <div className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-600">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>入力 {settledImportReport.inputCount}</span>
                    <span>有効 {settledImportReport.validCount}</span>
                    <span>更新 {settledImportReport.updatedCount}</span>
                    <span>一致 {settledImportReport.matchedCount}</span>
                    <span>変更なし {settledImportReport.unchangedCount}</span>
                    <span>ローカル未発見 {settledImportReport.noLocalAttemptCount}</span>
                    <span>不一致 {settledImportReport.mismatchCount}</span>
                  </div>
                  {settledImportReport.issues.length > 0 ? (
                    <div className="mt-1 text-[10px] text-amber-700">
                      注意: {settledImportReport.issues.slice(0, 3).map((issue) => issue.message).join(" | ")}
                      {settledImportReport.issues.length > 3 ? ` | ... +${settledImportReport.issues.length - 3}` : ""}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {seasonArchive.length === 0 || !selectedSeason ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                まだローカルアーカイブがありません。イベントをプレイして、リプレイ画面で保存するとここに集計されます。
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
                        シーズン {s.seasonId}
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-2 md:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">挑戦回数</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">{selectedSeason.totalAttempts}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">勝ち / 負け</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedSeason.totalWins} / {selectedSeason.totalLosses}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">勝率</div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">{formatPercent(selectedSeason.winRatePercent)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">最新</div>
                    <div className="mt-1 text-xs font-mono text-slate-700">{selectedSeason.latestAttemptAt ?? "—"}</div>
                  </div>
                </div>

                {selectedSeasonProgress ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-700">ローカルシーズンポイント（仮）</div>
                      <span className="badge badge-nyano">{selectedSeasonProgress.currentTier.label}</span>
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-4">
                      <div>
                        <div className="text-[11px] text-slate-500">ポイント</div>
                        <div className="text-sm font-semibold text-slate-800">{selectedSeasonProgress.totalPoints}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">クリア数</div>
                        <div className="text-sm font-semibold text-slate-800">{selectedSeasonProgress.clearCount}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">次のランク</div>
                        <div className="text-sm font-semibold text-slate-800">
                          {selectedSeasonProgress.nextTier ? selectedSeasonProgress.nextTier.label : "最高ランク"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">次まで</div>
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
                      内訳: 確定ポイント {selectedSeasonProgress.pointsDeltaEvents} / 仮ポイント {selectedSeasonProgress.provisionalEvents}
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      ルール: 勝ち +{selectedSeasonProgress.scoringRule.winPoints} / 負け +{selectedSeasonProgress.scoringRule.lossPoints} / イベントクリア +
                      {selectedSeasonProgress.scoringRule.clearBonusPoints}
                    </div>
                    {selectedSeasonProgress.nextTier ? (
                      <div className="mt-1 text-[11px] text-slate-500">
                        報酬ヒント: {selectedSeasonProgress.nextTier.rewardHint}
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-slate-500">
                        報酬ヒント: {selectedSeasonProgress.currentTier.rewardHint}
                      </div>
                    )}
                  </div>
                ) : null}

                {selectedSeasonProgress ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-xs font-semibold text-slate-700">シーズンポイント表（ローカル仮集計）</div>
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
                            <span className="font-semibold text-slate-800">{entry.points}ポイント</span>
                            {entry.pointsSource === "points_delta" ? (
                              <span className="badge badge-sky">確定差分</span>
                            ) : (
                              <span className="badge badge-slate">仮集計</span>
                            )}
                            <span>
                              勝敗 {entry.wins}/{entry.losses}
                            </span>
                            {entry.pointsSource === "provisional" && entry.pointsDeltaTotal !== null ? (
                              <span>差分反映 {entry.pointsDeltaCoveragePercent.toFixed(0)}%</span>
                            ) : null}
                            {entry.clearAchieved ? <span className="badge badge-emerald">クリア</span> : null}
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
                              最新リプレイ
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span>挑戦: <span className="font-medium text-slate-800">{eventSummary.attemptCount}</span></span>
                        <span>勝ち/負け: <span className="font-medium text-slate-800">{eventSummary.winCount}/{eventSummary.lossCount}</span></span>
                        <span>勝率: <span className="font-medium text-slate-800">{formatPercent(eventSummary.winRatePercent)}</span></span>
                        <span>最高盤面差: <span className="font-medium text-slate-800">{eventSummary.bestTileDiff ?? "—"}</span></span>
                        <span>A側ポイント差分: <span className="font-medium text-slate-800">{eventSummary.pointsDeltaTotal ?? "—"}</span></span>
                        <span>差分反映: <span className="font-medium text-slate-800">{eventSummary.pointsDeltaCoveragePercent.toFixed(1)}%</span></span>
                        <span>最新: <span className="font-mono text-slate-700">{eventSummary.latestAttemptAt ?? "—"}</span></span>
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
                    <div className="text-[11px] text-slate-500">ルール</div>
                    <div className="mt-1 font-mono text-xs">{e.rulesetKey}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">シーズン</div>
                    <div className="mt-1 font-mono text-xs">{e.seasonId}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">先攻</div>
                    <div className="mt-1 font-mono text-xs">{e.firstPlayer === 0 ? "A先攻" : "B先攻"}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="text-[11px] text-slate-500">AIの強さ</div>
                    <div className="mt-1 font-mono text-xs">{aiDifficultyLabel(e.aiDifficulty)}</div>
                  </div>
                </div>

                {e.deckRestriction && (
                  <div className="flex items-center gap-2">
                    <span className="badge badge-sky">{parseDeckRestriction(e.deckRestriction).label}</span>
                    <span className="text-[11px] text-slate-500">{parseDeckRestriction(e.deckRestriction).description}</span>
                  </div>
                )}

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  NyanoデッキのトークンID: <span className="font-mono">{e.nyanoDeckTokenIds.join(", ")}</span>
                </div>

                {(() => {
                  void refresh;
                  const attempts = listEventAttempts(e.id);
                  if (attempts.length === 0) {
                    return (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        私の足跡: まだ記録がありません。リプレイ画面で「保存」するとここに表示されます。
                      </div>
                    );
                  }

                  const bestId = findBestAttemptId(attempts);

                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-medium text-slate-600">私の足跡 ({attempts.length})</div>
                        <button
                          className="btn"
                          onClick={() => {
                            if (!window.confirm("このイベントのローカル挑戦記録を削除しますか？")) return;
                            clearEventAttempts(e.id);
                            setRefresh((v) => v + 1);
                            toast.success("削除しました", "ローカル挑戦記録を消しました");
                          }}
                        >
                          ローカル記録を削除
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
                                    おすすめ
                                  </span>
                                )}
                              </div>
                              <div className="text-xs">
                                勝者: <span className="font-medium">{winnerLabel(a.winner)}</span> ・ 盤面 A:{a.tilesA}/B:{a.tilesB}
                                {a.winner === 0 && <span className="ml-1 text-emerald-600 font-medium">勝利</span>}
                                {typeof a.pointsDeltaA === "number" ? (
                                  <span className="ml-1 rounded-full border border-sky-300 bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                                    A側差分 {a.pointsDeltaA}
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">対戦ID: {a.matchId}</div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <a className="btn no-underline" href={a.replayUrl} target="_blank" rel="noreferrer">
                                開く
                              </a>
                              <button className="btn" onClick={() => void copyWithToast("リプレイURL", a.replayUrl)}>
                                コピー
                              </button>
                              <button
                                className="btn"
                                onClick={() => {
                                  if (!window.confirm("この挑戦記録をローカル保存から削除しますか？")) return;
                                  deleteEventAttempt(e.id, a.id);
                                  setRefresh((v) => v + 1);
                                  toast.success("削除しました", "挑戦記録");
                                }}
                              >
                                削除
                              </button>
                            </div>
                          </div>
                          );
                        })}
                        {attempts.length > 5 ? <div className="text-[11px] text-slate-500">ほか {attempts.length - 5} 件</div> : null}
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
            <li>イベントを増やす場合は <span className="font-mono">apps/web/src/lib/events.ts</span> に追記します。</li>
            <li>“公式Nyanoデッキ” は後で差し替え可能ですが、イベントIDはできるだけ固定してください（共有リンクのため）。</li>
            <li>将来オンチェーン提出をする場合、Nyanoデッキの所有者（B側プレイヤー）問題が出ます（ERC-6551/1271設計へ）。</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

