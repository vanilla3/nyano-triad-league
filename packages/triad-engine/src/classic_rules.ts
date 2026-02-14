import { buildClassicSeed0, classicRandUint } from "./classic_rng.js";
import type {
  ClassicRulesConfigV1,
  MatchHeader,
  PlayerIndex,
  RulesetConfig,
  RulesetConfigV2,
} from "./types.js";

export const DEFAULT_CLASSIC_RULES_CONFIG_V1: ClassicRulesConfigV1 = {
  order: false,
  chaos: false,
  swap: false,
  reverse: false,
  aceKiller: false,
  plus: false,
  same: false,
  typeAscend: false,
  typeDescend: false,
  allOpen: false,
  threeOpen: false,
};

export function isRulesetV2(ruleset: RulesetConfig): ruleset is RulesetConfigV2 {
  return ruleset.version === 2;
}

export function resolveClassicConfig(ruleset: RulesetConfig): ClassicRulesConfigV1 {
  if (!isRulesetV2(ruleset)) return DEFAULT_CLASSIC_RULES_CONFIG_V1;
  return { ...DEFAULT_CLASSIC_RULES_CONFIG_V1, ...ruleset.classic };
}

export type ClassicOpenCardIndices = {
  mode: "all_open" | "three_open";
  playerA: readonly number[];
  playerB: readonly number[];
};

const FULL_HAND_CARD_INDICES = [0, 1, 2, 3, 4] as const;

function remainingCardIndexes(usedCardIndices: ReadonlySet<number>): number[] {
  const out: number[] = [];
  for (let i = 0; i < 5; i++) {
    if (!usedCardIndices.has(i)) out.push(i);
  }
  return out;
}

function pickClassicThreeOpenIndices(seed0: `0x${string}`, player: PlayerIndex): number[] {
  const pool = [...FULL_HAND_CARD_INDICES];
  const picks: number[] = [];
  while (picks.length < 3 && pool.length > 0) {
    const pickAt = classicRandUint(seed0, "three_open", [player, picks.length], pool.length);
    const [picked] = pool.splice(pickAt, 1);
    if (picked !== undefined) picks.push(picked);
  }
  picks.sort((a, b) => a - b);
  return picks;
}

export function resolveClassicForcedCardIndex(params: {
  ruleset: RulesetConfig;
  header: Pick<MatchHeader, "salt" | "playerA" | "playerB" | "rulesetId">;
  turnIndex: number;
  player: PlayerIndex;
  usedCardIndices: ReadonlySet<number>;
}): number | null {
  const classic = resolveClassicConfig(params.ruleset);
  if (!classic.order && !classic.chaos) return null;

  const remaining = remainingCardIndexes(params.usedCardIndices);
  if (remaining.length === 0) return null;

  if (classic.order) return remaining[0];

  const seed0 = buildClassicSeed0(params.header);
  const pick = classicRandUint(seed0, "chaos", [params.turnIndex, params.player], remaining.length);
  return remaining[pick] ?? null;
}

export function resolveClassicOpenCardIndices(params: {
  ruleset: RulesetConfig;
  header: Pick<MatchHeader, "salt" | "playerA" | "playerB" | "rulesetId">;
}): ClassicOpenCardIndices | null {
  const classic = resolveClassicConfig(params.ruleset);
  if (classic.allOpen) {
    return {
      mode: "all_open",
      playerA: [...FULL_HAND_CARD_INDICES],
      playerB: [...FULL_HAND_CARD_INDICES],
    };
  }
  if (!classic.threeOpen) return null;
  const seed0 = buildClassicSeed0(params.header);
  return {
    mode: "three_open",
    playerA: pickClassicThreeOpenIndices(seed0, 0),
    playerB: pickClassicThreeOpenIndices(seed0, 1),
  };
}

export function resolveClassicSwapIndices(params: {
  ruleset: RulesetConfig;
  header: Pick<MatchHeader, "salt" | "playerA" | "playerB" | "rulesetId">;
}): { aIndex: number; bIndex: number } | null {
  const classic = resolveClassicConfig(params.ruleset);
  if (!classic.swap) return null;
  const seed0 = buildClassicSeed0(params.header);
  return {
    aIndex: classicRandUint(seed0, "swap", [0], 5),
    bIndex: classicRandUint(seed0, "swap", [1], 5),
  };
}

export function applyClassicSwapToDecks(deckA: readonly bigint[], deckB: readonly bigint[], swap: { aIndex: number; bIndex: number } | null): {
  deckA: bigint[];
  deckB: bigint[];
} {
  const nextA = [...deckA];
  const nextB = [...deckB];
  if (!swap) return { deckA: nextA, deckB: nextB };

  const aToken = nextA[swap.aIndex];
  const bToken = nextB[swap.bIndex];
  if (aToken === undefined || bToken === undefined) throw new Error("swap index out of range");

  nextA[swap.aIndex] = bToken;
  nextB[swap.bIndex] = aToken;
  return { deckA: nextA, deckB: nextB };
}
