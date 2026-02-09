/**
 * replay_annotations.ts
 *
 * Analyse a completed replay and annotate each move with a quality rating
 * based on the board evaluation delta (from the moving player's perspective).
 */

import type { MatchResultWithHistory, PlayerIndex, BoardCell } from "@nyano/triad-engine";
import { _evaluateBoard } from "./nyano_ai";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type MoveQuality = "Excellent" | "Great" | "Good" | "Neutral" | "Questionable" | "Blunder";

export type QualityDisplayInfo = {
  ja: string;
  en: string;
  color: string;
};

/** Japanese-friendly display labels and Tailwind color classes for each quality level. */
export const QUALITY_DISPLAY: Record<MoveQuality, QualityDisplayInfo> = {
  Excellent:    { ja: "最高",   en: "Excellent",    color: "bg-green-100 text-green-700 border-green-200" },
  Great:        { ja: "好手",   en: "Great",        color: "bg-blue-100 text-blue-700 border-blue-200" },
  Good:         { ja: "堅実",   en: "Good",         color: "bg-teal-100 text-teal-700 border-teal-200" },
  Neutral:      { ja: "普通",   en: "Neutral",      color: "bg-slate-100 text-slate-500 border-slate-200" },
  Questionable: { ja: "疑問手", en: "Questionable",  color: "bg-amber-100 text-amber-700 border-amber-200" },
  Blunder:      { ja: "悪手",   en: "Blunder",      color: "bg-red-100 text-red-700 border-red-200" },
};

export type MoveAnnotation = {
  turnIndex: number;
  player: 0 | 1;
  /** Score delta from the moving player's perspective */
  delta: number;
  quality: MoveQuality;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function classifyDelta(delta: number): MoveQuality {
  if (delta >= 15) return "Excellent";
  if (delta >= 8) return "Great";
  if (delta >= 3) return "Good";
  if (delta >= 0) return "Neutral";
  if (delta >= -5) return "Questionable";
  return "Blunder";
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

/**
 * Walk through `boardHistory` and evaluate each move's impact using
 * the AI heuristic evaluator.
 *
 * @param result  A completed match result with `boardHistory` (length = turns + 1).
 * @param firstPlayer  Which player moved first (0 = A, 1 = B).
 * @returns An annotation for every turn.
 */
export function annotateReplayMoves(
  result: MatchResultWithHistory,
  firstPlayer: 0 | 1,
): MoveAnnotation[] {
  const annotations: MoveAnnotation[] = [];
  const history = result.boardHistory;

  if (!history || history.length < 2) return annotations;

  for (let i = 0; i < result.turns.length; i++) {
    const player = ((firstPlayer + (i % 2)) % 2) as 0 | 1;
    const boardBefore = history[i];
    const boardAfter = history[i + 1];
    if (!boardBefore || !boardAfter) continue;

    const scoreBefore = _evaluateBoard(boardBefore as (BoardCell | null)[], player as PlayerIndex);
    const scoreAfter = _evaluateBoard(boardAfter as (BoardCell | null)[], player as PlayerIndex);
    const delta = scoreAfter - scoreBefore;

    annotations.push({
      turnIndex: i,
      player,
      delta,
      quality: classifyDelta(delta),
    });
  }

  return annotations;
}
