import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  getFromGameIndex,
  getAllTokenIds,
  searchCards,
  resolveGameIndexUrl,
  clearGameIndexCache,
  GAME_INDEX_FIELDS,
  GAME_INDEX_VERSION,
  type GameIndexV1,
} from "../gameIndex";

/* ═══════════════════════════════════════════════════════════════════
   gameIndex.ts — Test Coverage
   ═══════════════════════════════════════════════════════════════════ */

/** Minimal valid index fixture. */
function makeIndex(overrides: Partial<GameIndexV1> = {}): GameIndexV1 {
  return {
    v: 1,
    maxTokenId: 3,
    fields: [...GAME_INDEX_FIELDS],
    tokens: {
      //         hand hp atk matk def mdef agi  up right left down
      "1": [0, 100, 50, 30, 40, 35, 60, 7, 3, 5, 4],
      "2": [1, 80, 60, 40, 30, 25, 55, 4, 6, 3, 5],
      "3": [2, 90, 45, 35, 50, 40, 50, 5, 5, 5, 5],
    },
    missing: [],
    ...overrides,
  };
}

describe("constants", () => {
  it("GAME_INDEX_VERSION is 1", () => {
    expect(GAME_INDEX_VERSION).toBe(1);
  });

  it("GAME_INDEX_FIELDS has 11 entries", () => {
    expect(GAME_INDEX_FIELDS.length).toBe(11);
  });
});

describe("getFromGameIndex", () => {
  const index = makeIndex();

  it("returns params for a valid token (number id)", () => {
    const result = getFromGameIndex(index, 1);
    expect(result).not.toBeNull();
    expect(result!.hand).toBe(0);
    expect(result!.triad.up).toBe(7);
    expect(result!.triad.right).toBe(3);
    expect(result!.triad.down).toBe(4);
    expect(result!.triad.left).toBe(5);
  });

  it("accepts bigint id", () => {
    const result = getFromGameIndex(index, 2n);
    expect(result).not.toBeNull();
    expect(result!.hand).toBe(1);
  });

  it("accepts string id", () => {
    const result = getFromGameIndex(index, "3");
    expect(result).not.toBeNull();
    expect(result!.hand).toBe(2);
  });

  it("returns combat stats correctly", () => {
    const result = getFromGameIndex(index, 1)!;
    expect(result.combat.hp).toBe(100);
    expect(result.combat.atk).toBe(50);
    expect(result.combat.matk).toBe(30);
    expect(result.combat.def).toBe(40);
    expect(result.combat.mdef).toBe(35);
    expect(result.combat.agi).toBe(60);
  });

  it("returns null for missing token", () => {
    expect(getFromGameIndex(index, 999)).toBeNull();
  });

  it("returns null for null index", () => {
    expect(getFromGameIndex(null, 1)).toBeNull();
  });

  it("returns null for undefined index", () => {
    expect(getFromGameIndex(undefined, 1)).toBeNull();
  });

  it("returns null for wrong version", () => {
    const bad = { ...index, v: 2 } as any;
    expect(getFromGameIndex(bad, 1)).toBeNull();
  });

  it("returns null for short array (< 11 elements)", () => {
    const short = makeIndex({
      tokens: { "1": [0, 100, 50, 30, 40] }, // only 5 elements
    });
    expect(getFromGameIndex(short, 1)).toBeNull();
  });

  it("returns null for invalid hand value (3)", () => {
    const badHand = makeIndex({
      tokens: { "1": [3, 100, 50, 30, 40, 35, 60, 7, 3, 5, 4] },
    });
    expect(getFromGameIndex(badHand, 1)).toBeNull();
  });
});

describe("getAllTokenIds", () => {
  it("returns array of token ID strings", () => {
    const index = makeIndex();
    const ids = getAllTokenIds(index);
    expect(ids).toContain("1");
    expect(ids).toContain("2");
    expect(ids).toContain("3");
    expect(ids.length).toBe(3);
  });

  it("returns empty array for null index", () => {
    expect(getAllTokenIds(null)).toEqual([]);
  });

  it("returns empty array for wrong version", () => {
    const bad = { v: 2, tokens: {} } as any;
    expect(getAllTokenIds(bad)).toEqual([]);
  });
});

