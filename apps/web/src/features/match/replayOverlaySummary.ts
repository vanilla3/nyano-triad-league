import type { TurnSummary } from "@nyano/triad-engine";
import type { OverlayStateV1 } from "@/lib/streamer_bus";
import { turnPlayer } from "@/features/match/matchTurnUtils";

type OverlayLastMove = NonNullable<OverlayStateV1["lastMove"]>;
type OverlayLastTurnSummary = NonNullable<OverlayStateV1["lastTurnSummary"]>;

export function resolveReplayOverlayLastMove(input: {
  last: TurnSummary | null;
  lastIndex: number;
  firstPlayer: 0 | 1;
  turnPlayerFn?: typeof turnPlayer;
}): OverlayLastMove | undefined {
  if (!input.last || typeof input.last.cell !== "number") return undefined;
  const turnPlayerFn = input.turnPlayerFn ?? turnPlayer;
  return {
    turnIndex: input.lastIndex,
    by: turnPlayerFn(input.firstPlayer, input.lastIndex),
    cell: input.last.cell,
    cardIndex: input.last.cardIndex,
    warningMarkCell: typeof input.last.warningPlaced === "number" ? input.last.warningPlaced : null,
  };
}

export function resolveReplayOverlayLastTurnSummary(last: TurnSummary | null): OverlayLastTurnSummary | undefined {
  if (!last) return undefined;
  return {
    flipCount: last.flipCount,
    comboCount: last.comboCount,
    comboEffect: last.comboEffect ?? "none",
    triadPlus: last.appliedBonus?.triadPlus ?? 0,
    ignoreWarningMark: Boolean(last.appliedBonus?.ignoreWarningMark),
    warningTriggered: Boolean(last.warningTriggered),
    warningPlaced: typeof last.warningPlaced === "number" ? last.warningPlaced : null,
    flips: last.flipTraces
      ? last.flipTraces.map((f) => ({
          from: f.from,
          to: f.to,
          isChain: f.isChain,
          kind: f.kind,
          dir: f.dir as "up" | "right" | "down" | "left" | undefined,
          vert: f.vert as "up" | "down" | undefined,
          horiz: f.horiz as "left" | "right" | undefined,
          aVal: f.aVal,
          dVal: f.dVal,
          tieBreak: f.tieBreak,
          winBy: f.winBy,
        }))
      : undefined,
  };
}
