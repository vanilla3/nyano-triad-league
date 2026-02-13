import type { AiDifficulty } from "./nyano_ai";

export type AiAutoMoveDelayOptions = {
  difficulty: AiDifficulty;
  turnIndex: number;
  random?: () => number;
};

const BASE_DELAY_MS = 900;
const TURN_DELAY_STEP_MS = 90;
const MAX_TURN_INDEX = 8;
const JITTER_RANGE_MS = 420;
const MAX_DELAY_MS = 3800;

const DIFFICULTY_BONUS_MS: Record<AiDifficulty, number> = {
  easy: 260,
  normal: 520,
  hard: 860,
  expert: 1200,
};

function clampTurnIndex(turnIndex: number): number {
  if (!Number.isFinite(turnIndex)) return 0;
  const n = Math.trunc(turnIndex);
  return Math.max(0, Math.min(MAX_TURN_INDEX, n));
}

function normalizeRandom(v: number): number {
  if (!Number.isFinite(v)) return 0.5;
  return Math.max(0, Math.min(0.999999, v));
}

/**
 * Compute a human-like delay before auto-committing AI move.
 * - Harder difficulties wait a bit longer.
 * - Later turns wait a bit longer.
 * - Adds jitter so timing does not feel robotic.
 */
export function computeAiAutoMoveDelayMs(opts: AiAutoMoveDelayOptions): number {
  const turn = clampTurnIndex(opts.turnIndex);
  const random = normalizeRandom((opts.random ?? Math.random)());
  const jitter = Math.floor(random * JITTER_RANGE_MS);
  const delay =
    BASE_DELAY_MS +
    DIFFICULTY_BONUS_MS[opts.difficulty] +
    turn * TURN_DELAY_STEP_MS +
    jitter;
  return Math.max(0, Math.min(MAX_DELAY_MS, delay));
}

