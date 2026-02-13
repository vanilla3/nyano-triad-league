import { describe, it, expect } from "vitest";
import type { GameIndexV1 } from "../nyano/gameIndex";
import { GAME_INDEX_FIELDS } from "../nyano/gameIndex";
import {
  DEMO_DECK_PRESETS,
  generateRandomDemoDeck,
  generateBalancedDemoPair,
  buildCardDataFromIndex,
  buildEmergencyGuestFallbackData,
  _sampleWithout,
  _tokenScore,
} from "../demo_decks";

/* ------------------------------------------------------------------ */
/* Helper: build a minimal GameIndexV1                                  */
/* ------------------------------------------------------------------ */

type TokenEntry = {
  hand: 0 | 1 | 2;
  triad: [number, number, number, number]; // up, right, left, down
  combat: [number, number, number, number, number, number]; // hp, atk, matk, def, mdef, agi
};

function makeGameIndex(tokens: Record<string, TokenEntry>): GameIndexV1 {
  const t: Record<string, number[]> = {};
  for (const [id, entry] of Object.entries(tokens)) {
    // Order matches GAME_INDEX_FIELDS: hand, hp, atk, matk, def, mdef, agi, up, right, left, down
    t[id] = [
      entry.hand,
      ...entry.combat,
      ...entry.triad,
    ];
  }
  return {
    v: 1,
    maxTokenId: Math.max(...Object.keys(tokens).map(Number)),
    fields: [...GAME_INDEX_FIELDS],
    tokens: t,
    missing: [],
  };
}

/** Build a simple index with N tokens having balanced stats */
function makeBalancedIndex(count: number): GameIndexV1 {
  const tokens: Record<string, TokenEntry> = {};
  for (let i = 1; i <= count; i++) {
    const val = 3 + (i % 5); // 3..7
    tokens[String(i)] = {
      hand: (i % 3) as 0 | 1 | 2,
      triad: [val, val, val, val],
      combat: [10, 5, 5, 5, 5, 5],
    };
  }
  return makeGameIndex(tokens);
}

/* ------------------------------------------------------------------ */
/* DEMO_DECK_PRESETS                                                    */
/* ------------------------------------------------------------------ */

