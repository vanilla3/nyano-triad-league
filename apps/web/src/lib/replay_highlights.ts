import type { MatchResultWithHistory } from "@nyano/triad-engine";

export type ReplayHighlightKind = "big_flip" | "chain" | "combo" | "warning";

export type ReplayStepHighlight = {
  step: number;
  kind: ReplayHighlightKind;
  label: string;
};

export type ReplayHighlightSummary = Record<ReplayHighlightKind, number>;

const HIGHLIGHT_KIND_LABELS: Record<ReplayHighlightKind, string> = {
  big_flip: "大量反転",
  chain: "連鎖",
  combo: "コンボ",
  warning: "警告",
};

export function detectReplayHighlights(
  res: Pick<MatchResultWithHistory, "turns">,
): ReplayStepHighlight[] {
  const highlights: ReplayStepHighlight[] = [];
  for (let i = 0; i < res.turns.length; i++) {
    const turn = res.turns[i];
    const step = i + 1;
    const flipCount = Number(turn.flipCount ?? 0);
    const hasChain = Boolean(turn.flipTraces?.some((trace) => trace.isChain));
    const comboEffect = (turn.comboEffect ?? "none") as string;
    const warningTriggered = Boolean(turn.warningTriggered);

    if (flipCount >= 3) {
      highlights.push({ step, kind: "big_flip", label: `${flipCount}枚反転` });
    } else if (hasChain) {
      highlights.push({ step, kind: "chain", label: "連鎖" });
    } else if (comboEffect !== "none") {
      highlights.push({ step, kind: "combo", label: comboEffect });
    }

    if (warningTriggered) {
      highlights.push({ step, kind: "warning", label: "警告!" });
    }
  }
  return highlights;
}

export function summarizeReplayHighlights(
  highlights: ReadonlyArray<ReplayStepHighlight>,
): ReplayHighlightSummary {
  const summary: ReplayHighlightSummary = {
    big_flip: 0,
    chain: 0,
    combo: 0,
    warning: 0,
  };
  for (const highlight of highlights) {
    summary[highlight.kind] += 1;
  }
  return summary;
}

export function replayHighlightKindLabel(kind: ReplayHighlightKind): string {
  return HIGHLIGHT_KIND_LABELS[kind];
}

export function formatReplayWinnerLabel(
  winner: MatchResultWithHistory["winner"] | null | undefined,
): "A" | "B" | "DRAW" {
  if (winner === 0) return "A";
  if (winner === 1) return "B";
  return "DRAW";
}
