/**
 * board_advantage.ts
 *
 * Structured board advantage assessment for spectator display.
 * Wraps _evaluateBoard to produce human-readable advantage labels
 * for Overlay, Replay, and TurnLog.
 *
 * Phase 1 "Spectator Experience": 盤面の「優勢/不利」の根拠を短く出す
 */

import type { BoardCell } from "@nyano/triad-engine";
import { _evaluateBoard, _evaluateBoardDetailed, type BoardEvalBreakdown } from "./nyano_ai";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type AdvantageLevel = "dominant" | "strong" | "slight" | "even";

export type BoardAdvantage = {
  /** Raw evaluation score from Player A's perspective (positive = A ahead) */
  scoreA: number;
  /** Advantage level from Player A's perspective */
  levelA: AdvantageLevel;
  /** Advantage level from Player B's perspective */
  levelB: AdvantageLevel;
  /** Short Japanese label for display ("A優勢", "互角", "B圧倒" etc.) */
  labelJa: string;
  /** Tailwind color token for badge styling */
  badgeColor: string;
};

/* ------------------------------------------------------------------ */
/* Thresholds                                                          */
/* ------------------------------------------------------------------ */

const THRESHOLD_DOMINANT = 25;
const THRESHOLD_STRONG = 12;
const THRESHOLD_SLIGHT = 4;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function classifyLevel(absScore: number): AdvantageLevel {
  if (absScore >= THRESHOLD_DOMINANT) return "dominant";
  if (absScore >= THRESHOLD_STRONG) return "strong";
  if (absScore >= THRESHOLD_SLIGHT) return "slight";
  return "even";
}

function resolveDisplay(scoreA: number): { labelJa: string; badgeColor: string } {
  if (scoreA >= THRESHOLD_DOMINANT) return { labelJa: "A圧倒", badgeColor: "emerald" };
  if (scoreA >= THRESHOLD_STRONG) return { labelJa: "A優勢", badgeColor: "emerald" };
  if (scoreA >= THRESHOLD_SLIGHT) return { labelJa: "Aやや有利", badgeColor: "teal" };
  if (scoreA <= -THRESHOLD_DOMINANT) return { labelJa: "B圧倒", badgeColor: "red" };
  if (scoreA <= -THRESHOLD_STRONG) return { labelJa: "B優勢", badgeColor: "amber" };
  if (scoreA <= -THRESHOLD_SLIGHT) return { labelJa: "Bやや有利", badgeColor: "amber" };
  return { labelJa: "互角", badgeColor: "slate" };
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

/**
 * Assess the board advantage from both players' perspectives.
 *
 * @param board  Current board state (length 9, nulls for empty cells).
 * @returns Structured advantage with score, levels, label, and color.
 */
export function assessBoardAdvantage(
  board: (BoardCell | null)[],
): BoardAdvantage {
  const scoreA = _evaluateBoard(board, 0);

  const finalLevelA = scoreA >= THRESHOLD_SLIGHT ? classifyLevel(scoreA) : "even" as AdvantageLevel;
  const finalLevelB = scoreA <= -THRESHOLD_SLIGHT ? classifyLevel(Math.abs(scoreA)) : "even" as AdvantageLevel;

  const { labelJa, badgeColor } = resolveDisplay(scoreA);

  return {
    scoreA,
    levelA: finalLevelA,
    levelB: finalLevelB,
    labelJa,
    badgeColor,
  };
}

/* ------------------------------------------------------------------ */
/* Detailed advantage with reasons — Phase 1 Explainability            */
/* ------------------------------------------------------------------ */

export type AdvantageReasonKey =
  | "tile_lead"
  | "corner_control"
  | "center_control"
  | "edge_superiority"
  | "vulnerability";

export type AdvantageReason = {
  key: AdvantageReasonKey;
  /** Short Japanese label for display */
  labelJa: string;
  /** Short English label for tooltip */
  labelEn: string;
  /** Signed contribution to the total score (positive = favors A) */
  value: number;
};

/** BoardAdvantage with decomposed reason breakdown. */
export type BoardAdvantageDetailed = BoardAdvantage & {
  /** Reasons sorted by |value| descending, filtered to |value| > 1.0 */
  reasons: AdvantageReason[];
  /** The single most impactful reason, or null if no reasons pass threshold */
  topReason: AdvantageReason | null;
};

const REASON_META: Record<
  AdvantageReasonKey,
  { labelJa: string; labelEn: string; extract: (b: BoardEvalBreakdown) => number; threshold: number }
> = {
  tile_lead:        { labelJa: "タイル数リード", labelEn: "Tile lead",       extract: (b) => b.tileDiff,      threshold: 5 },
  corner_control:   { labelJa: "角の支配",       labelEn: "Corner control",  extract: (b) => b.cornerBonus,   threshold: 1 },
  center_control:   { labelJa: "中央支配",       labelEn: "Center control",  extract: (b) => b.centerBonus,   threshold: 1 },
  edge_superiority: { labelJa: "辺の強さ",       labelEn: "Edge strength",   extract: (b) => b.edgeSumBonus,  threshold: 1 },
  vulnerability:    { labelJa: "弱点あり",       labelEn: "Vulnerability",   extract: (b) => b.vulnerability, threshold: 1 },
};

/**
 * Assess board advantage with decomposed reasons for spectator display.
 *
 * Extends assessBoardAdvantage with a `reasons` array showing WHY a player
 * is ahead (tile count, corner control, center, edge strength, vulnerability).
 */
export function assessBoardAdvantageDetailed(
  board: (BoardCell | null)[],
): BoardAdvantageDetailed {
  const base = assessBoardAdvantage(board);
  const breakdown = _evaluateBoardDetailed(board, 0);

  const reasons: AdvantageReason[] = [];
  for (const [key, meta] of Object.entries(REASON_META) as [AdvantageReasonKey, typeof REASON_META[AdvantageReasonKey]][]) {
    const value = meta.extract(breakdown);
    if (Math.abs(value) > meta.threshold) {
      reasons.push({
        key,
        labelJa: meta.labelJa,
        labelEn: meta.labelEn,
        value,
      });
    }
  }

  // Sort by absolute contribution descending
  reasons.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return {
    ...base,
    reasons,
    topReason: reasons.length > 0 ? reasons[0] : null,
  };
}
