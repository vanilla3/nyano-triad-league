import type {
  CardData,
  FlipTraceV1,
  MatchResultWithHistory,
} from "@nyano/triad-engine";
import type { TurnLogEntry } from "@/components/BoardViewRPG";
import type { FlipTraceArrow } from "@/components/FlipArrowOverlay";
import { flipTracesSummary } from "@/components/flipTraceDescribe";

type MatchPreviewTurn = MatchResultWithHistory["turns"][number];

function resolveMatchLastPreviewTurn(input: {
  simOk: boolean;
  previewTurns: readonly MatchPreviewTurn[];
  turnCount: number;
}): MatchPreviewTurn | null {
  if (!input.simOk || input.turnCount === 0) return null;
  return input.previewTurns[input.turnCount - 1] ?? null;
}

export function resolveMatchLastFlipSummaryText(input: {
  simOk: boolean;
  previewTurns: readonly MatchPreviewTurn[];
  turnCount: number;
  summarizeFlipTraces?: (traces: readonly FlipTraceV1[]) => string;
}): string | null {
  const lastSummary = resolveMatchLastPreviewTurn(input);
  if (!lastSummary?.flipTraces || lastSummary.flipTraces.length === 0) return null;
  const summarizeFlipTraces = input.summarizeFlipTraces ?? flipTracesSummary;
  return summarizeFlipTraces(lastSummary.flipTraces);
}

export function resolveMatchLastFlipTraces(input: {
  useMintUi: boolean;
  simOk: boolean;
  previewTurns: readonly MatchPreviewTurn[];
  turnCount: number;
}): readonly FlipTraceArrow[] | null {
  if (!input.useMintUi) return null;
  const lastSummary = resolveMatchLastPreviewTurn(input);
  if (!lastSummary?.flipTraces || lastSummary.flipTraces.length === 0) return null;
  return lastSummary.flipTraces.map((flipTrace: FlipTraceV1) => ({
    from: Number(flipTrace.from),
    to: Number(flipTrace.to),
    isChain: Boolean(flipTrace.isChain),
    kind: flipTrace.kind === "diag" ? "diag" : "ortho",
    aVal: Number(flipTrace.aVal ?? 0),
    dVal: Number(flipTrace.dVal ?? 0),
    tieBreak: Boolean(flipTrace.tieBreak),
  }));
}

function normalizeRpgJankenHand(value: number | undefined): 0 | 1 | 2 {
  if (value === 1 || value === 2) return value;
  return 0;
}

export function resolveMatchRpgLogEntries(input: {
  simOk: boolean;
  previewTurns: readonly MatchPreviewTurn[];
  cards: Map<bigint, CardData> | null;
}): TurnLogEntry[] {
  if (!input.simOk) return [];
  return input.previewTurns.map((turn) => ({
    turnIndex: turn.turnIndex,
    player: turn.player,
    cell: turn.cell,
    janken: normalizeRpgJankenHand(input.cards?.get(turn.tokenId)?.jankenHand),
    flipCount: turn.flipCount,
  }));
}
