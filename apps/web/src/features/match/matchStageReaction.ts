import type {
  BoardState,
  MatchResultWithHistory,
  PlayerIndex,
} from "@nyano/triad-engine";
import {
  pickReactionKind,
  resolveReactionCutInImpact,
  type CutInImpact,
  type NyanoReactionInput,
} from "@/components/NyanoReaction";
import type { AiReasonCode } from "@/lib/ai/nyano_ai";

type MatchPreviewTurn = MatchResultWithHistory["turns"][number];

export function resolveMatchNyanoReactionInput(input: {
  simOk: boolean;
  previewTurns: readonly MatchPreviewTurn[];
  winner: PlayerIndex | "draw" | null;
  turnCount: number;
  boardNow: BoardState;
  perspective?: PlayerIndex | null;
}): NyanoReactionInput | null {
  if (!input.simOk) return null;

  const lastIdx = input.turnCount - 1;
  const lastSummary = lastIdx >= 0 ? input.previewTurns[lastIdx] : null;

  let tilesA = 0;
  let tilesB = 0;
  for (const cell of input.boardNow) {
    if (!cell) continue;
    if (cell.owner === 0) tilesA++;
    else tilesB++;
  }

  return {
    flipCount: lastSummary ? Number(lastSummary.flipCount ?? 0) : 0,
    hasChain: lastSummary?.flipTraces ? lastSummary.flipTraces.some((trace) => trace.isChain) : false,
    comboEffect: lastSummary?.comboEffect ?? "none",
    warningTriggered: Boolean(lastSummary?.warningTriggered),
    tilesA,
    tilesB,
    perspective: input.perspective ?? 0,
    finished: input.turnCount >= 9,
    winner: input.turnCount >= 9 ? input.winner : null,
  };
}

export function resolveMatchNyanoReactionImpact(input: {
  nyanoReactionInput: NyanoReactionInput | null;
  currentAiReasonCode?: AiReasonCode;
}): CutInImpact {
  if (!input.nyanoReactionInput) return "low";
  const kind = pickReactionKind(input.nyanoReactionInput);
  return resolveReactionCutInImpact(kind, input.currentAiReasonCode);
}

export function shouldTriggerStageImpactBurst(input: {
  isEngineFocus: boolean;
  nyanoReactionInput: NyanoReactionInput | null;
  nyanoReactionImpact: CutInImpact;
}): boolean {
  return input.isEngineFocus && input.nyanoReactionInput !== null && input.nyanoReactionImpact === "high";
}

export function resolveStageImpactBurstDurationMs(
  nyanoReactionImpact: CutInImpact,
): number {
  return nyanoReactionImpact === "high" ? 820 : 0;
}

export function resolveBoardImpactBurstState(input: {
  useMintUi: boolean;
  boardAnimIsAnimating: boolean;
  flippedCellCount: number;
  nowMs: number;
  lastBoardImpactAtMs: number;
  cooldownMs?: number;
}): { trigger: boolean; nextLastBoardImpactAtMs: number } {
  if (!input.useMintUi || !input.boardAnimIsAnimating) {
    return { trigger: false, nextLastBoardImpactAtMs: input.lastBoardImpactAtMs };
  }
  if (input.flippedCellCount < 2) {
    return { trigger: false, nextLastBoardImpactAtMs: input.lastBoardImpactAtMs };
  }
  const cooldownMs = input.cooldownMs ?? 1200;
  if (input.nowMs - input.lastBoardImpactAtMs < cooldownMs) {
    return { trigger: false, nextLastBoardImpactAtMs: input.lastBoardImpactAtMs };
  }
  return { trigger: true, nextLastBoardImpactAtMs: input.nowMs };
}

export function resolveBoardImpactBurstDurationMs(): number {
  return 560;
}
