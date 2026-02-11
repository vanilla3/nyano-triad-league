import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchGameIndex, type GameIndexV1 } from "../nyano/gameIndex";
import { getMetadataConfig } from "../nyano/metadata";

/* ═══════════════════════════════════════════════════════════════════
   fetchGameIndex — localStorage cache validation
   ═══════════════════════════════════════════════════════════════════ */

/** Minimal valid GameIndexV1 fixture WITH metadata. */
function makeValidCacheJson(): GameIndexV1 {
  return {
    v: 1,
    maxTokenId: 1,
    fields: ["hand", "hp", "atk", "matk", "def", "mdef", "agi", "up", "right", "left", "down"],
    tokens: { "1": [0, 100, 50, 30, 40, 35, 60, 7, 3, 5, 4] },
    missing: [],
    metadata: {
      mode: "local",
      imageBaseUrl:
        "https://m3c2ncchjkvsn3lc5ccd4kdsm74cdssuvxbuuaefwy43cyt4oixa.arweave.net/ZsWmiEdKqybtYuiEPihyZ_ghylStw0oAhbY5sWJ8ci4/{id}.png",
    },
  };
}

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

describe("fetchGameIndex cache validation — metadata field", () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    vi.stubGlobal("window", {} as Window & typeof globalThis);
    vi.stubGlobal("localStorage", mockStorage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns cached index when metadata field exists", async () => {
    const valid = makeValidCacheJson();
    mockStorage.setItem("nyano.gameIndex.v1", JSON.stringify(valid));

    // Mock fetch to fail — proving we return from cache
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("should not reach network"))));

    const result = await fetchGameIndex();
    expect(result).not.toBeNull();
    expect(result!.v).toBe(1);
    expect(result!.metadata).toBeDefined();
  });

  it("skips cache and fetches network when metadata field missing", async () => {
    // Old-format cache WITHOUT metadata
    const oldCache = {
      v: 1,
      maxTokenId: 1,
      fields: ["hand", "hp", "atk", "matk", "def", "mdef", "agi", "up", "right", "left", "down"],
      tokens: { "1": [0, 100, 50, 30, 40, 35, 60, 7, 3, 5, 4] },
      missing: [],
      // NO metadata field
    };
    mockStorage.setItem("nyano.gameIndex.v1", JSON.stringify(oldCache));

    // Mock fetch returns the full index with metadata
    const fullIndex = makeValidCacheJson();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(fullIndex),
    })));

    const result = await fetchGameIndex();
    expect(result).not.toBeNull();
    expect(result!.metadata).toBeDefined();
  });
});

describe("getMetadataConfig + fetchGameIndex integration", () => {
  it("getMetadataConfig returns config from cached metadata", () => {
    const index = makeValidCacheJson();
    const config = getMetadataConfig(index.metadata as Record<string, unknown>);
    expect(config).not.toBeNull();
    expect(config!.baseUrlPattern).toContain("{id}");
    expect(config!.baseUrlPattern).toContain("arweave.net");
  });

  it("getMetadataConfig returns null when metadata missing", () => {
    const config = getMetadataConfig(undefined);
    expect(config).toBeNull();
  });

  it("getMetadataConfig returns null when metadata has no imageBaseUrl", () => {
    const config = getMetadataConfig({ mode: "local" });
    expect(config).toBeNull();
  });
});
