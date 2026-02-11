import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/* ══════════════════════════════════════════════════════════════════════
   Module-level mocks (hoisted by Vitest before any imports)
   ══════════════════════════════════════════════════════════════════════ */

const mockReadContract = vi.fn();

vi.mock("viem", () => ({
  createPublicClient: vi.fn(() => ({ readContract: mockReadContract })),
  http: vi.fn((url: string) => url),
  parseAbi: vi.fn((abis: readonly string[]) => abis),
}));
vi.mock("viem/chains", () => ({ mainnet: { id: 1, name: "mainnet" } }));

/* Import module-under-test AFTER mocks are declared */
import {
  DEFAULT_RPC_URLS,
  DEFAULT_RPC_URL,
  DEFAULT_NYANO_ADDRESS,
  getUserRpcOverride,
  setUserRpcOverride,
  clearUserRpcOverride,
  getLastOkRpcUrl,
  getRpcUrl,
  getRpcCandidates,
  getNyanoAddress,
  pingRpcUrl,
  fetchNyanoCard,
  fetchNyanoCards,
  fetchMintedTokenIds,
  NyanoTokenNotMintedError,
} from "../nyano_rpc";

/* ══════════════════════════════════════════════════════════════════════
   Shared helpers
   ══════════════════════════════════════════════════════════════════════ */

function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  };
}

const mockFetch = vi.fn();
const savedEnv: Record<string, unknown> = {};

beforeEach(() => {
  vi.stubGlobal("localStorage", createMockStorage());
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
  mockReadContract.mockReset();

  // Save env keys we'll manipulate
  for (const k of ["VITE_RPC_URL", "VITE_NYANO_ADDRESS"]) {
    savedEnv[k] = (import.meta.env as Record<string, unknown>)[k];
    delete (import.meta.env as Record<string, unknown>)[k];
  }
});

