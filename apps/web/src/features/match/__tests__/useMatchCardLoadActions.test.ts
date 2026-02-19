import { describe, expect, it, vi } from "vitest";
import type { CardData } from "@nyano/triad-engine";
import {
  createMatchCardLoadActions,
} from "@/features/match/useMatchCardLoadActions";

function card(tokenId: bigint): CardData {
  return {
    tokenId,
    edges: { up: 1, right: 2, down: 3, left: 4 },
    jankenHand: 0,
    combatStatSum: 10,
    trait: "none",
  };
}

function createInput(overrides?: Partial<Parameters<typeof createMatchCardLoadActions>[0]>) {
  const input: Parameters<typeof createMatchCardLoadActions>[0] = {
    isGuestMode: false,
    dataMode: "verified",
    hasDeckA: true,
    deckATokens: [1n, 2n, 3n, 4n, 5n],
    deckBTokens: [6n, 7n, 8n, 9n, 10n],
    event: null,
    eventNyanoDeckOverride: null,
    playerA: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    playerB: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    setLoading: vi.fn(),
    setError: vi.fn(),
    setStatus: vi.fn(),
    setCards: vi.fn(),
    setOwners: vi.fn(),
    setPlayerA: vi.fn(),
    setPlayerB: vi.fn(),
    setGuestDeckATokens: vi.fn(),
    setGuestDeckBTokens: vi.fn(),
    setEventNyanoDeckOverride: vi.fn(),
    rpcStatusRef: { current: undefined },
    toast: {
      warn: vi.fn(),
      success: vi.fn(),
    },
  };
  return { ...input, ...(overrides ?? {}) };
}

