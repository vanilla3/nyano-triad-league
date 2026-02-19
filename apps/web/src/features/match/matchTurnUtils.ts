import type {
  PlayerIndex,
  RulesetConfig,
  TranscriptV1,
  Turn,
} from "@nyano/triad-engine";
import { resolveClassicForcedCardIndex } from "@nyano/triad-engine";
import type { DeckV1 } from "@/lib/deck_store";

export function turnPlayer(firstPlayer: PlayerIndex, turnIndex: number): PlayerIndex {
  return ((firstPlayer + (turnIndex % 2)) % 2) as PlayerIndex;
}

export function parseDeckTokenIds(deck: DeckV1 | null): bigint[] {
  if (!deck) return [];
  return deck.tokenIds.map((tokenId) => BigInt(tokenId));
}

export function computeUsed(
  turns: Turn[],
  firstPlayer: PlayerIndex,
): { cells: Set<number>; usedA: Set<number>; usedB: Set<number> } {
  const cells = new Set<number>();
  const usedA = new Set<number>();
  const usedB = new Set<number>();
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    cells.add(turn.cell);
    const player = turnPlayer(firstPlayer, i);
    if (player === 0) usedA.add(turn.cardIndex);
    else usedB.add(turn.cardIndex);
  }
  return { cells, usedA, usedB };
}

export function countWarningMarks(turns: Turn[], firstPlayer: PlayerIndex): { A: number; B: number } {
  let A = 0;
  let B = 0;
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (turn.warningMarkCell === undefined) continue;
    const player = turnPlayer(firstPlayer, i);
    if (player === 0) A++;
    else B++;
  }
  return { A, B };
}

export function fillTurns(
  partial: Turn[],
  firstPlayer: PlayerIndex,
  ruleset: RulesetConfig,
  headerForClassic: Pick<
    TranscriptV1["header"],
    "salt" | "playerA" | "playerB" | "rulesetId"
  >,
): Turn[] {
  const { cells, usedA, usedB } = computeUsed(partial, firstPlayer);

  const remainingCells: number[] = [];
  for (let c = 0; c < 9; c++) if (!cells.has(c)) remainingCells.push(c);

  const remainingA: number[] = [];
  const remainingB: number[] = [];
  for (let i = 0; i < 5; i++) {
    if (!usedA.has(i)) remainingA.push(i);
    if (!usedB.has(i)) remainingB.push(i);
  }

  const out: Turn[] = [...partial];

  for (let i = partial.length; i < 9; i++) {
    const player = turnPlayer(firstPlayer, i);
    const cell = remainingCells.shift();
    if (cell === undefined) throw new Error("no remaining cells (internal)");
    const used = player === 0 ? usedA : usedB;
    const forced = resolveClassicForcedCardIndex({
      ruleset,
      header: headerForClassic,
      turnIndex: i,
      player,
      usedCardIndices: used,
    });

    let cardIndex: number | undefined;
    if (forced !== null) {
      cardIndex = forced;
      if (used.has(cardIndex)) {
        throw new Error(`no remaining forced cardIndex for player ${player}`);
      }
      if (player === 0) {
        const idx = remainingA.indexOf(cardIndex);
        if (idx >= 0) remainingA.splice(idx, 1);
      } else {
        const idx = remainingB.indexOf(cardIndex);
        if (idx >= 0) remainingB.splice(idx, 1);
      }
    } else {
      cardIndex = player === 0 ? remainingA.shift() : remainingB.shift();
    }
    if (cardIndex === undefined) throw new Error(`no remaining cardIndex for player ${player}`);
    out.push({ cell, cardIndex });
    used.add(cardIndex);
  }

  return out;
}
