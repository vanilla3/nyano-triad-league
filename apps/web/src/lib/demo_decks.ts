// Demo deck generation for Guest Quick Play.
// Uses the Game Index to build decks without any RPC calls.

import type { CardData } from "@nyano/triad-engine";
import type { GameIndexV1, IndexTokenGameParams } from "./nyano/gameIndex";
import { getFromGameIndex, getAllTokenIds } from "./nyano/gameIndex";
import type { DeckV1 } from "./deck_store";

export type DemoDeck = {
  id: string;
  name: string;
  tokenIds: string[];
  description: string;
};

/** Pre-curated demo decks with hand-picked tokenIds for interesting gameplay. */
export const DEMO_DECK_PRESETS: DemoDeck[] = [
  {
    id: "demo-balanced-a",
    name: "Starter Pack A",
    tokenIds: ["1", "2", "3", "4", "5"],
    description: "Balanced mix for beginners",
  },
  {
    id: "demo-balanced-b",
    name: "Starter Pack B",
    tokenIds: ["6", "7", "8", "9", "10"],
    description: "Balanced mix for the opponent",
  },
  {
    id: "demo-high-stats",
    name: "High Stats",
    tokenIds: ["11", "15", "20", "25", "30"],
    description: "Cards with high edge values",
  },
];

/** Pick n random items from an array without replacement. */
function sampleWithout<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

