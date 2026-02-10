/**
 * CardBrowser.test.ts
 *
 * Tests for the CardBrowser component.
 * Validates module exports, internal constants, and component contract.
 */
import { describe, it, expect } from "vitest";

describe("CardBrowser", () => {
  it("exports CardBrowser component", async () => {
    const mod = await import("../CardBrowser");
    expect(mod.CardBrowser).toBeDefined();
    expect(typeof mod.CardBrowser).toBe("function");
  });

  it("CardBrowser is a named export (no default export)", async () => {
    const mod = await import("../CardBrowser");
    expect((mod as any).default).toBeUndefined();
    expect(mod.CardBrowser).toBeDefined();
  });

  it("module exports only CardBrowser (internal constants are private)", async () => {
    const mod = await import("../CardBrowser") as Record<string, unknown>;
    // HAND_OPTIONS and PAGE_SIZE are module-level constants but not exported
    expect(mod.HAND_OPTIONS).toBeUndefined();
    expect(mod.PAGE_SIZE).toBeUndefined();
  });

  it("component function takes a single props object (React component pattern)", async () => {
    const mod = await import("../CardBrowser");
    // React functional components have Function.length = 1 (single props arg)
    expect(mod.CardBrowser.length).toBeLessThanOrEqual(1);
  });
});

describe("CardBrowser — dependency integration", () => {
  it("searchCards from gameIndex is importable", async () => {
    const mod = await import("@/lib/nyano/gameIndex");
    expect(mod.searchCards).toBeDefined();
    expect(typeof mod.searchCards).toBe("function");
  });

  it("buildCardDataFromIndex from demo_decks is importable", async () => {
    const mod = await import("@/lib/demo_decks");
    expect(mod.buildCardDataFromIndex).toBeDefined();
    expect(typeof mod.buildCardDataFromIndex).toBe("function");
  });

  it("searchCards returns empty array for null index", async () => {
    const { searchCards } = await import("@/lib/nyano/gameIndex");
    expect(searchCards(null, {})).toEqual([]);
  });

  it("searchCards returns empty array for invalid index version", async () => {
    const { searchCards } = await import("@/lib/nyano/gameIndex");
    const badIndex = { v: 2, maxTokenId: 0, fields: [], tokens: {}, missing: [] } as any;
    expect(searchCards(badIndex, {})).toEqual([]);
  });

  it("searchCards filters by hand correctly", async () => {
    const { searchCards } = await import("@/lib/nyano/gameIndex");
    const index = {
      v: 1 as const,
      maxTokenId: 3,
      fields: ["hand", "hp", "atk", "matk", "def", "mdef", "agi", "up", "right", "left", "down"],
      tokens: {
        "1": [0, 10, 10, 10, 10, 10, 10, 5, 5, 5, 5], // Rock
        "2": [1, 10, 10, 10, 10, 10, 10, 3, 3, 3, 3], // Scissors
        "3": [2, 10, 10, 10, 10, 10, 10, 4, 4, 4, 4], // Paper
      },
      missing: [],
    };

    const rockCards = searchCards(index, { hand: 0 });
    expect(rockCards).toHaveLength(1);
    expect(rockCards[0].tokenId).toBe("1");

    const allCards = searchCards(index, {});
    expect(allCards).toHaveLength(3);
  });

  it("searchCards filters by minEdgeSum correctly", async () => {
    const { searchCards } = await import("@/lib/nyano/gameIndex");
    const index = {
      v: 1 as const,
      maxTokenId: 3,
      fields: ["hand", "hp", "atk", "matk", "def", "mdef", "agi", "up", "right", "left", "down"],
      tokens: {
        "1": [0, 10, 10, 10, 10, 10, 10, 1, 1, 1, 1], // edgeSum=4
        "2": [1, 10, 10, 10, 10, 10, 10, 5, 5, 5, 5], // edgeSum=20
        "3": [2, 10, 10, 10, 10, 10, 10, 9, 9, 9, 9], // edgeSum=36
      },
      missing: [],
    };

    const highEdge = searchCards(index, { minEdgeSum: 15 });
    expect(highEdge).toHaveLength(2);
    expect(highEdge[0].tokenId).toBe("3"); // sorted by edgeSum desc
    expect(highEdge[1].tokenId).toBe("2");
  });

  it("searchCards returns results sorted by edgeSum descending", async () => {
    const { searchCards } = await import("@/lib/nyano/gameIndex");
    const index = {
      v: 1 as const,
      maxTokenId: 3,
      fields: ["hand", "hp", "atk", "matk", "def", "mdef", "agi", "up", "right", "left", "down"],
      tokens: {
        "1": [0, 10, 10, 10, 10, 10, 10, 2, 2, 2, 2], // edgeSum=8
        "2": [1, 10, 10, 10, 10, 10, 10, 8, 8, 8, 8], // edgeSum=32
        "3": [2, 10, 10, 10, 10, 10, 10, 5, 5, 5, 5], // edgeSum=20
      },
      missing: [],
    };

    const results = searchCards(index, {});
    expect(results.map(r => r.tokenId)).toEqual(["2", "3", "1"]);
  });

  it("buildCardDataFromIndex creates CardData from valid tokens", async () => {
    const { buildCardDataFromIndex } = await import("@/lib/demo_decks");
    const index = {
      v: 1 as const,
      maxTokenId: 2,
      fields: ["hand", "hp", "atk", "matk", "def", "mdef", "agi", "up", "right", "left", "down"],
      tokens: {
        "1": [0, 10, 20, 15, 10, 10, 10, 5, 3, 7, 2],
        "2": [1, 10, 10, 10, 10, 10, 10, 4, 4, 4, 4],
      },
      missing: [],
    };

    const result = buildCardDataFromIndex(index, ["1", "2"]);
    expect(result.size).toBe(2);

    const card1 = result.get(1n)!;
    expect(card1).toBeDefined();
    expect(card1.tokenId).toBe(1n);
    expect(card1.edges).toEqual({ up: 5, right: 3, down: 2, left: 7 });
    expect(card1.jankenHand).toBe(0);

    const card2 = result.get(2n)!;
    expect(card2.jankenHand).toBe(1);
    expect(card2.edges).toEqual({ up: 4, right: 4, down: 4, left: 4 });
  });

  it("buildCardDataFromIndex skips missing tokens", async () => {
    const { buildCardDataFromIndex } = await import("@/lib/demo_decks");
    const index = {
      v: 1 as const,
      maxTokenId: 1,
      fields: ["hand", "hp", "atk", "matk", "def", "mdef", "agi", "up", "right", "left", "down"],
      tokens: {
        "1": [0, 10, 10, 10, 10, 10, 10, 5, 5, 5, 5],
      },
      missing: [],
    };

    const result = buildCardDataFromIndex(index, ["1", "999"]);
    expect(result.size).toBe(1);
    expect(result.has(1n)).toBe(true);
    expect(result.has(999n)).toBe(false);
  });
});
