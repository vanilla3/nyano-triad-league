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

function remainingCardIndexes(usedCardIndices: ReadonlySet<number>): number[] {
  const out: number[] = [];
  for (let i = 0; i < 5; i++) {
    if (!usedCardIndices.has(i)) out.push(i);
  }
  return out;
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