describe("searchCards", () => {
  const index = makeIndex();

  it("returns all cards with empty filter", () => {
    const results = searchCards(index, {});
    expect(results.length).toBe(3);
  });

  it("results are sorted by edge sum descending", () => {
    const results = searchCards(index, {});
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].edgeSum).toBeGreaterThanOrEqual(results[i].edgeSum);
    }
  });

  it("filters by hand (rock=0)", () => {
    const results = searchCards(index, { hand: 0 });
    expect(results.length).toBe(1);
    expect(results[0].tokenId).toBe("1");
  });

  it("filters by hand (paper=1)", () => {
    const results = searchCards(index, { hand: 1 });
    expect(results.length).toBe(1);
    expect(results[0].tokenId).toBe("2");
  });

  it("filters by hand (scissors=2)", () => {
    const results = searchCards(index, { hand: 2 });
    expect(results.length).toBe(1);
    expect(results[0].tokenId).toBe("3");
  });

  it("filters by minEdgeSum", () => {
    // Token 3 has edges 5+5+5+5=20, Token 1 has 7+3+5+4=19, Token 2 has 4+6+3+5=18
    const results = searchCards(index, { minEdgeSum: 20 });
    expect(results.length).toBe(1);
    expect(results[0].tokenId).toBe("3");
  });

  it("returns empty for impossible filter", () => {
    const results = searchCards(index, { minEdgeSum: 100 });
    expect(results.length).toBe(0);
  });

  it("returns empty for null index", () => {
    expect(searchCards(null, {})).toEqual([]);
  });

  it("edge sum is correct", () => {
    const results = searchCards(index, {});
    const t1 = results.find((r) => r.tokenId === "1")!;
    expect(t1.edgeSum).toBe(7 + 3 + 5 + 4); // 19
    const t3 = results.find((r) => r.tokenId === "3")!;
    expect(t3.edgeSum).toBe(5 + 5 + 5 + 5); // 20
  });
});

// ---------------------------------------------------------------------------
// resolveGameIndexUrl — BASE_URL support
// ---------------------------------------------------------------------------

describe("resolveGameIndexUrl", () => {
  const originalEnv = { ...import.meta.env };
  afterEach(() => {
    Object.keys(import.meta.env).forEach((key) => {
      if (!(key in originalEnv)) delete import.meta.env[key];
    });
    Object.assign(import.meta.env, originalEnv);
  });

  it("returns /game/index.v1.json when BASE_URL is /", () => {
    import.meta.env.BASE_URL = "/";
    expect(resolveGameIndexUrl()).toBe("/game/index.v1.json");
  });

  it("prepends subpath when BASE_URL is /subpath/", () => {
    import.meta.env.BASE_URL = "/nyano-triad-league/";
    expect(resolveGameIndexUrl()).toBe("/nyano-triad-league/game/index.v1.json");
  });

  it("handles BASE_URL without trailing slash", () => {
    import.meta.env.BASE_URL = "/sub";
    expect(resolveGameIndexUrl()).toBe("/sub/game/index.v1.json");
  });

  it("handles empty BASE_URL as root", () => {
    import.meta.env.BASE_URL = "";
    expect(resolveGameIndexUrl()).toBe("/game/index.v1.json");
  });
});

// ---------------------------------------------------------------------------
// clearGameIndexCache
// ---------------------------------------------------------------------------

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  };
}

describe("clearGameIndexCache", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMockStorage());
  });

  it("removes the game index key from localStorage", () => {
    localStorage.setItem("nyano.gameIndex.v1", JSON.stringify({ v: 1 }));
    expect(localStorage.getItem("nyano.gameIndex.v1")).not.toBeNull();
    clearGameIndexCache();
    expect(localStorage.getItem("nyano.gameIndex.v1")).toBeNull();
  });

  it("does not throw when key does not exist", () => {
    expect(() => clearGameIndexCache()).not.toThrow();
  });
});
