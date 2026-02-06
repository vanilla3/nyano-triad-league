import type { CardData, Edges, NyanoOnchainTrait, NyanoTraitDerivationConfigV1, TraitType } from "./types.js";

/**
 * Default "Nyano on-chain trait -> game TraitType" derivation config (v1).
 *
 * Rationale:
 * - Common/Uncommon: Season expresses the "element" feel (Wind/Flame/Earth/Aqua).
 * - Rare: Class expresses the "material/alignment" feel (Light/Metal/Cosmic/Forest/Shadow).
 * - SuperRare: Thunder (debuff / storm)
 * - Legendary: Cosmic (corner mastery)
 *
 * Community can fork/tune this mapping by proposing a new ruleset.
 */
export const DEFAULT_NYANO_TRAIT_DERIVATION_CONFIG_V1: NyanoTraitDerivationConfigV1 = {
  enabled: true,
  scheme: "nyanoTrait_v1",

  // seasonId: 1=Spring, 2=Summer, 3=Autumn, 4=Winter
  seasonTrait: ["wind", "flame", "earth", "aqua"],

  // classId: 1=Fabric, 2=Metal, 3=Acrylic, 4=Paper, 5=Secret
  classTrait: ["light", "metal", "cosmic", "forest", "shadow"],

  // rarity: 1=Common, 2=Uncommon, 3=Rare, 4=SuperRare, 5=Legendary
  raritySource: ["season", "season", "class", "fixed", "fixed"],
  fixedTrait: ["none", "none", "none", "thunder", "cosmic"],
};

export interface NyanoCombatStats {
  hp: number;
  atk: number;
  matk: number;
  def: number;
  mdef: number;
  agi: number;
}

/**
 * Nyano on-chain triad struct.
 * Note: the on-chain order is {up,right,left,down}; engine Edges is {up,right,down,left}.
 */
export interface NyanoTriad {
  up: number;
  right: number;
  left: number;
  down: number;
}

const assertArrayLen = (arr: unknown[], n: number, name: string): void => {
  if (arr.length !== n) throw new Error(`${name} must have length ${n} (got ${arr.length})`);
};

const assertInRange = (v: number, min: number, max: number, name: string): void => {
  if (!Number.isInteger(v) || v < min || v > max) throw new Error(`${name} out of range: ${v} (expected ${min}..${max})`);
};

export const sumCombatStats = (s: NyanoCombatStats): number => s.hp + s.atk + s.matk + s.def + s.mdef + s.agi;

/**
 * Derive game-side TraitType from Nyano Peace on-chain trait (v1).
 */
export function deriveTraitTypeFromNyanoTraitV1(
  trait: NyanoOnchainTrait,
  config: NyanoTraitDerivationConfigV1 = DEFAULT_NYANO_TRAIT_DERIVATION_CONFIG_V1
): TraitType {
  if (!config.enabled) return "none";
  if (config.scheme !== "nyanoTrait_v1") throw new Error(`Unsupported derivation scheme: ${config.scheme}`);

  assertInRange(trait.classId, 1, 5, "classId");
  assertInRange(trait.seasonId, 1, 4, "seasonId");
  assertInRange(trait.rarity, 1, 5, "rarity");

  assertArrayLen(config.seasonTrait, 4, "seasonTrait");
  assertArrayLen(config.classTrait, 5, "classTrait");
  assertArrayLen(config.raritySource, 5, "raritySource");
  assertArrayLen(config.fixedTrait, 5, "fixedTrait");

  const r = trait.rarity - 1;
  const source = config.raritySource[r];

  if (source === "season") {
    const t = config.seasonTrait[trait.seasonId - 1] ?? "none";
    return t;
  }
  if (source === "class") {
    const t = config.classTrait[trait.classId - 1] ?? "none";
    return t;
  }
  if (source === "fixed") {
    const t = config.fixedTrait[r] ?? "none";
    return t;
  }

  // Exhaustive check guard.
  const _never: never = source;
  return _never;
}

export function toEdgesFromNyanoTriad(t: NyanoTriad): Edges {
  // Defensive range checks (engine expects 0..10 but Nyano uses 1..10).
  assertInRange(t.up, 1, 10, "triad.up");
  assertInRange(t.right, 1, 10, "triad.right");
  assertInRange(t.left, 1, 10, "triad.left");
  assertInRange(t.down, 1, 10, "triad.down");

  return { up: t.up, right: t.right, down: t.down, left: t.left };
}

/**
 * Helper for indexers / backends:
 * Create CardData from Nyano on-chain reads.
 */
export function makeCardDataFromNyano(input: {
  tokenId: bigint;
  triad: NyanoTriad;
  jankenHand: 0 | 1 | 2;
  combatStats: NyanoCombatStats;
  trait: NyanoOnchainTrait;
  derivationConfig?: NyanoTraitDerivationConfigV1;
}): CardData {
  const traitType = deriveTraitTypeFromNyanoTraitV1(input.trait, input.derivationConfig ?? DEFAULT_NYANO_TRAIT_DERIVATION_CONFIG_V1);

  return {
    tokenId: input.tokenId,
    edges: toEdgesFromNyanoTriad(input.triad),
    jankenHand: input.jankenHand,
    combatStatSum: sumCombatStats(input.combatStats),
    trait: traitType,
  };
}
