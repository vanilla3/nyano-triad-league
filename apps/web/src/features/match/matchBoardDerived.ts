import type { CardData, PlayerIndex } from "@nyano/triad-engine";

type WarnUsed = { A: number; B: number };

type ClassicSwapIndices = { aIndex: number; bIndex: number } | null;
export type ClassicOpenIndices = {
  mode: "all_open" | "three_open";
  playerA: readonly number[];
  playerB: readonly number[];
} | null;

export type ClassicOpenPresentation = {
  mode: "all_open" | "three_open";
  playerA: {
    cards: readonly (CardData | null)[];
    openCardIndices: ReadonlySet<number>;
    usedCardIndices: ReadonlySet<number>;
  };
  playerB: {
    cards: readonly (CardData | null)[];
    openCardIndices: ReadonlySet<number>;
    usedCardIndices: ReadonlySet<number>;
  };
} | null;

export function resolveClassicOpenPresentation(input: {
  classicOpenCardIndices: ClassicOpenIndices;
  deckACards: readonly (CardData | null)[];
  deckBCards: readonly (CardData | null)[];
  usedA: ReadonlySet<number>;
  usedB: ReadonlySet<number>;
}): ClassicOpenPresentation {
  if (!input.classicOpenCardIndices) return null;
  return {
    mode: input.classicOpenCardIndices.mode,
    playerA: {
      cards: input.deckACards,
      openCardIndices: new Set<number>(input.classicOpenCardIndices.playerA),
      usedCardIndices: input.usedA,
    },
    playerB: {
      cards: input.deckBCards,
      openCardIndices: new Set<number>(input.classicOpenCardIndices.playerB),
      usedCardIndices: input.usedB,
    },
  };
}

export function resolveAvailableCells(usedCells: ReadonlySet<number>): number[] {
  const out: number[] = [];
  for (let c = 0; c < 9; c++) if (!usedCells.has(c)) out.push(c);
  return out;
}

export function resolveSelectableCells(input: {
  hasCards: boolean;
  turnCount: number;
  isAiTurn: boolean;
  availableCells: readonly number[];
}): Set<number> {
  if (!input.hasCards || input.turnCount >= 9 || input.isAiTurn) return new Set<number>();
  return new Set(input.availableCells);
}

export function resolveEffectiveUsedCardIndices(
  currentUsed: ReadonlySet<number>,
  classicForcedCardIndex: number | null,
): Set<number> {
  const out = new Set<number>(currentUsed);
  if (classicForcedCardIndex !== null) {
    for (let i = 0; i < 5; i++) {
      if (i !== classicForcedCardIndex) out.add(i);
    }
  }
  return out;
}

export function resolveCurrentWarnRemaining(
  currentPlayer: PlayerIndex,
  warnUsed: WarnUsed,
): number {
  return currentPlayer === 0
    ? Math.max(0, 3 - warnUsed.A)
    : Math.max(0, 3 - warnUsed.B);
}

export function formatClassicOpenSlots(indices: readonly number[]): string {
  return indices.map((idx) => String(idx + 1)).join(", ");
}

export function resolveClassicSwapLabel(classicSwapIndices: ClassicSwapIndices): string | null {
  if (!classicSwapIndices) return null;
  return `Classic Swap: A${classicSwapIndices.aIndex + 1} / B${classicSwapIndices.bIndex + 1}`;
}

export function resolveClassicOpenLabel(classicOpenCardIndices: ClassicOpenIndices): string | null {
  if (!classicOpenCardIndices) return null;
  if (classicOpenCardIndices.mode === "all_open") {
    return "Classic Open: all cards revealed";
  }
  return `Classic Three Open: A[${formatClassicOpenSlots(classicOpenCardIndices.playerA)}] / B[${formatClassicOpenSlots(classicOpenCardIndices.playerB)}]`;
}

export function resolveGuestOpponentVisibleCardIndices(
  classicOpenCardIndices: ClassicOpenIndices,
): Set<number> | null {
  if (!classicOpenCardIndices) return null;
  return new Set<number>(classicOpenCardIndices.playerB);
}
