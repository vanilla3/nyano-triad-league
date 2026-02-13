import type { SeasonArchiveEventSummary, SeasonArchiveSummary } from "./season_archive";

export type SeasonRewardTierId = "rookie" | "bronze" | "silver" | "gold" | "legend";

export type SeasonScoringRule = {
  winPoints: number;
  lossPoints: number;
  clearBonusPoints: number;
};

export type SeasonRewardTier = {
  id: SeasonRewardTierId;
  label: string;
  minPoints: number;
  rewardHint: string;
};

export type SeasonEventPointsEntry = {
  rank: number;
  eventId: string;
  eventTitle: string;
  points: number;
  clearAchieved: boolean;
  attempts: number;
  wins: number;
  losses: number;
  winRatePercent: number;
  bestTileDiff: number | null;
  latestAttemptAt: string | null;
};

export type SeasonProgressSummary = {
  totalPoints: number;
  clearCount: number;
  currentTier: SeasonRewardTier;
  nextTier: SeasonRewardTier | null;
  pointsToNextTier: number;
  progressToNextTier: number;
  scoringRule: SeasonScoringRule;
  rankedEvents: SeasonEventPointsEntry[];
};

export const DEFAULT_SEASON_SCORING_RULE: SeasonScoringRule = {
  winPoints: 3,
  lossPoints: 1,
  clearBonusPoints: 2,
};

export const DEFAULT_SEASON_REWARD_TIERS: SeasonRewardTier[] = [
  { id: "rookie", label: "Rookie", minPoints: 0, rewardHint: "Replay badge: First Pawprints" },
  { id: "bronze", label: "Bronze", minPoints: 12, rewardHint: "Overlay title: Bronze Challenger" },
  { id: "silver", label: "Silver", minPoints: 28, rewardHint: "Overlay frame: Silver Streak" },
  { id: "gold", label: "Gold", minPoints: 50, rewardHint: "Replay stamp: Golden Fang" },
  { id: "legend", label: "Legend", minPoints: 80, rewardHint: "Season crest: Legend of Nyano" },
];

function clamp01(v: number): number {
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  return v;
}

function byIsoDesc(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a > b ? -1 : 1;
}

function normalizeRewardTiers(tiers: SeasonRewardTier[]): SeasonRewardTier[] {
  if (tiers.length === 0) return [...DEFAULT_SEASON_REWARD_TIERS];
  const out = [...tiers].sort((a, b) => a.minPoints - b.minPoints || a.id.localeCompare(b.id));
  return out;
}

function eventPoints(eventSummary: SeasonArchiveEventSummary, scoringRule: SeasonScoringRule): { points: number; clearAchieved: boolean } {
  const clearAchieved = eventSummary.winCount > 0;
  const points =
    eventSummary.winCount * scoringRule.winPoints +
    eventSummary.lossCount * scoringRule.lossPoints +
    (clearAchieved ? scoringRule.clearBonusPoints : 0);
  return {
    points,
    clearAchieved,
  };
}

function resolveTiers(totalPoints: number, tiers: SeasonRewardTier[]): {
  currentTier: SeasonRewardTier;
  nextTier: SeasonRewardTier | null;
} {
  const normalized = normalizeRewardTiers(tiers);

  let currentTier = normalized[0];
  let nextTier: SeasonRewardTier | null = null;

  for (const tier of normalized) {
    if (tier.minPoints <= totalPoints) currentTier = tier;
    if (tier.minPoints > totalPoints) {
      nextTier = tier;
      break;
    }
  }

  return { currentTier, nextTier };
}

export function buildSeasonProgressSummary(
  season: SeasonArchiveSummary,
  scoringRule: SeasonScoringRule = DEFAULT_SEASON_SCORING_RULE,
  rewardTiers: SeasonRewardTier[] = DEFAULT_SEASON_REWARD_TIERS,
): SeasonProgressSummary {
  const rankedRaw = season.events.map((eventSummary) => {
    const calc = eventPoints(eventSummary, scoringRule);
    return {
      ...calc,
      eventSummary,
    };
  });

  rankedRaw.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.eventSummary.winCount !== b.eventSummary.winCount) return b.eventSummary.winCount - a.eventSummary.winCount;
    if (a.eventSummary.winRatePercent !== b.eventSummary.winRatePercent) return b.eventSummary.winRatePercent - a.eventSummary.winRatePercent;
    if (a.eventSummary.attemptCount !== b.eventSummary.attemptCount) return b.eventSummary.attemptCount - a.eventSummary.attemptCount;
    const latestCmp = byIsoDesc(a.eventSummary.latestAttemptAt, b.eventSummary.latestAttemptAt);
    if (latestCmp !== 0) return latestCmp;
    return a.eventSummary.eventId.localeCompare(b.eventSummary.eventId);
  });

  const rankedEvents: SeasonEventPointsEntry[] = rankedRaw.map((x, i) => ({
    rank: i + 1,
    eventId: x.eventSummary.eventId,
    eventTitle: x.eventSummary.eventTitle,
    points: x.points,
    clearAchieved: x.clearAchieved,
    attempts: x.eventSummary.attemptCount,
    wins: x.eventSummary.winCount,
    losses: x.eventSummary.lossCount,
    winRatePercent: x.eventSummary.winRatePercent,
    bestTileDiff: x.eventSummary.bestTileDiff,
    latestAttemptAt: x.eventSummary.latestAttemptAt,
  }));

  const totalPoints = rankedEvents.reduce((n, x) => n + x.points, 0);
  const clearCount = rankedEvents.reduce((n, x) => n + (x.clearAchieved ? 1 : 0), 0);
  const { currentTier, nextTier } = resolveTiers(totalPoints, rewardTiers);
  const pointsToNextTier = nextTier ? Math.max(0, nextTier.minPoints - totalPoints) : 0;

  let progressToNextTier = 1;
  if (nextTier) {
    const span = nextTier.minPoints - currentTier.minPoints;
    if (span <= 0) progressToNextTier = 1;
    else progressToNextTier = clamp01((totalPoints - currentTier.minPoints) / span);
  }

  return {
    totalPoints,
    clearCount,
    currentTier,
    nextTier,
    pointsToNextTier,
    progressToNextTier,
    scoringRule,
    rankedEvents,
  };
}

export function formatSeasonProgressMarkdown(progress: SeasonProgressSummary): string {
  const lines: string[] = [];
  lines.push("### Local season progress (provisional)");
  lines.push(`- Points: ${progress.totalPoints}`);
  lines.push(`- Tier: ${progress.currentTier.label}`);
  lines.push(`- Clears: ${progress.clearCount}`);
  if (progress.nextTier) lines.push(`- Next tier: ${progress.nextTier.label} (+${progress.pointsToNextTier})`);
  else lines.push("- Next tier: max reached");
  lines.push(
    `- Rule: Win +${progress.scoringRule.winPoints} / Loss +${progress.scoringRule.lossPoints} / Event clear +${progress.scoringRule.clearBonusPoints}`,
  );
  lines.push("");
  lines.push("| # | Event | Points | W/L | Win rate | Clear |");
  lines.push("| ---: | --- | ---: | ---: | ---: | --- |");
  for (const entry of progress.rankedEvents) {
    lines.push(
      `| ${entry.rank} | ${entry.eventTitle} | ${entry.points} | ${entry.wins}/${entry.losses} | ${entry.winRatePercent.toFixed(1)}% | ${entry.clearAchieved ? "yes" : "no"} |`,
    );
  }
  return lines.join("\n");
}
