export type ReplayHighlightStepPoint = { step: number };

export function resolveNextReplayHighlightStep(
  highlights: readonly ReplayHighlightStepPoint[],
  step: number,
): number | null {
  if (highlights.length === 0) return null;
  const next = highlights.find((highlight) => highlight.step > step);
  return next ? next.step : highlights[0].step;
}

export function resolvePrevReplayHighlightStep(
  highlights: readonly ReplayHighlightStepPoint[],
  step: number,
): number | null {
  if (highlights.length === 0) return null;
  const prev = [...highlights].reverse().find((highlight) => highlight.step < step);
  return prev ? prev.step : highlights[highlights.length - 1].step;
}

export function resolveReplayCurrentHighlightIndex(
  highlights: readonly ReplayHighlightStepPoint[],
  step: number,
): number {
  if (highlights.length === 0) return -1;
  return highlights.findIndex((highlight) => highlight.step === step);
}

export function formatReplayToolbarHighlightStatus(input: {
  highlightCount: number;
  currentHighlightIdx: number;
}): string {
  if (input.highlightCount === 0) return "0 highlights";
  if (input.currentHighlightIdx >= 0) {
    return `${input.currentHighlightIdx + 1}/${input.highlightCount} highlights`;
  }
  return `${input.highlightCount} highlights`;
}