/** Generate a random 5-card demo deck from the game index. */
export function generateRandomDemoDeck(index: GameIndexV1, name?: string): DeckV1 {
  const allIds = getAllTokenIds(index);
  const validIds = allIds.filter((id) => {
    const p = getFromGameIndex(index, id);
    return p !== null;
  });

  const picked = sampleWithout(validIds, 5);

  return {
    id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: name ?? "Random Demo Deck",
    tokenIds: picked,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Compute a score for a token's game params for comparison. */
function tokenScore(p: IndexTokenGameParams): number {
  return p.triad.up + p.triad.right + p.triad.left + p.triad.down;
}

/**
 * Generate a balanced pair of demo decks that have roughly equal total stats.
 * This ensures fair matches for guest play.
 */
export function generateBalancedDemoPair(
  index: GameIndexV1,
): { deckA: DeckV1; deckB: DeckV1 } {
  const allIds = getAllTokenIds(index);
  const validEntries: { id: string; params: IndexTokenGameParams }[] = [];

  for (const id of allIds) {
    const p = getFromGameIndex(index, id);
    if (p) validEntries.push({ id, params: p });
  }

  // Sort by score and pick alternating tokens for balance
  validEntries.sort((a, b) => tokenScore(a.params) - tokenScore(b.params));

  // Pick 10 tokens from the middle range (avoid extremes)
  const midStart = Math.max(0, Math.floor(validEntries.length * 0.3));
  const midEnd = Math.min(validEntries.length, Math.floor(validEntries.length * 0.7));
  const midRange = validEntries.slice(midStart, midEnd);

  const sampled = sampleWithout(midRange, 10);
  // Sort sampled by score and distribute alternating
  sampled.sort((a, b) => tokenScore(a.params) - tokenScore(b.params));

  const aIds: string[] = [];
  const bIds: string[] = [];
  for (let i = 0; i < sampled.length; i++) {
    if (i % 2 === 0) aIds.push(sampled[i].id);
    else bIds.push(sampled[i].id);
  }

  // Ensure we have exactly 5 each
  while (aIds.length < 5) aIds.push(validEntries[Math.floor(Math.random() * validEntries.length)].id);
  while (bIds.length < 5) bIds.push(validEntries[Math.floor(Math.random() * validEntries.length)].id);

  const now = new Date().toISOString();
  return {
    deckA: {
      id: `demo-a-${Date.now()}`,
      name: "Guest Deck A",
      tokenIds: aIds.slice(0, 5),
      createdAt: now,
      updatedAt: now,
    },
    deckB: {
      id: `demo-b-${Date.now()}`,
      name: "Nyano Deck",
      tokenIds: bIds.slice(0, 5),
      createdAt: now,
      updatedAt: now,
    },
  };
}

/**
 * Build CardData objects from game index params for fast (offline) play.
 * This avoids RPC calls entirely.
 */
export function buildCardDataFromIndex(
  index: GameIndexV1,
  tokenIds: string[],
): Map<bigint, CardData> {
  const cards = new Map<bigint, CardData>();

  for (const id of tokenIds) {
    const p = getFromGameIndex(index, id);
    if (!p) continue;

    const tokenId = BigInt(id);
    const combatStatSum = p.combat.hp + p.combat.atk + p.combat.matk + p.combat.def + p.combat.mdef + p.combat.agi;

    const card: CardData = {
      tokenId,
      edges: { up: p.triad.up, right: p.triad.right, down: p.triad.down, left: p.triad.left },
      jankenHand: p.hand,
      combatStatSum,
      trait: "none",
    };

    cards.set(tokenId, card);
  }

  return cards;
}

export interface EmergencyGuestFallbackData {
  deckATokenIds: bigint[];
  deckBTokenIds: bigint[];
  cardsByTokenId: Map<bigint, CardData>;
}

type EmergencySeed = {
  tokenId: bigint;
  hand: 0 | 1 | 2;
  edges: [up: number, right: number, down: number, left: number];
  combatStatSum: number;
};

const EMERGENCY_DECK_A: readonly EmergencySeed[] = [
  { tokenId: 910001n, hand: 0, edges: [6, 4, 7, 5], combatStatSum: 348 },
  { tokenId: 910002n, hand: 1, edges: [4, 7, 5, 6], combatStatSum: 332 },
  { tokenId: 910003n, hand: 2, edges: [7, 5, 6, 4], combatStatSum: 336 },
  { tokenId: 910004n, hand: 0, edges: [5, 6, 4, 7], combatStatSum: 330 },
  { tokenId: 910005n, hand: 1, edges: [6, 6, 5, 5], combatStatSum: 342 },
];

const EMERGENCY_DECK_B: readonly EmergencySeed[] = [
  { tokenId: 920001n, hand: 2, edges: [5, 7, 6, 4], combatStatSum: 346 },
  { tokenId: 920002n, hand: 0, edges: [7, 4, 5, 6], combatStatSum: 334 },
  { tokenId: 920003n, hand: 1, edges: [4, 6, 7, 5], combatStatSum: 338 },
  { tokenId: 920004n, hand: 2, edges: [6, 5, 4, 7], combatStatSum: 329 },
  { tokenId: 920005n, hand: 0, edges: [5, 5, 6, 6], combatStatSum: 341 },
];

/**
 * Build a deterministic emergency fallback set for guest mode.
 * Used only when Game Index loading fails and we still want the user to play.
 */
export function buildEmergencyGuestFallbackData(): EmergencyGuestFallbackData {
  const cardsByTokenId = new Map<bigint, CardData>();
  const deckATokenIds = EMERGENCY_DECK_A.map((x) => x.tokenId);
  const deckBTokenIds = EMERGENCY_DECK_B.map((x) => x.tokenId);

  for (const seed of [...EMERGENCY_DECK_A, ...EMERGENCY_DECK_B]) {
    cardsByTokenId.set(seed.tokenId, {
      tokenId: seed.tokenId,
      edges: {
        up: seed.edges[0],
        right: seed.edges[1],
        down: seed.edges[2],
        left: seed.edges[3],
      },
      jankenHand: seed.hand,
      combatStatSum: seed.combatStatSum,
      trait: "none",
    });
  }

  return {
    deckATokenIds,
    deckBTokenIds,
    cardsByTokenId,
  };
}

// ── Recommended Deck Presets ─────────────────────────────────────────

export type DeckStrategy = "balanced" | "aggressive" | "defensive" | "janken_mix";

const STRATEGY_LABELS: Record<DeckStrategy, string> = {
  balanced: "バランス型",
  aggressive: "攻撃重視",
  defensive: "防御重視",
  janken_mix: "じゃんけん混合",
};

export function strategyLabel(strategy: DeckStrategy): string {
  return STRATEGY_LABELS[strategy];
}

/**
 * Generate a recommended deck based on a given strategy.
 */
export function generateRecommendedDeck(
  index: GameIndexV1,
  strategy: DeckStrategy,
): DeckV1 {
  const allIds = getAllTokenIds(index);
  const entries: { id: string; params: IndexTokenGameParams; score: number }[] = [];

  for (const id of allIds) {
    const p = getFromGameIndex(index, id);
    if (p) entries.push({ id, params: p, score: tokenScore(p) });
  }

  let picked: string[];
  const now = new Date().toISOString();

  switch (strategy) {
    case "aggressive": {
      // Top edge-sum cards, favor Rock (hand=0)
      entries.sort((a, b) => b.score - a.score);
      const rockFirst = entries.filter((e) => e.params.hand === 0);
      const others = entries.filter((e) => e.params.hand !== 0);
      const pool = [...rockFirst, ...others];
      picked = sampleWithout(pool.slice(0, 20), 5).map((e) => e.id);
      break;
    }
    case "defensive": {
      // Highest minimum-edge cards (defensive = no weak side)
      const withMinEdge = entries.map((e) => ({
        ...e,
        minEdge: Math.min(e.params.triad.up, e.params.triad.right, e.params.triad.down, e.params.triad.left),
      }));
      withMinEdge.sort((a, b) => b.minEdge - a.minEdge || b.score - a.score);
      picked = sampleWithout(withMinEdge.slice(0, 20), 5).map((e) => e.id);
      break;
    }
    case "janken_mix": {
      // Diversified hands for tie-break advantage
      const byHand: Record<number, typeof entries> = { 0: [], 1: [], 2: [] };
      for (const e of entries) byHand[e.params.hand].push(e);
      for (const h of [0, 1, 2]) byHand[h].sort((a, b) => b.score - a.score);

      // Pick 2-2-1 distribution, from each hand
      const ids: string[] = [];
      const counts = [2, 2, 1];
      for (let h = 0; h < 3; h++) {
        const pool = byHand[h].slice(0, 10);
        ids.push(...sampleWithout(pool, counts[h]).map((e) => e.id));
      }
      picked = ids.slice(0, 5);
      break;
    }
    case "balanced":
    default: {
      // Use existing balanced logic (middle range)
      const midStart = Math.max(0, Math.floor(entries.length * 0.3));
      const midEnd = Math.min(entries.length, Math.floor(entries.length * 0.7));
      const midRange = entries.slice(midStart, midEnd);
      picked = sampleWithout(midRange, 5).map((e) => e.id);
      break;
    }
  }

  // Ensure we have 5
  while (picked.length < 5 && entries.length > 0) {
    picked.push(entries[Math.floor(Math.random() * entries.length)].id);
  }

  return {
    id: `rec-${strategy}-${Date.now()}`,
    name: `${STRATEGY_LABELS[strategy]} Deck`,
    tokenIds: picked.slice(0, 5),
    createdAt: now,
    updatedAt: now,
    origin: "recommended",
    memo: STRATEGY_LABELS[strategy],
  };
}

// ── Exports for testing ──────────────────────────────────────────────
/** @internal – exported for unit tests only */
export { sampleWithout as _sampleWithout, tokenScore as _tokenScore };
