// Card tier (visual rarity) derived from triad edge sum.
//
// Purely cosmetic: tiers do NOT affect gameplay or the deterministic engine.
// Thresholds are calibrated against the live game index distribution
// (n=9,836 / median 22 / p75 26 / p90 30 / p97 33 / max 39) so that
// S is roughly the top 3%, A the top 10%, B the top 25%.

export type CardTier = "s" | "a" | "b" | "c";

export const CARD_TIER_THRESHOLDS: Record<Exclude<CardTier, "c">, number> = {
  s: 33,
  a: 30,
  b: 26,
};

export type CardTierInfo = {
  tier: CardTier;
  /** Display label (e.g. "S") */
  label: string;
  /** Japanese flavor label for tooltips */
  labelJa: string;
};

const TIER_INFO: Record<CardTier, CardTierInfo> = {
  s: { tier: "s", label: "S", labelJa: "伝説級" },
  a: { tier: "a", label: "A", labelJa: "強力" },
  b: { tier: "b", label: "B", labelJa: "優秀" },
  c: { tier: "c", label: "C", labelJa: "標準" },
};

/** Resolve the visual tier for a card from its triad edge sum (0-40). */
export function resolveCardTier(edgeSum: number): CardTierInfo {
  if (edgeSum >= CARD_TIER_THRESHOLDS.s) return TIER_INFO.s;
  if (edgeSum >= CARD_TIER_THRESHOLDS.a) return TIER_INFO.a;
  if (edgeSum >= CARD_TIER_THRESHOLDS.b) return TIER_INFO.b;
  return TIER_INFO.c;
}

/** Edge sum from individual triad edges (helper for CardData-like shapes). */
export function edgeSumOf(edges: { up: number | bigint; right: number | bigint; down: number | bigint; left: number | bigint }): number {
  return Number(edges.up) + Number(edges.right) + Number(edges.down) + Number(edges.left);
}
