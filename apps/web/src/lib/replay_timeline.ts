export type ReplayPhaseTone = "setup" | "opening" | "mid" | "end" | "final";

export type ReplayPhaseInfo = {
  label: string;
  tone: ReplayPhaseTone;
};

export const REPLAY_PLAYBACK_SPEED_OPTIONS = [0.5, 1, 1.5, 2, 3] as const;

type ReplayPlaybackSpeed = (typeof REPLAY_PLAYBACK_SPEED_OPTIONS)[number];

const DEFAULT_REPLAY_PLAYBACK_SPEED: ReplayPlaybackSpeed = 1;

function asFiniteNumber(input: number, fallback: number): number {
  return Number.isFinite(input) ? input : fallback;
}

function isReplayPlaybackSpeed(speed: number): speed is ReplayPlaybackSpeed {
  return (REPLAY_PLAYBACK_SPEED_OPTIONS as readonly number[]).includes(speed);
}

export function clampReplayStep(step: number, stepMax: number): number {
  const max = Math.max(0, Math.floor(asFiniteNumber(stepMax, 0)));
  const value = Math.floor(asFiniteNumber(step, 0));
  if (value <= 0) return 0;
  if (value >= max) return max;
  return value;
}

export function replayStepProgress(step: number, stepMax: number): number {
  if (stepMax <= 0) return 0;
  const clamped = clampReplayStep(step, stepMax);
  return Math.round((clamped / stepMax) * 100);
}

export function replayStepStatusText(step: number): string {
  return step <= 0 ? "初期盤面" : `${step}手目の後`;
}

export function replayPhaseInfo(step: number, stepMax: number): ReplayPhaseInfo {
  const clamped = clampReplayStep(step, stepMax);
  if (clamped <= 0) return { label: "準備", tone: "setup" };
  if (stepMax <= 0 || clamped >= stepMax) return { label: "終局", tone: "final" };

  const progress = clamped / stepMax;
  if (progress <= 1 / 3) return { label: "序盤", tone: "opening" };
  if (progress <= 2 / 3) return { label: "中盤", tone: "mid" };
  return { label: "終盤", tone: "end" };
}

export function nextReplayAutoplayStep(step: number, stepMax: number): number | null {
  if (stepMax <= 0) return null;
  const clamped = clampReplayStep(step, stepMax);
  if (clamped >= stepMax) return null;
  return clamped + 1;
}

export function normalizeReplayPlaybackSpeed(speed: number): ReplayPlaybackSpeed {
  const value = asFiniteNumber(speed, DEFAULT_REPLAY_PLAYBACK_SPEED);
  if (isReplayPlaybackSpeed(value)) return value;

  let nearest = DEFAULT_REPLAY_PLAYBACK_SPEED;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const option of REPLAY_PLAYBACK_SPEED_OPTIONS) {
    const distance = Math.abs(option - value);
    if (distance < bestDistance) {
      nearest = option;
      bestDistance = distance;
    }
  }
  return nearest;
}
