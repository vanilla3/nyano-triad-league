import type { CardData } from "@nyano/triad-engine";
import type { EventV1 } from "@/lib/events";
import { parseDeckRestriction, validateDeckAgainstRestriction } from "@/lib/deck_restriction";
import {
  buildCardDataFromIndex,
  buildEmergencyGuestFallbackData,
  generateBalancedDemoPair,
} from "@/lib/demo_decks";
import { errorMessage } from "@/lib/errorMessage";
import { fetchGameIndex } from "@/lib/nyano/gameIndex";
import { fetchMintedTokenIds, fetchNyanoCards } from "@/lib/nyano_rpc";

const GUEST_PLAYER_A = "0x0000000000000000000000000000000000000001" as `0x${string}`;
const GUEST_PLAYER_B = "0x0000000000000000000000000000000000000002" as `0x${string}`;

type MatchCardLoaderDeps = {
  fetchGameIndex: typeof fetchGameIndex;
  buildCardDataFromIndex: typeof buildCardDataFromIndex;
  buildEmergencyGuestFallbackData: typeof buildEmergencyGuestFallbackData;
  generateBalancedDemoPair: typeof generateBalancedDemoPair;
  fetchMintedTokenIds: typeof fetchMintedTokenIds;
  fetchNyanoCards: typeof fetchNyanoCards;
  now: () => number;
};

const DEFAULT_DEPS: MatchCardLoaderDeps = {
  fetchGameIndex,
  buildCardDataFromIndex,
  buildEmergencyGuestFallbackData,
  generateBalancedDemoPair,
  fetchMintedTokenIds,
  fetchNyanoCards,
  now: () => Date.now(),
};

export type IndexLoadResult =
  | {
      kind: "guest_fallback";
      deckATokens: bigint[];
      deckBTokens: bigint[];
      cardsByTokenId: Map<bigint, CardData>;
      playerA: `0x${string}`;
      playerB: `0x${string}`;
      error: string;
      status: string;
    }
  | {
      kind: "guest_success";
      deckATokens: bigint[];
      deckBTokens: bigint[];
      cardsByTokenId: Map<bigint, CardData>;
      playerA: `0x${string}`;
      playerB: `0x${string}`;
      status: string;
    }
  | {
      kind: "normal_success";
      cardsByTokenId: Map<bigint, CardData>;
      status: string;
    }
  | {
      kind: "error";
      error: string;
    };

function buildGuestFallbackResult(
  reason: string,
  deps: MatchCardLoaderDeps,
): Extract<IndexLoadResult, { kind: "guest_fallback" }> {
  const fallback = deps.buildEmergencyGuestFallbackData();
  return {
    kind: "guest_fallback",
    deckATokens: fallback.deckATokenIds,
    deckBTokens: fallback.deckBTokenIds,
    cardsByTokenId: fallback.cardsByTokenId,
    playerA: GUEST_PLAYER_A,
    playerB: GUEST_PLAYER_B,
    error: `Game Index の読み込みに失敗したため、フォールバックのゲストデッキを使用しました。(${reason})`,
    status: `ゲストモード: フォールバックデッキを読み込みました（${fallback.cardsByTokenId.size}枚）`,
  };
}

export async function loadMatchCardsFromIndex(
  input: {
    isGuestMode: boolean;
    deckATokens: readonly bigint[];
    deckBTokens: readonly bigint[];
    event: EventV1 | null;
  },
  depsPartial?: Partial<MatchCardLoaderDeps>,
): Promise<IndexLoadResult> {
  const deps: MatchCardLoaderDeps = { ...DEFAULT_DEPS, ...(depsPartial ?? {}) };
  try {
    const index = await deps.fetchGameIndex();
    if (!index) {
      if (input.isGuestMode) return buildGuestFallbackResult("index unavailable", deps);
      return { kind: "error", error: "Game Index が利用できません。Verified モードをお試しください。" };
    }

    if (input.isGuestMode) {
      const pair = deps.generateBalancedDemoPair(index);
      const deckATokens = pair.deckA.tokenIds.map((x) => BigInt(x));
      const deckBTokens = pair.deckB.tokenIds.map((x) => BigInt(x));
      const allTokenIds = [...pair.deckA.tokenIds, ...pair.deckB.tokenIds];
      const cardsByTokenId = deps.buildCardDataFromIndex(index, allTokenIds);
      return {
        kind: "guest_success",
        deckATokens,
        deckBTokens,
        cardsByTokenId,
        playerA: GUEST_PLAYER_A,
        playerB: GUEST_PLAYER_B,
        status: `ゲストモード: game index から ${cardsByTokenId.size} 枚読み込みました`,
      };
    }

    const allTokenIds = [...input.deckATokens, ...input.deckBTokens].map((t) => t.toString());
    const cardsByTokenId = deps.buildCardDataFromIndex(index, allTokenIds);
    if (cardsByTokenId.size < allTokenIds.length) {
      const missing = allTokenIds.filter((id) => !cardsByTokenId.has(BigInt(id)));
      return {
        kind: "error",
        error: `Game Index に tokenId が不足しています: ${missing.join(", ")}。Verified モードをお試しください。`,
      };
    }

    if (input.event?.deckRestriction) {
      const rule = parseDeckRestriction(input.event.deckRestriction);
      const playerTokenIds = input.deckATokens.map((t) => t.toString());
      const validation = validateDeckAgainstRestriction(playerTokenIds, rule);
      if (!validation.valid) {
        return {
          kind: "error",
          error: `デッキ制限違反 (${rule.label}): ${validation.violations.join("; ")}`,
        };
      }
    }

    return {
      kind: "normal_success",
      cardsByTokenId,
      status: `Fast モード: game index から ${cardsByTokenId.size} 枚読み込みました`,
    };
  } catch (e: unknown) {
    const msg = errorMessage(e);
    if (input.isGuestMode) return buildGuestFallbackResult(msg, deps);
    return { kind: "error", error: `Game Index 読み込み失敗: ${msg}` };
  }
}

