import { describe, expect, it } from "vitest";
import {
  resolveBoardAnimationSfxUpdate,
  resolveGameEndSfxName,
  resolveValidationErrorSfxName,
} from "@/features/match/useMatchStageSfxEffects";

describe("features/match/useMatchStageSfxEffects", () => {
  it("emits place + chain flip sounds when animation starts with placed cell", () => {
    const result = resolveBoardAnimationSfxUpdate({
      isAnimating: true,
      placedCell: 4,
      flippedCellCount: 2,
      previousFlipCount: 0,
      hasChainFlipTrace: true,
    });
    expect(result).toEqual({
      sounds: ["card_place", "chain_flip"],
      nextFlipCount: 2,
    });
  });

  it("keeps previous flip count when animation is not active", () => {
    const result = resolveBoardAnimationSfxUpdate({
      isAnimating: false,
      placedCell: null,
      flippedCellCount: 0,
      previousFlipCount: 3,
      hasChainFlipTrace: false,
    });
    expect(result).toEqual({
      sounds: [],
      nextFlipCount: 3,
    });
  });

  it("emits normal flip sound when flip count changes without chain", () => {
    const result = resolveBoardAnimationSfxUpdate({
      isAnimating: true,
      placedCell: null,
      flippedCellCount: 1,
      previousFlipCount: 2,
      hasChainFlipTrace: false,
    });
    expect(result).toEqual({
      sounds: ["flip"],
      nextFlipCount: 1,
    });
  });

  it("resolves game end sfx by winner and readiness", () => {
    expect(resolveGameEndSfxName({
      turnCount: 9,
      simOk: true,
      winner: 0,
    })).toBe("victory_fanfare");

    expect(resolveGameEndSfxName({
      turnCount: 9,
      simOk: true,
      winner: 1,
    })).toBe("defeat_sad");

    expect(resolveGameEndSfxName({
      turnCount: 8,
      simOk: true,
      winner: 0,
    })).toBeNull();

    expect(resolveGameEndSfxName({
      turnCount: 9,
      simOk: true,
      winner: "draw",
    })).toBeNull();
  });

  it("resolves validation error sfx only when error exists", () => {
    expect(resolveValidationErrorSfxName("invalid turn")).toBe("error_buzz");
    expect(resolveValidationErrorSfxName(null)).toBeNull();
  });
});
