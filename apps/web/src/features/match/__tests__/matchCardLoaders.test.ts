import { describe, expect, it } from "vitest";
import type { CardData } from "@nyano/triad-engine";
import type { EventV1 } from "@/lib/events";
import {
  loadMatchCardsFromIndex,
  loadMatchCardsFromRpc,
  resolveRpcLoadErrorToastKind,
  resolveRpcLoadErrorToastMessage,
} from "@/features/match/matchCardLoaders";

function card(tokenId: bigint): CardData {
  return {
    tokenId,
    edges: { up: 1, right: 2, down: 3, left: 4 },
    jankenHand: 0,
    combatStatSum: 10,
    trait: "none",
  };
}

function baseEvent(): EventV1 {
  return {
    id: "evt_test",
    title: "test",
    description: "test",
    kind: "nyano_ai_challenge",
    rulesetKey: "v2",
    seasonId: 1,
    firstPlayer: 0,
    aiDifficulty: "easy",
    nyanoDeckTokenIds: ["1", "2", "3", "4", "5"],
  };
}

describe("features/match/matchCardLoaders", () => {
  it("returns guest fallback when index is unavailable in guest mode", async () => {
    const result = await loadMatchCardsFromIndex(
      {
        isGuestMode: true,
        deckATokens: [],
        deckBTokens: [],
        event: null,
      },
      {
        fetchGameIndex: async () => null,
      },
    );
    expect(result.kind).toBe("guest_fallback");
    if (result.kind !== "guest_fallback") return;
    expect(result.error).toContain("フォールバック");
    expect(result.status).toContain("フォールバックデッキ");
    expect(result.cardsByTokenId.size).toBeGreaterThan(0);
  });

  it("returns explicit error when index is unavailable in non-guest mode", async () => {
    const result = await loadMatchCardsFromIndex(
      {
        isGuestMode: false,
        deckATokens: [1n, 2n, 3n, 4n, 5n],
        deckBTokens: [6n, 7n, 8n, 9n, 10n],
        event: null,
      },
      {
        fetchGameIndex: async () => null,
      },
    );
    expect(result).toEqual({
      kind: "error",
      error: "Game Index が利用できません。Verified モードをお試しください。",
    });
  });

  it("reports missing token ids when index data is incomplete", async () => {
    const result = await loadMatchCardsFromIndex(
      {
        isGuestMode: false,
        deckATokens: [1n],
        deckBTokens: [2n],
        event: null,
      },
      {
        fetchGameIndex: async () => ({}) as never,
        buildCardDataFromIndex: () => new Map<bigint, CardData>([[1n, card(1n)]]),
      },
    );
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.error).toContain("tokenId が不足");
    expect(result.error).toContain("2");
  });

  it("loads RPC cards and auto-picks minted Nyano deck when event uses placeholder deck", async () => {
    const minted = [11n, 12n, 13n, 14n, 15n];
    const result = await loadMatchCardsFromRpc(
      {
        deckATokens: [1n, 2n, 3n, 4n, 5n],
        deckBTokens: [101n, 102n, 103n, 104n, 105n],
        event: baseEvent(),
        eventNyanoDeckOverride: null,
        playerA: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        playerB: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
      {
        now: () => 123,
        fetchMintedTokenIds: async () => minted,
        fetchNyanoCards: async (tokenIds: bigint[]) => {
          const map = new Map<bigint, { card: CardData; owner: `0x${string}` }>();
          for (const tid of tokenIds) {
            map.set(tid, {
              card: card(tid),
              owner: "0x1111111111111111111111111111111111111111",
            });
          }
          return map as never;
        },
      },
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.eventNyanoDeckOverride).toEqual(minted);
    expect(result.mintedAutoPickSummary).toContain("#11");
    expect(result.status).toContain("Verified");
    expect(result.rpcStatus).toEqual({ ok: true, timestampMs: 123 });
    expect(result.nextPlayerA).toBe("0x1111111111111111111111111111111111111111");
    // Existing behavior: playerB owner still resolves by original deckBTokens[0], so fallback remains.
    expect(result.nextPlayerB).toBe("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  });

  it("returns RPC error payload with toast kind hints", async () => {
    const result = await loadMatchCardsFromRpc(
      {
        deckATokens: [1n, 2n, 3n, 4n, 5n],
        deckBTokens: [6n, 7n, 8n, 9n, 10n],
        event: null,
        eventNyanoDeckOverride: null,
        playerA: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        playerB: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
      {
        now: () => 999,
        fetchNyanoCards: async () => {
          throw new Error("missing tokenId");
        },
      },
    );
    expect(result.kind).toBe("error");
    if (result.kind !== "error") return;
    expect(result.toastKind).toBe("missing_tokenid");
    expect(result.rpcStatus).toEqual({
      ok: false,
      message: "missing tokenId",
      timestampMs: 999,
    });
  });

  it("classifies RPC error toast kinds", () => {
    expect(resolveRpcLoadErrorToastKind("missing tokenId")).toBe("missing_tokenid");
    expect(resolveRpcLoadErrorToastKind("RPC request failed")).toBe("rpc");
    expect(resolveRpcLoadErrorToastKind("other")).toBeNull();
  });

  it("resolves RPC toast messages from toast kind", () => {
    expect(resolveRpcLoadErrorToastMessage("missing_tokenid")).toContain("Could not resolve tokenId");
    expect(resolveRpcLoadErrorToastMessage("rpc")).toContain("RPC request failed");
    expect(resolveRpcLoadErrorToastMessage(null)).toBeNull();
  });
});