export type RpcStatusSummary = { ok: boolean; message?: string; timestampMs: number };
export type RpcLoadErrorToastKind = "missing_tokenid" | "rpc" | null;

export function resolveRpcLoadErrorToastKind(message: string): RpcLoadErrorToastKind {
  const normalized = message.toLowerCase();
  if (normalized.includes("missing tokenid")) return "missing_tokenid";
  if (
    normalized.includes("failed to fetch")
    || normalized.includes("http request failed")
    || normalized.includes("rpc")
    || normalized.includes("cors")
    || normalized.includes("429")
  ) {
    return "rpc";
  }
  return null;
}

export function resolveRpcLoadErrorToastMessage(kind: RpcLoadErrorToastKind): string | null {
  if (kind === "missing_tokenid") {
    return "Could not resolve tokenId in on-chain data. Please retry on /nyano.";
  }
  if (kind === "rpc") {
    return "RPC request failed. Check nyano RPC settings and retry.";
  }
  return null;
}

export type RpcLoadResult =
  | {
      kind: "success";
      cardsByTokenId: Map<bigint, CardData>;
      ownersByTokenId: Map<bigint, `0x${string}`>;
      eventNyanoDeckOverride: bigint[] | null;
      status: string;
      rpcStatus: RpcStatusSummary;
      nextPlayerA: `0x${string}`;
      nextPlayerB: `0x${string}`;
      mintedAutoPickSummary: string | null;
    }
  | {
      kind: "error";
      error: string;
      rpcStatus: RpcStatusSummary;
      toastKind: RpcLoadErrorToastKind;
    };

export async function loadMatchCardsFromRpc(
  input: {
    deckATokens: readonly bigint[];
    deckBTokens: readonly bigint[];
    event: EventV1 | null;
    eventNyanoDeckOverride: readonly bigint[] | null;
    playerA: `0x${string}`;
    playerB: `0x${string}`;
  },
  depsPartial?: Partial<MatchCardLoaderDeps>,
): Promise<RpcLoadResult> {
  const deps: MatchCardLoaderDeps = { ...DEFAULT_DEPS, ...(depsPartial ?? {}) };
  try {
    let deckBForLoad = [...input.deckBTokens];
    let eventNyanoDeckOverride: bigint[] | null = null;
    let mintedAutoPickSummary: string | null = null;

    if (input.event && !input.eventNyanoDeckOverride) {
      const raw = input.event.nyanoDeckTokenIds.join(",");
      if (raw === "1,2,3,4,5") {
        const minted = await deps.fetchMintedTokenIds(5, 0);
        deckBForLoad = minted;
        eventNyanoDeckOverride = minted;
        mintedAutoPickSummary = minted.map((t) => `#${t.toString()}`).join(", ");
      }
    }

    const tokenIds = [...input.deckATokens, ...deckBForLoad];
    const bundles = await deps.fetchNyanoCards(tokenIds);
    const cardsByTokenId = new Map<bigint, CardData>();
    const ownersByTokenId = new Map<bigint, `0x${string}`>();
    for (const [tid, b] of bundles.entries()) {
      cardsByTokenId.set(tid, b.card);
      ownersByTokenId.set(tid, b.owner);
    }

    const a0 = input.deckATokens[0];
    const b0 = input.deckBTokens[0];
    const nextPlayerA = a0 !== undefined ? (ownersByTokenId.get(a0) ?? input.playerA) : input.playerA;
    const nextPlayerB = b0 !== undefined ? (ownersByTokenId.get(b0) ?? input.playerB) : input.playerB;

    return {
      kind: "success",
      cardsByTokenId,
      ownersByTokenId,
      eventNyanoDeckOverride,
      status: `Verified: mainnet から ${bundles.size} 枚読み込みました`,
      rpcStatus: { ok: true, timestampMs: deps.now() },
      nextPlayerA,
      nextPlayerB,
      mintedAutoPickSummary,
    };
  } catch (e: unknown) {
    const msg = errorMessage(e);
    return {
      kind: "error",
      error: msg,
      rpcStatus: { ok: false, message: msg, timestampMs: deps.now() },
      toastKind: resolveRpcLoadErrorToastKind(msg),
    };
  }
}
