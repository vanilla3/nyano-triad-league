import type { ClassicRulesConfigV1 } from "@nyano/triad-engine";
import { DEFAULT_CLASSIC_RULES_CONFIG_V1 } from "@nyano/triad-engine";

const CLASSIC_MASK_SWAP = 1 << 0;
const CLASSIC_MASK_REVERSE = 1 << 1;
const CLASSIC_MASK_ACE_KILLER = 1 << 2;
const CLASSIC_MASK_PLUS = 1 << 3;
const CLASSIC_MASK_SAME = 1 << 4;
const CLASSIC_MASK_CARD_SELECTION_SHIFT = 5;
const CLASSIC_MASK_OPEN_RULE_SHIFT = 7;
const CLASSIC_MASK_TYPE_RULE_SHIFT = 9;
const CLASSIC_MASK_TRIPLE = 0b11;
const CLASSIC_MASK_ALLOWED_BITS = (1 << 11) - 1;

type ClassicSelectionMode = "none" | "order" | "chaos";
type ClassicOpenMode = "none" | "allOpen" | "threeOpen";
type ClassicTypeMode = "none" | "typeAscend" | "typeDescend";

function decodeChoice(bits: number): 0 | 1 | 2 {
  if (bits === 1) return 1;
  if (bits === 2) return 2;
  return 0;
}

export function normalizeClassicRulesConfig(
  input?: Partial<ClassicRulesConfigV1> | null,
): ClassicRulesConfigV1 {
  const base: ClassicRulesConfigV1 = {
    ...DEFAULT_CLASSIC_RULES_CONFIG_V1,
    ...(input ?? {}),
  };

  const cardSelection: ClassicSelectionMode = base.order ? "order" : base.chaos ? "chaos" : "none";
  const openMode: ClassicOpenMode = base.allOpen ? "allOpen" : base.threeOpen ? "threeOpen" : "none";
  const typeMode: ClassicTypeMode = base.typeAscend ? "typeAscend" : base.typeDescend ? "typeDescend" : "none";

  return {
    ...base,
    order: cardSelection === "order",
    chaos: cardSelection === "chaos",
    allOpen: openMode === "allOpen",
    threeOpen: openMode === "threeOpen",
    typeAscend: typeMode === "typeAscend",
    typeDescend: typeMode === "typeDescend",
  };
}

export function encodeClassicRulesMask(input: ClassicRulesConfigV1): string {
  const config = normalizeClassicRulesConfig(input);
  let mask = 0;

  if (config.swap) mask |= CLASSIC_MASK_SWAP;
  if (config.reverse) mask |= CLASSIC_MASK_REVERSE;
  if (config.aceKiller) mask |= CLASSIC_MASK_ACE_KILLER;
  if (config.plus) mask |= CLASSIC_MASK_PLUS;
  if (config.same) mask |= CLASSIC_MASK_SAME;

  const cardSelectionBits = config.order ? 1 : config.chaos ? 2 : 0;
  const openRuleBits = config.allOpen ? 1 : config.threeOpen ? 2 : 0;
  const typeRuleBits = config.typeAscend ? 1 : config.typeDescend ? 2 : 0;

  mask |= cardSelectionBits << CLASSIC_MASK_CARD_SELECTION_SHIFT;
  mask |= openRuleBits << CLASSIC_MASK_OPEN_RULE_SHIFT;
  mask |= typeRuleBits << CLASSIC_MASK_TYPE_RULE_SHIFT;

  return mask.toString(36);
}

export function decodeClassicRulesMask(maskText: string | null | undefined): ClassicRulesConfigV1 {
  if (typeof maskText !== "string" || maskText.trim() === "") {
    return { ...DEFAULT_CLASSIC_RULES_CONFIG_V1 };
  }
  const normalized = maskText.trim().toLowerCase();
  if (!/^[0-9a-z]+$/.test(normalized)) {
    return { ...DEFAULT_CLASSIC_RULES_CONFIG_V1 };
  }
  const parsed = Number.parseInt(normalized, 36);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) {
    return { ...DEFAULT_CLASSIC_RULES_CONFIG_V1 };
  }
  const mask = parsed & CLASSIC_MASK_ALLOWED_BITS;

  const cardSelection = decodeChoice((mask >> CLASSIC_MASK_CARD_SELECTION_SHIFT) & CLASSIC_MASK_TRIPLE);
  const openRule = decodeChoice((mask >> CLASSIC_MASK_OPEN_RULE_SHIFT) & CLASSIC_MASK_TRIPLE);
  const typeRule = decodeChoice((mask >> CLASSIC_MASK_TYPE_RULE_SHIFT) & CLASSIC_MASK_TRIPLE);

  return normalizeClassicRulesConfig({
    swap: (mask & CLASSIC_MASK_SWAP) !== 0,
    reverse: (mask & CLASSIC_MASK_REVERSE) !== 0,
    aceKiller: (mask & CLASSIC_MASK_ACE_KILLER) !== 0,
    plus: (mask & CLASSIC_MASK_PLUS) !== 0,
    same: (mask & CLASSIC_MASK_SAME) !== 0,
    order: cardSelection === 1,
    chaos: cardSelection === 2,
    allOpen: openRule === 1,
    threeOpen: openRule === 2,
    typeAscend: typeRule === 1,
    typeDescend: typeRule === 2,
  });
}

export function listClassicRuleTags(input: ClassicRulesConfigV1): string[] {
  const config = normalizeClassicRulesConfig(input);
  const tags: string[] = [];
  if (config.swap) tags.push("swap");
  if (config.reverse) tags.push("reverse");
  if (config.aceKiller) tags.push("aceKiller");
  if (config.plus) tags.push("plus");
  if (config.same) tags.push("same");
  if (config.order) tags.push("order");
  if (config.chaos) tags.push("chaos");
  if (config.allOpen) tags.push("allOpen");
  if (config.threeOpen) tags.push("threeOpen");
  if (config.typeAscend) tags.push("typeAscend");
  if (config.typeDescend) tags.push("typeDescend");
  return tags;
}
