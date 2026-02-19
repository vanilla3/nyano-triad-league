import type { PlayerIndex, Turn } from "@nyano/triad-engine";
import type { StreamCommandV1 } from "@/lib/streamer_bus";

export type StreamCommitTurnResolution = {
  turn: Pick<Turn, "cell" | "cardIndex" | "warningMarkCell">;
  resolvedCardIndex: number;
};

export function resolveStreamCommitTurnFromCommand(input: {
  cmd: StreamCommandV1;
  turnCount: number;
  streamControlledSide: PlayerIndex;
  isVsNyanoAi: boolean;
  currentPlayer: PlayerIndex;
  aiPlayer: PlayerIndex;
  classicForcedCardIndex: number | null;
}): StreamCommitTurnResolution | null {
  const {
    cmd,
    turnCount,
    streamControlledSide,
    isVsNyanoAi,
    currentPlayer,
    aiPlayer,
    classicForcedCardIndex,
  } = input;

  if (cmd.type !== "commit_move_v1") return null;
  if (turnCount >= 9) return null;
  if (cmd.by !== streamControlledSide) return null;
  if (isVsNyanoAi && currentPlayer === aiPlayer) return null;
  if (cmd.forTurn !== turnCount) return null;
  if (cmd.by !== currentPlayer) return null;

  const resolvedCardIndex = classicForcedCardIndex ?? cmd.move.cardIndex;
  return {
    turn: {
      cell: cmd.move.cell,
      cardIndex: resolvedCardIndex,
      warningMarkCell: typeof cmd.move.warningMarkCell === "number"
        ? cmd.move.warningMarkCell
        : undefined,
    },
    resolvedCardIndex,
  };
}