describe("features/match/useMatchCardLoadActions", () => {
  it("applies guest fallback result from index loader", async () => {
    const input = createInput({
      isGuestMode: true,
      dataMode: "fast",
    });
    const cardsByTokenId = new Map<bigint, CardData>([[1n, card(1n)]]);
    const actions = createMatchCardLoadActions(input, {
      loadIndexCards: async () => ({
        kind: "guest_fallback",
        deckATokens: [1n, 2n, 3n, 4n, 5n],
        deckBTokens: [6n, 7n, 8n, 9n, 10n],
        cardsByTokenId,
        playerA: "0x1111111111111111111111111111111111111111",
        playerB: "0x2222222222222222222222222222222222222222",
        error: "fallback error",
        status: "fallback status",
      }),
    });

    await actions.loadCardsFromIndex();

    expect(input.setLoading).toHaveBeenNthCalledWith(1, true);
    expect(input.setLoading).toHaveBeenLastCalledWith(false);
    expect(input.setGuestDeckATokens).toHaveBeenCalledWith([1n, 2n, 3n, 4n, 5n]);
    expect(input.setGuestDeckBTokens).toHaveBeenCalledWith([6n, 7n, 8n, 9n, 10n]);
    expect(input.setCards).toHaveBeenCalledWith(cardsByTokenId);
    expect(input.setOwners).toHaveBeenCalledWith(null);
    expect(input.setPlayerA).toHaveBeenCalledWith("0x1111111111111111111111111111111111111111");
    expect(input.setPlayerB).toHaveBeenCalledWith("0x2222222222222222222222222222222222222222");
    expect(input.setError).toHaveBeenCalledWith("fallback error");
    expect(input.setStatus).toHaveBeenCalledWith("fallback status");
    expect(input.toast.warn).toHaveBeenCalledWith("Game Index unavailable", "Loaded guest fallback cards.");
  });

  it("stops RPC load when Deck A is missing", async () => {
    const input = createInput({
      hasDeckA: false,
    });
    const loadRpcCards = vi.fn();
    const actions = createMatchCardLoadActions(input, { loadRpcCards });

    await actions.loadCardsFromRpc();

    expect(loadRpcCards).not.toHaveBeenCalled();
    expect(input.setError).toHaveBeenLastCalledWith("Select Deck A before loading.");
    expect(input.setLoading).not.toHaveBeenCalled();
  });

  it("applies RPC success payload and updates status refs", async () => {
    const input = createInput();
    const cardsByTokenId = new Map<bigint, CardData>([[1n, card(1n)]]);
    const ownersByTokenId = new Map<bigint, `0x${string}`>([
      [1n, "0x3333333333333333333333333333333333333333"],
    ]);
    const rpcStatus = { ok: true as const, timestampMs: 123 };
    const actions = createMatchCardLoadActions(input, {
      loadRpcCards: async () => ({
        kind: "success",
        cardsByTokenId,
        ownersByTokenId,
        eventNyanoDeckOverride: [11n, 12n, 13n, 14n, 15n],
        status: "verified status",
        rpcStatus,
        nextPlayerA: "0x3333333333333333333333333333333333333333",
        nextPlayerB: "0x4444444444444444444444444444444444444444",
        mintedAutoPickSummary: "#11, #12, #13, #14, #15",
      }),
    });

    await actions.loadCardsFromRpc();

    expect(input.setLoading).toHaveBeenNthCalledWith(1, true);
    expect(input.setLoading).toHaveBeenLastCalledWith(false);
    expect(input.setEventNyanoDeckOverride).toHaveBeenCalledWith([11n, 12n, 13n, 14n, 15n]);
    expect(input.toast.success).toHaveBeenCalledWith(
      "Nyano繝・ャ繧ｭ繧定・蜍暮∈謚槭＠縺ｾ縺励◆",
      "#11, #12, #13, #14, #15",
    );
    expect(input.setCards).toHaveBeenCalledWith(cardsByTokenId);
    expect(input.setOwners).toHaveBeenCalledWith(ownersByTokenId);
    expect(input.setPlayerA).toHaveBeenCalledWith("0x3333333333333333333333333333333333333333");
    expect(input.setPlayerB).toHaveBeenCalledWith("0x4444444444444444444444444444444444444444");
    expect(input.setStatus).toHaveBeenCalledWith("verified status");
    expect(input.rpcStatusRef.current).toEqual(rpcStatus);
  });

  it("applies RPC error payload and toast mapping", async () => {
    const input = createInput();
    const rpcStatus = { ok: false as const, message: "boom", timestampMs: 999 };
    const actions = createMatchCardLoadActions(input, {
      loadRpcCards: async () => ({
        kind: "error",
        error: "boom",
        rpcStatus,
        toastKind: "rpc",
      }),
      resolveRpcToastMessage: () => "rpc toast",
    });

    await actions.loadCardsFromRpc();

    expect(input.setError).toHaveBeenCalledWith("boom");
    expect(input.rpcStatusRef.current).toEqual(rpcStatus);
    expect(input.toast.warn).toHaveBeenCalledWith("Card load failed", "rpc toast");
  });

  it("routes loadCards by mode", async () => {
    const fastInput = createInput({
      dataMode: "fast",
    });
    const fastIndexLoader = vi.fn(async () => ({ kind: "error", error: "index error" } as const));
    const fastRpcLoader = vi.fn(async () => ({
      kind: "error" as const,
      error: "rpc error",
      rpcStatus: { ok: false as const, message: "rpc error", timestampMs: 1 },
      toastKind: null,
    }));
    const fastActions = createMatchCardLoadActions(fastInput, {
      loadIndexCards: fastIndexLoader,
      loadRpcCards: fastRpcLoader,
    });
    await fastActions.loadCards();
    expect(fastIndexLoader).toHaveBeenCalledTimes(1);
    expect(fastRpcLoader).not.toHaveBeenCalled();

    const verifiedInput = createInput({
      dataMode: "verified",
    });
    const verifiedIndexLoader = vi.fn(async () => ({ kind: "error", error: "index error" } as const));
    const verifiedRpcLoader = vi.fn(async () => ({
      kind: "error" as const,
      error: "rpc error",
      rpcStatus: { ok: false as const, message: "rpc error", timestampMs: 2 },
      toastKind: null,
    }));
    const verifiedActions = createMatchCardLoadActions(verifiedInput, {
      loadIndexCards: verifiedIndexLoader,
      loadRpcCards: verifiedRpcLoader,
    });
    await verifiedActions.loadCards();
    expect(verifiedIndexLoader).not.toHaveBeenCalled();
    expect(verifiedRpcLoader).toHaveBeenCalledTimes(1);
  });
});
