import { getEventStatus, type EventStatus, type EventV1 } from "./events";
import type { EventAttemptV1 } from "./event_attempts";

export type SeasonArchiveEventSummary = {
  eventId: string;
  eventTitle: string;
  status: EventStatus;
  attemptCount: number;
  winCount: number;
  lossCount: number;
  winRatePercent: number;
  bestTileDiff: number | null;
  latestAttemptAt: string | null;
  latestReplayUrl: string | null;
  pointsDeltaTotal: number | null;
  pointsDeltaAttemptCount: number;
  pointsDeltaCoveragePercent: number;
};

export type SeasonArchiveSummary = {
  seasonId: number;
  totalAttempts: number;
  totalWins: number;
  totalLosses: number;
  winRatePercent: number;
  latestAttemptAt: string | null;
  events: SeasonArchiveEventSummary[];
};

function byIsoDesc(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a > b ? -1 : 1;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function ratePercent(win: number, total: number): number {
  if (total <= 0) return 0;
  return round1((win / total) * 100);
}

function summarizeEvent(event: EventV1, attempts: EventAttemptV1[], nowMs: number): SeasonArchiveEventSummary {
  const list = [...attempts].sort((a, b) => byIsoDesc(a.createdAt, b.createdAt));
  const attemptCount = list.length;
  const winCount = list.filter((a) => a.winner === 0).length;
  const lossCount = attemptCount - winCount;
  const bestTileDiff = attemptCount > 0 ? Math.max(...list.map((a) => a.tilesA - a.tilesB)) : null;
  const latest = list[0] ?? null;
  const pointsDeltaValues = list
    .map((a) => a.pointsDeltaA)
    .filter((v): v is number => typeof v === "number" && Number.isInteger(v) && v >= -2147483648 && v <= 2147483647);
  const pointsDeltaAttemptCount = pointsDeltaValues.length;
  const pointsDeltaTotal = pointsDeltaAttemptCount > 0 ? pointsDeltaValues.reduce((sum, v) => sum + v, 0) : null;
  const pointsDeltaCoveragePercent = attemptCount > 0 ? round1((pointsDeltaAttemptCount / attemptCount) * 100) : 0;

  return {
    eventId: event.id,
    eventTitle: event.title,
    status: getEventStatus(event, nowMs),
    attemptCount,
    winCount,
    lossCount,
    winRatePercent: ratePercent(winCount, attemptCount),
    bestTileDiff,
    latestAttemptAt: latest?.createdAt ?? null,
    latestReplayUrl: latest?.replayUrl ?? null,
    pointsDeltaTotal,
    pointsDeltaAttemptCount,
    pointsDeltaCoveragePercent,
  };
}

export function buildSeasonArchiveSummaries(
  events: EventV1[],
  attempts: EventAttemptV1[],
  nowMs: number = Date.now(),
): SeasonArchiveSummary[] {
  const attemptsByEvent = new Map<string, EventAttemptV1[]>();
  for (const attempt of attempts) {
    const list = attemptsByEvent.get(attempt.eventId);
    if (list) list.push(attempt);
    else attemptsByEvent.set(attempt.eventId, [attempt]);
  }

  const eventsBySeason = new Map<number, EventV1[]>();
  for (const event of events) {
    const list = eventsBySeason.get(event.seasonId);
    if (list) list.push(event);
    else eventsBySeason.set(event.seasonId, [event]);
  }

  const seasonIds = [...eventsBySeason.keys()].sort((a, b) => b - a);

  return seasonIds.map((seasonId) => {
    const seasonEvents = eventsBySeason.get(seasonId) ?? [];
    const summaries = seasonEvents.map((event) => summarizeEvent(event, attemptsByEvent.get(event.id) ?? [], nowMs));

    summaries.sort((a, b) => {
      if (a.attemptCount !== b.attemptCount) return b.attemptCount - a.attemptCount;
      const latestCmp = byIsoDesc(a.latestAttemptAt, b.latestAttemptAt);
      if (latestCmp !== 0) return latestCmp;
      return a.eventId.localeCompare(b.eventId);
    });

    const totalAttempts = summaries.reduce((n, s) => n + s.attemptCount, 0);
    const totalWins = summaries.reduce((n, s) => n + s.winCount, 0);
    const totalLosses = totalAttempts - totalWins;
    const latestAttemptAt = summaries.reduce<string | null>((best, s) => (byIsoDesc(best, s.latestAttemptAt) <= 0 ? best : s.latestAttemptAt), null);

    return {
      seasonId,
      totalAttempts,
      totalWins,
      totalLosses,
      winRatePercent: ratePercent(totalWins, totalAttempts),
      latestAttemptAt,
      events: summaries,
    };
  });
}

export function formatSeasonArchiveMarkdown(summary: SeasonArchiveSummary): string {
  const lines: string[] = [];
  lines.push(`### Season ${summary.seasonId} (local archive)`);
  lines.push(`- Attempts: ${summary.totalAttempts}`);
  lines.push(`- Win/Loss: ${summary.totalWins}/${summary.totalLosses}`);
  lines.push(`- Win rate: ${summary.winRatePercent.toFixed(1)}%`);
  lines.push(`- Latest: ${summary.latestAttemptAt ?? "-"}`);
  lines.push("");
  lines.push("| Event | Status | Attempts | Win rate | Best diff | Delta A | Delta cov | Latest |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const event of summary.events) {
    lines.push(
      `| ${event.eventTitle} | ${event.status} | ${event.attemptCount} | ${event.winRatePercent.toFixed(1)}% | ${event.bestTileDiff ?? "-"} | ${event.pointsDeltaTotal ?? "-"} | ${event.pointsDeltaCoveragePercent.toFixed(1)}% | ${event.latestAttemptAt ?? "-"} |`,
    );
  }
  return lines.join("\n");
}
