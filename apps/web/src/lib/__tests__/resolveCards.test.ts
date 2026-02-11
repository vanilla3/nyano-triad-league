import { describe, it, expect, vi, afterEach } from "vitest";

/* ═══════════════════════════════════════════════════════════════════
   resolveCards — game-index-first card resolution with RPC fallback
   ═══════════════════════════════════════════════════════════════════ */

// Mock modules BEFORE importing the module under test
vi.mock("../nyano/gameIndex", () => ({
  fetchGameIndex: vi.fn(),
  getFromGameIndex: vi.fn(),
}));

vi.mock("../nyano_rpc", () => ({
  fetchNyanoCards: vi.fn(),
}));

import { resolveCards } from "../resolveCards";
import { fetchGameIndex, getFromGameIndex } from "../nyano/gameIndex";
import { fetchNyanoCards } from "../nyano_rpc";

const mockFetchGameIndex = vi.mocked(fetchGameIndex);
const mockGetFromGameIndex = vi.mocked(getFromGameIndex);
const mockFetchNyanoCards = vi.mocked(fetchNyanoCards);

afterEach(() => {
  vi.resetAllMocks();
});

const MOCK_INDEX_PARAMS = {
  hand: 0 as const,
  combat: { hp: 100, atk: 50, matk: 30, def: 40, mdef: 20, agi: 60 },
  triad: { up: 5, right: 3, down: 7, left: 2 },
};

describe("resolveCards", () => {
  it("resolves all cards from game index when available", async () => {
    const fakeIndex = { v: 1, maxTokenId: 100, fields: [], tokens: {}, missing: [] } as any;
    mockFetchGameIndex.mockResolvedValue(fakeIndex);
    mockGetFromGameIndex.mockReturnValue(MOCK_INDEX_PARAMS);

    const result = await resolveCards([1n, 2n]);

    expect(result.cards.size).toBe(2);
    expect(result.sources.get(1n)).toBe("index");
    expect(result.sources.get(2n)).toBe("index");
    // RPC should not be called
    expect(mockFetchNyanoCards).not.toHaveBeenCalled();
  });

  it("builds correct CardData from game index params", async () => {
    const fakeIndex = { v: 1, maxTokenId: 100, fields: [], tokens: {}, missing: [] } as any;
    mockFetchGameIndex.mockResolvedValue(fakeIndex);
    mockGetFromGameIndex.mockReturnValue(MOCK_INDEX_PARAMS);

    const result = await resolveCards([42n]);
    const card = result.cards.get(42n);

    expect(card).toBeDefined();
    expect(card!.tokenId).toBe(42n);
    expect(card!.edges).toEqual({ up: 5, right: 3, down: 7, left: 2 });
    expect(card!.jankenHand).toBe(0);
    expect(card!.combatStatSum).toBe(100 + 50 + 30 + 40 + 20 + 60);
    expect(card!.trait).toBe("none");
  });

  it("falls back to RPC for tokens missing from game index", async () => {
    const fakeIndex = { v: 1, maxTokenId: 100, fields: [], tokens: {}, missing: [] } as any;
    mockFetchGameIndex.mockResolvedValue(fakeIndex);
    // Token 1 found in index, token 2 missing
    mockGetFromGameIndex.mockImplementation((_idx, tid) => {
      return tid.toString() === "1" ? MOCK_INDEX_PARAMS : null;
    });
    mockFetchNyanoCards.mockResolvedValue(
      new Map([[2n, {
        tokenId: 2n,
        owner: "0xabc" as `0x${string}`,
        hand: 1,
        trait: {} as any,
        combatStats: {} as any,
        triad: {} as any,
        card: { tokenId: 2n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 1, combatStatSum: 10 },
      }]])
    );

    const result = await resolveCards([1n, 2n]);

    expect(result.cards.size).toBe(2);
    expect(result.sources.get(1n)).toBe("index");
    expect(result.sources.get(2n)).toBe("rpc");
    expect(result.owners.get(2n)).toBe("0xabc");
    expect(mockFetchNyanoCards).toHaveBeenCalledWith([2n]);
  });

  it("falls back entirely to RPC when game index is unavailable", async () => {
    mockFetchGameIndex.mockResolvedValue(null);
    mockFetchNyanoCards.mockResolvedValue(
      new Map([[1n, {
        tokenId: 1n,
        owner: "0xdef" as `0x${string}`,
        hand: 2,
        trait: {} as any,
        combatStats: {} as any,
        triad: {} as any,
        card: { tokenId: 1n, edges: { up: 2, right: 2, down: 2, left: 2 }, jankenHand: 2, combatStatSum: 20 },
      }]])
    );

    const result = await resolveCards([1n]);

    expect(result.cards.size).toBe(1);
    expect(result.sources.get(1n)).toBe("rpc");
    expect(mockFetchNyanoCards).toHaveBeenCalledWith([1n]);
  });

  it("handles game index fetch error gracefully", async () => {
    mockFetchGameIndex.mockRejectedValue(new Error("network error"));
    mockFetchNyanoCards.mockResolvedValue(
      new Map([[1n, {
        tokenId: 1n,
        owner: "0x123" as `0x${string}`,
        hand: 0,
        trait: {} as any,
        combatStats: {} as any,
        triad: {} as any,
        card: { tokenId: 1n, edges: { up: 3, right: 3, down: 3, left: 3 }, jankenHand: 0, combatStatSum: 30 },
      }]])
    );

    const result = await resolveCards([1n]);

    expect(result.cards.size).toBe(1);
    expect(result.sources.get(1n)).toBe("rpc");
  });

  it("handles both game index and RPC failure gracefully", async () => {
    mockFetchGameIndex.mockRejectedValue(new Error("index failed"));
    mockFetchNyanoCards.mockRejectedValue(new Error("rpc failed"));

    const result = await resolveCards([1n]);

    expect(result.cards.size).toBe(0);
    expect(result.owners.size).toBe(0);
  });

  it("deduplicates token IDs", async () => {
    const fakeIndex = { v: 1, maxTokenId: 100, fields: [], tokens: {}, missing: [] } as any;
    mockFetchGameIndex.mockResolvedValue(fakeIndex);
    mockGetFromGameIndex.mockReturnValue(MOCK_INDEX_PARAMS);

    const result = await resolveCards([1n, 1n, 1n]);

    expect(result.cards.size).toBe(1);
    // getFromGameIndex called once per unique ID
    expect(mockGetFromGameIndex).toHaveBeenCalledTimes(1);
  });

  it("sets zero address for game-index-resolved owners", async () => {
    const fakeIndex = { v: 1, maxTokenId: 100, fields: [], tokens: {}, missing: [] } as any;
    mockFetchGameIndex.mockResolvedValue(fakeIndex);
    mockGetFromGameIndex.mockReturnValue(MOCK_INDEX_PARAMS);

    const result = await resolveCards([1n]);

    expect(result.owners.get(1n)).toBe("0x0000000000000000000000000000000000000000");
  });

  it("respects skipRpc option", async () => {
    mockFetchGameIndex.mockResolvedValue(null);

    const result = await resolveCards([1n], { skipRpc: true });

    expect(result.cards.size).toBe(0);
    expect(mockFetchNyanoCards).not.toHaveBeenCalled();
  });
});
