import type { BoardCell, MatchResultWithHistory } from "@nyano/triad-engine";
import type { NyanoReactionInput } from "@/components/NyanoReaction";

type ReplayBoardState = ReadonlyArray<BoardCell | null>;

export function replayBoardEquals(a: ReplayBoardState, b: ReplayBoardState): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ca = a[i];
    const cb = b[i];
    if (ca === null && cb === null) continue;
    if (ca === null || cb === null) return false;
    if (ca.owner !== cb.owner) return false;
    if (String(ca.card?.tokenId) !== String(cb.card?.tokenId)) return false;
  }
  return true;
}

export function resolveReplayBoardDelta(input: {
  boardPrev: ReplayBoardState;
  boardNow: ReplayBoardState;
}): {
  placedCell: number | null;
  flippedCells: number[];
} {
  let placedCell: number | null = null;
  const flippedCells: number[] = [];

  for (let i = 0; i < input.boardNow.length; i++) {
    const prevCell = input.boardPrev[i];
    const nextCell = input.boardNow[i];

    if (prevCell === null && nextCell !== null) {
      placedCell = i;
      continue;
    }
    if (prevCell !== null && nextCell !== null && prevCell.owner !== nextCell.owner) {
      flippedCells.push(i);
    }
  }

  return { placedCell, flippedCells };
}

export function resolveReplayNyanoReactionInput(input: {
  result: MatchResultWithHistory;
  step: number;
}): NyanoReactionInput | null {
  // step: 0 = initial, 1 = after turn 1, ... 9 = finished
  if (input.step <= 0) return null;
  if (!input.result.turns || input.result.turns.length === 0) return null;

  const lastTurnIndex = Math.min(input.step - 1, input.result.turns.length - 1);
  const lastTurn = input.result.turns[lastTurnIndex];
  const boardNow = input.result.boardHistory?.[input.step] ?? input.result.board;

  let tilesA = 0;
  let tilesB = 0;
  for (const cell of boardNow) {
    if (!cell) continue;
    if (cell.owner === 0) tilesA++;
    else tilesB++;
  }

  return {
    flipCount: Number(lastTurn.flipCount ?? 0),
    hasChain: Boolean(lastTurn.flipTraces?.some((trace) => trace.isChain)),
    comboEffect: lastTurn.comboEffect ?? "none",
    warningTriggered: Boolean(lastTurn.warningTriggered),
    tilesA,
    tilesB,
    perspective: null,
    finished: input.step >= 9,
    winner: input.step >= 9 ? input.result.winner : null,
  };
}
