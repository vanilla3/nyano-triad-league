import React from "react";
import type { PlayerIndex } from "@nyano/triad-engine";
import type { SfxEngine, SfxName } from "@/lib/sfx";

export function resolveBoardAnimationSfxUpdate(input: {
  isAnimating: boolean;
  placedCell: number | null;
  flippedCellCount: number;
  previousFlipCount: number;
  hasChainFlipTrace: boolean;
}): { sounds: SfxName[]; nextFlipCount: number } {
  if (!input.isAnimating) {
    return {
      sounds: [],
      nextFlipCount: input.previousFlipCount,
    };
  }

  const sounds: SfxName[] = [];
  if (input.placedCell !== null && input.previousFlipCount === 0) {
    sounds.push("card_place");
  }
  if (input.flippedCellCount > 0 && input.flippedCellCount !== input.previousFlipCount) {
    sounds.push(input.hasChainFlipTrace ? "chain_flip" : "flip");
  }

  return {
    sounds,
    nextFlipCount: input.flippedCellCount,
  };
}

export function resolveGameEndSfxName(input: {
  turnCount: number;
  simOk: boolean;
  winner: PlayerIndex | "draw" | null;
}): SfxName | null {
  if (input.turnCount < 9 || !input.simOk) return null;
  if (input.winner === "draw" || input.winner === null) return null;
  return input.winner === 0 ? "victory_fanfare" : "defeat_sad";
}

export function resolveValidationErrorSfxName(error: string | null): SfxName | null {
  return error ? "error_buzz" : null;
}

export function useMatchStageSfxEffects(input: {
  sfx: SfxEngine | null;
  boardAnimIsAnimating: boolean;
  boardAnimPlacedCell: number | null;
  boardAnimFlippedCellCount: number;
  hasChainFlipTrace: boolean;
  turnCount: number;
  simOk: boolean;
  winner: PlayerIndex | "draw" | null;
  error: string | null;
}): void {
  const prevFlipCountRef = React.useRef(0);

  React.useEffect(() => {
    if (!input.sfx) return;
    const update = resolveBoardAnimationSfxUpdate({
      isAnimating: input.boardAnimIsAnimating,
      placedCell: input.boardAnimPlacedCell,
      flippedCellCount: input.boardAnimFlippedCellCount,
      previousFlipCount: prevFlipCountRef.current,
      hasChainFlipTrace: input.hasChainFlipTrace,
    });
    for (const sound of update.sounds) {
      input.sfx.play(sound);
    }
    prevFlipCountRef.current = update.nextFlipCount;
  }, [
    input.sfx,
    input.boardAnimIsAnimating,
    input.boardAnimPlacedCell,
    input.boardAnimFlippedCellCount,
    input.hasChainFlipTrace,
  ]);

  React.useEffect(() => {
    if (!input.sfx) return;
    const sound = resolveGameEndSfxName({
      turnCount: input.turnCount,
      simOk: input.simOk,
      winner: input.winner,
    });
    if (!sound) return;
    input.sfx.play(sound);
  }, [input.sfx, input.turnCount, input.simOk, input.winner]);

  React.useEffect(() => {
    if (!input.sfx) return;
    const sound = resolveValidationErrorSfxName(input.error);
    if (!sound) return;
    input.sfx.play(sound);
  }, [input.sfx, input.error]);
}