afterEach(() => {
  // Restore env
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) {
      delete (import.meta.env as Record<string, unknown>)[k];
    } else {
      (import.meta.env as Record<string, unknown>)[k] = v;
    }
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Unique tokenId counter to avoid module-level cache collisions across tests. */
let nextTokenId = 1000n;
function freshTokenId(): bigint {
  return nextTokenId++;
}

/** Mock a full successful card read (exists + 5 contract calls). */
function mockSuccessfulCardRead(owner = "0x1111111111111111111111111111111111111111") {
  mockReadContract
    .mockResolvedValueOnce(true)                            // exists
    .mockResolvedValueOnce(owner)                           // ownerOf
    .mockResolvedValueOnce(1n)                              // getJankenHand
    .mockResolvedValueOnce([1n, 2n, 3n])                    // getTrait [classId, seasonId, rarity]
    .mockResolvedValueOnce([100n, 50n, 30n, 40n, 20n, 60n]) // getCombatStats
    .mockResolvedValueOnce([5n, 3n, 2n, 7n]);               // getTriad [up, right, left, down]
}

/** Create a connectivity-type error that triggers RPC fallback. */
function makeConnectivityError(msg = "failed to fetch") {
  return new Error(msg);
}

/** Create a non-connectivity error (contract revert, etc.). */
function makeContractError(msg = "execution reverted") {
  return new Error(msg);
}

/* ══════════════════════════════════════════════════════════════════════
   1. User RPC Override (localStorage CRUD)
   ══════════════════════════════════════════════════════════════════════ */

describe("User RPC Override", () => {
  it("getUserRpcOverride returns null when localStorage is empty", () => {
    expect(getUserRpcOverride()).toBeNull();
  });

  it("setUserRpcOverride persists and is readable", () => {
    setUserRpcOverride("https://my-rpc.example.com");
    expect(getUserRpcOverride()).toBe("https://my-rpc.example.com");
  });

  it("setUserRpcOverride trims whitespace", () => {
    setUserRpcOverride("  https://trimmed.example.com  ");
    expect(getUserRpcOverride()).toBe("https://trimmed.example.com");
  });

  it("setUserRpcOverride throws for empty string", () => {
    expect(() => setUserRpcOverride("")).toThrow("RPC URL is empty");
  });

  it("setUserRpcOverride throws for whitespace-only", () => {
    expect(() => setUserRpcOverride("   ")).toThrow("RPC URL is empty");
  });

  it("clearUserRpcOverride removes stored value", () => {
    setUserRpcOverride("https://temp.example.com");
    expect(getUserRpcOverride()).toBe("https://temp.example.com");
    clearUserRpcOverride();
    expect(getUserRpcOverride()).toBeNull();
  });
});

/* ══════════════════════════════════════════════════════════════════════
   2. getRpcUrl priority resolution
   ══════════════════════════════════════════════════════════════════════ */

describe("getRpcUrl", () => {
  it("returns DEFAULT_RPC_URL when nothing is set", () => {
    expect(getRpcUrl()).toBe(DEFAULT_RPC_URL);
  });

  it("user override takes highest priority", () => {
    setUserRpcOverride("https://user-override.example.com");
    (import.meta.env as Record<string, unknown>).VITE_RPC_URL = "https://env-rpc.example.com";
    expect(getRpcUrl()).toBe("https://user-override.example.com");
  });

  it("env VITE_RPC_URL takes priority over lastOk and defaults", () => {
    (import.meta.env as Record<string, unknown>).VITE_RPC_URL = "https://env-rpc.example.com";
    expect(getRpcUrl()).toBe("https://env-rpc.example.com");
  });

  it("lastOk takes priority over defaults", () => {
    // Use fetchNyanoCard success to set lastOk indirectly is complex;
    // instead we directly write to localStorage
    localStorage.setItem("nytl.rpc.lastOk", "https://lastok.example.com");
    expect(getRpcUrl()).toBe("https://lastok.example.com");
  });

  it("returns DEFAULT_RPC_URL when all sources empty", () => {
    // No user override, no env, no lastOk
    expect(getRpcUrl()).toBe(DEFAULT_RPC_URL);
    expect(DEFAULT_RPC_URL).toBe(DEFAULT_RPC_URLS[0]);
  });
});

/* ══════════════════════════════════════════════════════════════════════
   3. getRpcCandidates ordering and dedup
   ══════════════════════════════════════════════════════════════════════ */

describe("getRpcCandidates", () => {
  it("contains all DEFAULT_RPC_URLS when no overrides", () => {
    const cands = getRpcCandidates();
    for (const url of DEFAULT_RPC_URLS) {
      expect(cands).toContain(url);
    }
    expect(cands.length).toBe(DEFAULT_RPC_URLS.length);
  });

  it("user override appears first", () => {
    setUserRpcOverride("https://custom.example.com");
    const cands = getRpcCandidates();
    expect(cands[0]).toBe("https://custom.example.com");
    expect(cands.length).toBe(DEFAULT_RPC_URLS.length + 1);
  });

  it("env URL appears after user override", () => {
    setUserRpcOverride("https://user.example.com");
    (import.meta.env as Record<string, unknown>).VITE_RPC_URL = "https://env.example.com";
    const cands = getRpcCandidates();
    expect(cands[0]).toBe("https://user.example.com");
    expect(cands[1]).toBe("https://env.example.com");
  });

  it("deduplicates when override matches a default", () => {
    setUserRpcOverride(DEFAULT_RPC_URLS[0]);
    const cands = getRpcCandidates();
    // Should not have duplicate DEFAULT_RPC_URLS[0]
    expect(cands.filter((u) => u === DEFAULT_RPC_URLS[0]).length).toBe(1);
    expect(cands.length).toBe(DEFAULT_RPC_URLS.length);
  });

  it("lastOk appears in correct position", () => {
    localStorage.setItem("nytl.rpc.lastOk", "https://lastok.example.com");
    const cands = getRpcCandidates();
    const lastOkIdx = cands.indexOf("https://lastok.example.com");
    expect(lastOkIdx).toBeGreaterThanOrEqual(0);
    // Should be before defaults (position 0 since no user/env override)
    expect(lastOkIdx).toBe(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════
   4. getNyanoAddress
   ══════════════════════════════════════════════════════════════════════ */

describe("getNyanoAddress", () => {
  it("returns DEFAULT_NYANO_ADDRESS when env is not set", () => {
    expect(getNyanoAddress()).toBe(DEFAULT_NYANO_ADDRESS);
  });

  it("returns env override when VITE_NYANO_ADDRESS is set", () => {
    (import.meta.env as Record<string, unknown>).VITE_NYANO_ADDRESS = "0xDeadBeef";
    expect(getNyanoAddress()).toBe("0xDeadBeef");
  });
});

/* ══════════════════════════════════════════════════════════════════════
   5. isRpcConnectivityError (tested indirectly via fetchNyanoCard fallback)
   ══════════════════════════════════════════════════════════════════════ */

describe("RPC connectivity error classification (via fetchNyanoCard fallback)", () => {
  it("falls back on 'failed to fetch'", async () => {
    const tid = freshTokenId();
    // First RPC: connectivity error → falls back to second
    mockReadContract
      .mockRejectedValueOnce(makeConnectivityError("failed to fetch"));
    // Second RPC: success
    mockSuccessfulCardRead();

    const bundle = await fetchNyanoCard(tid);
    expect(bundle.tokenId).toBe(tid);
    // readContract was called: 1 (fail) + 6 (success) = 7
    expect(mockReadContract).toHaveBeenCalledTimes(7);
  });

  it("falls back on 'HTTP request failed'", async () => {
    const tid = freshTokenId();
    mockReadContract.mockRejectedValueOnce(makeConnectivityError("HTTP request failed"));
    mockSuccessfulCardRead();

    const bundle = await fetchNyanoCard(tid);
    expect(bundle.tokenId).toBe(tid);
  });

  it("falls back on 'network error'", async () => {
    const tid = freshTokenId();
    mockReadContract.mockRejectedValueOnce(makeConnectivityError("network error"));
    mockSuccessfulCardRead();

    await expect(fetchNyanoCard(tid)).resolves.toBeDefined();
  });

  it("falls back on 'timeout'", async () => {
    const tid = freshTokenId();
    mockReadContract.mockRejectedValueOnce(makeConnectivityError("Request timeout exceeded"));
    mockSuccessfulCardRead();

    await expect(fetchNyanoCard(tid)).resolves.toBeDefined();
  });

  it("falls back on '429' rate limit", async () => {
    const tid = freshTokenId();
    mockReadContract.mockRejectedValueOnce(makeConnectivityError("HTTP 429 Too Many Requests"));
    mockSuccessfulCardRead();

    await expect(fetchNyanoCard(tid)).resolves.toBeDefined();
  });

  it("falls back on 'rate limit'", async () => {
    const tid = freshTokenId();
    mockReadContract.mockRejectedValueOnce(makeConnectivityError("rate limit exceeded"));
    mockSuccessfulCardRead();

    await expect(fetchNyanoCard(tid)).resolves.toBeDefined();
  });

  it("falls back on 'too many requests'", async () => {
    const tid = freshTokenId();
    mockReadContract.mockRejectedValueOnce(makeConnectivityError("too many requests"));
    mockSuccessfulCardRead();

    await expect(fetchNyanoCard(tid)).resolves.toBeDefined();
  });

  it("falls back on HttpRequestError name", async () => {
    const tid = freshTokenId();
    const err = new Error("some http error");
    err.name = "HttpRequestError";
    mockReadContract.mockRejectedValueOnce(err);
    mockSuccessfulCardRead();

    await expect(fetchNyanoCard(tid)).resolves.toBeDefined();
  });

  it("does NOT fall back on contract revert (non-connectivity)", async () => {
    const tid = freshTokenId();
    mockReadContract.mockResolvedValueOnce(true); // exists
    mockReadContract.mockRejectedValueOnce(makeContractError("execution reverted"));

    await expect(fetchNyanoCard(tid)).rejects.toThrow("execution reverted");
  });

  it("does NOT fall back on string error", async () => {
    const tid = freshTokenId();
    mockReadContract.mockResolvedValueOnce(true); // exists
    mockReadContract.mockRejectedValueOnce("string error");

    await expect(fetchNyanoCard(tid)).rejects.toBe("string error");
  });
});

/* ══════════════════════════════════════════════════════════════════════
   6. pingRpcUrl
   ══════════════════════════════════════════════════════════════════════ */

describe("pingRpcUrl", () => {
  it("returns ok:false for empty URL", async () => {
    const result = await pingRpcUrl("");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("RPC URL is empty");
  });

  it("returns ok:true with chainId for valid response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: "0x1" }),
    });

    const result = await pingRpcUrl("https://rpc.example.com");
    expect(result.ok).toBe(true);
    expect(result.chainId).toBe("0x1");
  });

  it("returns ok:false for HTTP error status", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const result = await pingRpcUrl("https://rpc.example.com");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("HTTP 500");
  });

  it("returns ok:false for malformed JSON", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error("invalid json")),
    });

    const result = await pingRpcUrl("https://rpc.example.com");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("bad response");
  });

  it("returns ok:false when result field is missing", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ jsonrpc: "2.0", id: 1 }),
    });

    const result = await pingRpcUrl("https://rpc.example.com");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("bad response");
  });

  it("returns ok:false on fetch throw", async () => {
    mockFetch.mockRejectedValue(new Error("net::ERR_CONNECTION_REFUSED"));

    const result = await pingRpcUrl("https://rpc.example.com");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("ERR_CONNECTION_REFUSED");
  });

  it("sends correct JSON-RPC payload", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ result: "0x1" }),
    });

    await pingRpcUrl("https://rpc.example.com");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://rpc.example.com");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body as string);
    expect(body).toEqual({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] });
  });
});