describe("DEMO_DECK_PRESETS", () => {
  it("has exactly 3 entries", () => {
    expect(DEMO_DECK_PRESETS).toHaveLength(3);
  });

  it("each entry has required fields with 5 tokenIds", () => {
    for (const preset of DEMO_DECK_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.tokenIds).toHaveLength(5);
    }
  });

  it("no duplicate IDs across presets", () => {
    const ids = DEMO_DECK_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/* ------------------------------------------------------------------ */
/* _sampleWithout                                                      */
/* ------------------------------------------------------------------ */

describe("_sampleWithout", () => {
  it("returns n items from the array", () => {
    const result = _sampleWithout([1, 2, 3, 4, 5], 3);
    expect(result).toHaveLength(3);
  });

  it("returns all items when n >= array length", () => {
    const result = _sampleWithout([1, 2, 3], 5);
    expect(result).toHaveLength(3);
  });

  it("returns empty array when n = 0", () => {
    const result = _sampleWithout([1, 2, 3], 0);
    expect(result).toHaveLength(0);
  });

  it("returns no duplicates", () => {
    const result = _sampleWithout([1, 2, 3, 4, 5, 6, 7, 8], 5);
    expect(new Set(result).size).toBe(result.length);
  });

  it("does not mutate the original array", () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    _sampleWithout(original, 3);
    expect(original).toEqual(copy);
  });
});

/* ------------------------------------------------------------------ */
/* _tokenScore                                                         */
/* ------------------------------------------------------------------ */

describe("_tokenScore", () => {
  it("sums all 4 triad edges correctly", () => {
    const params = { hand: 0 as const, combat: { hp: 10, atk: 5, matk: 5, def: 5, mdef: 5, agi: 5 }, triad: { up: 3, right: 4, left: 5, down: 6 } };
    expect(_tokenScore(params)).toBe(18);
  });

  it("returns 0 for zero-edge params", () => {
    const params = { hand: 0 as const, combat: { hp: 0, atk: 0, matk: 0, def: 0, mdef: 0, agi: 0 }, triad: { up: 0, right: 0, left: 0, down: 0 } };
    expect(_tokenScore(params)).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* generateRandomDemoDeck                                              */
/* ------------------------------------------------------------------ */

describe("generateRandomDemoDeck", () => {
  const index = makeBalancedIndex(20);

  it("returns a deck with 5 tokenIds", () => {
    const deck = generateRandomDemoDeck(index);
    expect(deck.tokenIds).toHaveLength(5);
  });

  it("uses provided name or defaults", () => {
    const custom = generateRandomDemoDeck(index, "My Deck");
    expect(custom.name).toBe("My Deck");

    const defaulted = generateRandomDemoDeck(index);
    expect(defaulted.name).toBe("Random Demo Deck");
  });

  it("all tokenIds exist in the index", () => {
    const deck = generateRandomDemoDeck(index);
    const allIds = Object.keys(index.tokens);
    for (const id of deck.tokenIds) {
      expect(allIds).toContain(id);
    }
  });
});

/* ------------------------------------------------------------------ */
/* generateBalancedDemoPair                                            */
/* ------------------------------------------------------------------ */

describe("generateBalancedDemoPair", () => {
  const index = makeBalancedIndex(20);

  it("returns deckA and deckB each with 5 tokenIds", () => {
    const { deckA, deckB } = generateBalancedDemoPair(index);
    expect(deckA.tokenIds).toHaveLength(5);
    expect(deckB.tokenIds).toHaveLength(5);
  });

  it("deckA and deckB tokenIds are mostly distinct (alternating distribution)", () => {
    // The algorithm samples 10 tokens and alternates, so with enough tokens
    // overlap should be minimal. But the fallback loop can reuse tokens from
    // the full pool, so zero overlap is not guaranteed.
    const { deckA, deckB } = generateBalancedDemoPair(index);
    const combined = [...deckA.tokenIds, ...deckB.tokenIds];
    // At least 8 of 10 should be unique (alternating from 10 sampled)
    expect(new Set(combined).size).toBeGreaterThanOrEqual(8);
  });

  it("works with small index (12 tokens)", () => {
    const smallIndex = makeBalancedIndex(12);
    const { deckA, deckB } = generateBalancedDemoPair(smallIndex);
    expect(deckA.tokenIds).toHaveLength(5);
    expect(deckB.tokenIds).toHaveLength(5);
  });
});

/* ------------------------------------------------------------------ */
/* buildCardDataFromIndex                                              */
/* ------------------------------------------------------------------ */

describe("buildCardDataFromIndex", () => {
  const index = makeGameIndex({
    "1": { hand: 0, triad: [5, 6, 7, 8], combat: [10, 3, 3, 3, 3, 3] },
    "2": { hand: 1, triad: [2, 3, 4, 5], combat: [8, 4, 4, 4, 4, 4] },
    "3": { hand: 2, triad: [9, 9, 9, 9], combat: [12, 6, 6, 6, 6, 6] },
  });

  it("returns Map with CardData for each valid tokenId", () => {
    const cards = buildCardDataFromIndex(index, ["1", "2", "3"]);
    expect(cards.size).toBe(3);

    const c1 = cards.get(BigInt(1));
    expect(c1).toBeDefined();
    expect(c1!.edges.up).toBe(5);
    expect(c1!.edges.right).toBe(6);
    expect(c1!.edges.left).toBe(7);
    expect(c1!.edges.down).toBe(8);
    expect(c1!.jankenHand).toBe(0);
    expect(c1!.combatStatSum).toBe(10 + 3 + 3 + 3 + 3 + 3);
    expect(c1!.trait).toBe("none");
  });

  it("skips tokenIds not in the index", () => {
    const cards = buildCardDataFromIndex(index, ["1", "999"]);
    expect(cards.size).toBe(1);
    expect(cards.has(BigInt(1))).toBe(true);
    expect(cards.has(BigInt(999))).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* buildEmergencyGuestFallbackData                                    */
/* ------------------------------------------------------------------ */

describe("buildEmergencyGuestFallbackData", () => {
  it("returns deterministic 5v5 fallback decks with card map", () => {
    const fallback = buildEmergencyGuestFallbackData();
    expect(fallback.deckATokenIds).toHaveLength(5);
    expect(fallback.deckBTokenIds).toHaveLength(5);
    expect(fallback.cardsByTokenId.size).toBe(10);
  });

  it("contains every fallback deck token in cardsByTokenId", () => {
    const fallback = buildEmergencyGuestFallbackData();
    for (const tid of [...fallback.deckATokenIds, ...fallback.deckBTokenIds]) {
      const card = fallback.cardsByTokenId.get(tid);
      expect(card).toBeDefined();
      expect(card?.tokenId).toBe(tid);
      expect(card?.trait).toBe("none");
    }
  });
});
