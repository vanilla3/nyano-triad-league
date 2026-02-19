import { describe, expect, it } from "vitest";
import {
  resolveAvailableCells,
  resolveClassicOpenLabel,
  resolveClassicOpenPresentation,
  resolveClassicSwapLabel,
  resolveCurrentWarnRemaining,
  resolveEffectiveUsedCardIndices,
  resolveGuestOpponentVisibleCardIndices,
  resolveSelectableCells,
} from "@/features/match/matchBoardDerived";

describe("features/match/matchBoardDerived", () => {
  it("resolves available and selectable cells", () => {
    const available = resolveAvailableCells(new Set([0, 3, 8]));
    expect(available).toEqual([1, 2, 4, 5, 6, 7]);

    const selectable = resolveSelectableCells({
      hasCards: true,
      turnCount: 4,
      isAiTurn: false,
      availableCells: available,
    });
    expect(selectable.size).toBe(6);
    expect(selectable.has(1)).toBe(true);

    const none = resolveSelectableCells({
      hasCards: false,
      turnCount: 4,
      isAiTurn: false,
      availableCells: available,
    });
    expect(none.size).toBe(0);
  });

  it("expands effective used card indices when forced slot exists", () => {
    const currentUsed = new Set<number>([0, 2]);
    const forced = resolveEffectiveUsedCardIndices(currentUsed, 4);
    expect(forced.has(0)).toBe(true);
    expect(forced.has(2)).toBe(true);
    expect(forced.has(4)).toBe(false);
    expect(forced.has(1)).toBe(true);
    expect(forced.has(3)).toBe(true);
  });

  it("computes warning marks remaining", () => {
    expect(resolveCurrentWarnRemaining(0, { A: 1, B: 2 })).toBe(2);
    expect(resolveCurrentWarnRemaining(1, { A: 1, B: 2 })).toBe(1);
    expect(resolveCurrentWarnRemaining(1, { A: 1, B: 5 })).toBe(0);
  });

  it("formats classic labels and visible opponent slots", () => {
    expect(resolveClassicSwapLabel({ aIndex: 1, bIndex: 3 })).toBe("Classic Swap: A2 / B4");
    expect(resolveClassicSwapLabel(null)).toBeNull();

    expect(
      resolveClassicOpenLabel({
        mode: "all_open",
        playerA: [0, 1, 2, 3, 4],
        playerB: [0, 1, 2, 3, 4],
      }),
    ).toBe("Classic Open: all cards revealed");

    expect(
      resolveClassicOpenLabel({
        mode: "three_open",
        playerA: [0, 2, 4],
        playerB: [1, 2, 3],
      }),
    ).toBe("Classic Three Open: A[1, 3, 5] / B[2, 3, 4]");

    const visible = resolveGuestOpponentVisibleCardIndices({
      mode: "three_open",
      playerA: [0, 2, 4],
      playerB: [1, 2, 3],
    });
    expect(visible?.has(1)).toBe(true);
    expect(visible?.has(4)).toBe(false);
    expect(resolveGuestOpponentVisibleCardIndices(null)).toBeNull();
  });

  it("builds classic open presentation for both players", () => {
    const presentation = resolveClassicOpenPresentation({
      classicOpenCardIndices: {
        mode: "three_open",
        playerA: [0, 2, 4],
        playerB: [1, 2, 3],
      },
      deckACards: [null, null, null, null, null],
      deckBCards: [null, null, null, null, null],
      usedA: new Set([0, 1]),
      usedB: new Set([3]),
    });
    expect(presentation?.mode).toBe("three_open");
    expect(presentation?.playerA.openCardIndices.has(2)).toBe(true);
    expect(presentation?.playerA.openCardIndices.has(1)).toBe(false);
    expect(presentation?.playerB.usedCardIndices.has(3)).toBe(true);
  });
});