/* ══════════════════════════════════════════════════════════════════════
   7. NyanoTokenNotMintedError
   ══════════════════════════════════════════════════════════════════════ */

describe("NyanoTokenNotMintedError", () => {
  it("has correct name", () => {
    const err = new NyanoTokenNotMintedError(42n);
    expect(err.name).toBe("NyanoTokenNotMintedError");
  });

  it("preserves tokenId", () => {
    const err = new NyanoTokenNotMintedError(999n);
    expect(err.tokenId).toBe(999n);
  });

  it("message contains tokenId", () => {
    const err = new NyanoTokenNotMintedError(123n);
    expect(err.message).toContain("123");
  });
});

/* ══════════════════════════════════════════════════════════════════════
   8. makeRpcFailureError (tested via fetchNyanoCard full fallback failure)
   ══════════════════════════════════════════════════════════════════════ */

describe("makeRpcFailureError (all candidates fail)", () => {
  it("error message contains all tried RPC URLs", async () => {
    const tid = freshTokenId();
    // Fail all candidates with connectivity errors
    for (let i = 0; i < getRpcCandidates().length; i++) {
      mockReadContract.mockRejectedValueOnce(makeConnectivityError("failed to fetch"));
    }

    try {
      await fetchNyanoCard(tid);
      expect.unreachable("should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      for (const url of getRpcCandidates()) {
        expect(msg).toContain(url);
      }
    }
  });

  it("error message contains last error description", async () => {
    const tid = freshTokenId();
    const cands = getRpcCandidates();
    for (let i = 0; i < cands.length - 1; i++) {
      mockReadContract.mockRejectedValueOnce(makeConnectivityError("failed to fetch"));
    }
    mockReadContract.mockRejectedValueOnce(makeConnectivityError("rate limit exceeded"));

    try {
      await fetchNyanoCard(tid);
      expect.unreachable("should have thrown");
    } catch (e) {
      expect((e as Error).message).toContain("rate limit exceeded");
    }
  });

  it("error message contains Japanese troubleshooting hints", async () => {
    const tid = freshTokenId();
    for (let i = 0; i < getRpcCandidates().length; i++) {
      mockReadContract.mockRejectedValueOnce(makeConnectivityError("timeout"));
    }

    try {
      await fetchNyanoCard(tid);
      expect.unreachable("should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain("RPC接続に失敗");
      expect(msg).toContain("VITE_RPC_URL");
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════
   9. fetchNyanoCard
   ══════════════════════════════════════════════════════════════════════ */

describe("fetchNyanoCard", () => {
  it("returns NyanoCardBundle with correct fields", async () => {
    const tid = freshTokenId();
    const owner = "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01";
    mockSuccessfulCardRead(owner);

    const bundle = await fetchNyanoCard(tid);
    expect(bundle.tokenId).toBe(tid);
    expect(bundle.owner).toBe(owner);
    expect(bundle.hand).toBe(1);
    expect(bundle.trait).toEqual({ classId: 1, seasonId: 2, rarity: 3 });
    expect(bundle.combatStats).toEqual({ hp: 100, atk: 50, matk: 30, def: 40, mdef: 20, agi: 60 });
    expect(bundle.triad).toEqual({ up: 5, right: 3, left: 2, down: 7 });
    expect(bundle.card).toBeDefined();
  });

  it("caches result for same tokenId (readContract called once)", async () => {
    const tid = freshTokenId();
    mockSuccessfulCardRead();

    const b1 = await fetchNyanoCard(tid);
    const b2 = await fetchNyanoCard(tid);
    // Same resolved value (cache hit)
    expect(b1).toBe(b2);
    // readContract called only 6 times (1 card = exists + 5 reads), not 12
    expect(mockReadContract).toHaveBeenCalledTimes(6);
  });

  it("throws NyanoTokenNotMintedError when exists()=false", async () => {
    const tid = freshTokenId();
    mockReadContract.mockResolvedValueOnce(false); // exists = false

    await expect(fetchNyanoCard(tid)).rejects.toThrow(NyanoTokenNotMintedError);
  });

  it("falls back to next RPC on connectivity error", async () => {
    const tid = freshTokenId();
    mockReadContract.mockRejectedValueOnce(makeConnectivityError("failed to fetch"));
    mockSuccessfulCardRead();

    const bundle = await fetchNyanoCard(tid);
    expect(bundle.tokenId).toBe(tid);
  });

  it("throws immediately on non-connectivity error (no fallback)", async () => {
    const tid = freshTokenId();
    mockReadContract.mockResolvedValueOnce(true); // exists
    // All 5 parallel reads reject with contract error
    for (let i = 0; i < 5; i++) {
      mockReadContract.mockRejectedValueOnce(makeContractError("execution reverted"));
    }

    await expect(fetchNyanoCard(tid)).rejects.toThrow("execution reverted");
  });

  it("persists working RPC URL as lastOk", async () => {
    const tid = freshTokenId();
    mockSuccessfulCardRead();

    await fetchNyanoCard(tid);
    expect(getLastOkRpcUrl()).not.toBeNull();
  });

  it("throws on jankenHand out of range", async () => {
    const tid = freshTokenId();
    mockReadContract
      .mockResolvedValueOnce(true)                              // exists
      .mockResolvedValueOnce("0x1111111111111111111111111111111111111111") // ownerOf
      .mockResolvedValueOnce(5n)                                // getJankenHand = 5 (invalid!)
      .mockResolvedValueOnce([1n, 2n, 3n])
      .mockResolvedValueOnce([100n, 50n, 30n, 40n, 20n, 60n])
      .mockResolvedValueOnce([5n, 3n, 2n, 7n]);

    await expect(fetchNyanoCard(tid)).rejects.toThrow("jankenHand out of range");
  });

  it("clears cache on rejection allowing retry", async () => {
    const tid = freshTokenId();
    // First call: contract error → not cached
    mockReadContract.mockResolvedValueOnce(true);
    mockReadContract.mockRejectedValueOnce(makeContractError("execution reverted"));

    await expect(fetchNyanoCard(tid)).rejects.toThrow("execution reverted");

    // Wait for cache cleanup microtask
    await new Promise((r) => setTimeout(r, 10));

    // Second call: success → should work (cache was cleared)
    mockSuccessfulCardRead();
    const bundle = await fetchNyanoCard(tid);
    expect(bundle.tokenId).toBe(tid);
  });

  it("uses getNyanoAddress for contract address", async () => {
    const tid = freshTokenId();
    (import.meta.env as Record<string, unknown>).VITE_NYANO_ADDRESS = "0xCustomAddress";
    mockSuccessfulCardRead();

    await fetchNyanoCard(tid);
    // Verify readContract was called with custom address
    expect(mockReadContract).toHaveBeenCalledWith(
      expect.objectContaining({ address: "0xCustomAddress" }),
    );
  });
});

/* ══════════════════════════════════════════════════════════════════════
   10. fetchNyanoCards
   ══════════════════════════════════════════════════════════════════════ */

describe("fetchNyanoCards", () => {
  it("returns Map for all-success case", async () => {
    const t1 = freshTokenId();
    const t2 = freshTokenId();
    // Use mockImplementation keyed on functionName to handle non-deterministic
    // parallel execution order (Promise.allSettled + Promise.all inside)
    mockReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
      switch (functionName) {
        case "exists": return Promise.resolve(true);
        case "ownerOf": return Promise.resolve("0x1111111111111111111111111111111111111111");
        case "getJankenHand": return Promise.resolve(1n);
        case "getTrait": return Promise.resolve([1n, 2n, 3n]);
        case "getCombatStats": return Promise.resolve([100n, 50n, 30n, 40n, 20n, 60n]);
        case "getTriad": return Promise.resolve([5n, 3n, 2n, 7n]);
        default: return Promise.reject(new Error(`unexpected function: ${functionName}`));
      }
    });

    const map = await fetchNyanoCards([t1, t2]);
    expect(map.size).toBe(2);
    expect(map.get(t1)?.tokenId).toBe(t1);
    expect(map.get(t2)?.tokenId).toBe(t2);
  });

  it("deduplicates input tokenIds", async () => {
    const tid = freshTokenId();
    mockSuccessfulCardRead(); // only 1 card read needed

    const map = await fetchNyanoCards([tid, tid, tid]);
    expect(map.size).toBe(1);
    // Only 6 readContract calls (not 18)
    expect(mockReadContract).toHaveBeenCalledTimes(6);
  });

  it("rethrows RPC connectivity error when all fail", async () => {
    const tid = freshTokenId();
    const cands = getRpcCandidates();
    for (let i = 0; i < cands.length; i++) {
      mockReadContract.mockRejectedValueOnce(makeConnectivityError("failed to fetch"));
    }

    await expect(fetchNyanoCards([tid])).rejects.toThrow("RPC接続に失敗");
  });

  it("reports NyanoTokenNotMintedError with tokenId listing", async () => {
    const tid = freshTokenId();
    mockReadContract.mockResolvedValueOnce(false); // exists = false

    try {
      await fetchNyanoCards([tid]);
      expect.unreachable("should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain("存在しない tokenId");
      expect(msg).toContain(tid.toString());
    }
  });

  it("reports mixed errors with detailed message", async () => {
    const t1 = freshTokenId();
    const t2 = freshTokenId();

    // t1: NyanoTokenNotMintedError
    mockReadContract.mockResolvedValueOnce(false);
    // t2: contract error
    mockReadContract.mockResolvedValueOnce(true);
    mockReadContract.mockRejectedValueOnce(makeContractError("execution reverted"));

    try {
      await fetchNyanoCards([t1, t2]);
      expect.unreachable("should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain("カード読み込みに失敗");
      expect(msg).toContain("存在しない tokenId");
      expect(msg).toContain("その他のエラー");
      expect(msg).toContain("ヒント");
    }
  });

  it("truncates when more than 6 other errors", async () => {
    const tids = Array.from({ length: 8 }, () => freshTokenId());

    // All 8 tokens: exists=true then contract error
    for (let i = 0; i < 8; i++) {
      mockReadContract.mockResolvedValueOnce(true);
      mockReadContract.mockRejectedValueOnce(makeContractError(`error-${i}`));
    }

    try {
      await fetchNyanoCards(tids);
      expect.unreachable("should have thrown");
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain("… and 2 more");
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════
   11. fetchMintedTokenIds
   ══════════════════════════════════════════════════════════════════════ */

describe("fetchMintedTokenIds", () => {
  it("throws for non-positive count", async () => {
    await expect(fetchMintedTokenIds(0)).rejects.toThrow("count must be positive");
    await expect(fetchMintedTokenIds(-1)).rejects.toThrow("count must be positive");
  });

  it("returns empty array when totalSupply is 0", async () => {
    mockReadContract.mockResolvedValueOnce(0n); // totalSupply
    const result = await fetchMintedTokenIds(5);
    expect(result).toEqual([]);
  });

  it("returns correct tokenIds from sequential enumeration", async () => {
    mockReadContract.mockResolvedValueOnce(100n);  // totalSupply
    mockReadContract.mockResolvedValueOnce(42n);   // tokenByIndex(0)
    mockReadContract.mockResolvedValueOnce(99n);   // tokenByIndex(1)
    mockReadContract.mockResolvedValueOnce(150n);  // tokenByIndex(2)

    const result = await fetchMintedTokenIds(3);
    expect(result).toEqual([42n, 99n, 150n]);
  });

  it("falls back on connectivity error", async () => {
    // First RPC: connectivity error on totalSupply
    mockReadContract.mockRejectedValueOnce(makeConnectivityError("timeout"));
    // Second RPC: success
    mockReadContract.mockResolvedValueOnce(10n);   // totalSupply
    mockReadContract.mockResolvedValueOnce(1n);    // tokenByIndex(0)
    mockReadContract.mockResolvedValueOnce(2n);    // tokenByIndex(1)

    const result = await fetchMintedTokenIds(2);
    expect(result).toEqual([1n, 2n]);
  });

  it("throws makeRpcFailureError when all candidates fail", async () => {
    const cands = getRpcCandidates();
    for (let i = 0; i < cands.length; i++) {
      mockReadContract.mockRejectedValueOnce(makeConnectivityError("failed to fetch"));
    }

    await expect(fetchMintedTokenIds(1)).rejects.toThrow("RPC接続に失敗");
  });
});
