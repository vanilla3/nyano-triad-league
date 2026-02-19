import React from "react";
import type { CardData } from "@nyano/triad-engine";
import type { EventV1 } from "@/lib/events";
import type { MatchDataMode } from "@/features/match/urlParams";
import {
  loadMatchCardsFromIndex,
  loadMatchCardsFromRpc,
  resolveRpcLoadErrorToastMessage,
  type RpcStatusSummary,
} from "@/features/match/matchCardLoaders";

type MatchCardLoadToast = {
  warn: (title: string, message: string) => void;
  success: (title: string, message: string) => void;
};

type CreateMatchCardLoadActionsInput = {
  isGuestMode: boolean;
  dataMode: MatchDataMode;
  hasDeckA: boolean;
  deckATokens: readonly bigint[];
  deckBTokens: readonly bigint[];
  event: EventV1 | null;
  eventNyanoDeckOverride: readonly bigint[] | null;
  playerA: `0x${string}`;
  playerB: `0x${string}`;
  setLoading: (next: boolean) => void;
  setError: (next: string | null) => void;
  setStatus: (next: string | null) => void;
  setCards: (next: Map<bigint, CardData> | null) => void;
  setOwners: (next: Map<bigint, `0x${string}`> | null) => void;
  setPlayerA: (next: `0x${string}`) => void;
  setPlayerB: (next: `0x${string}`) => void;
  setGuestDeckATokens: (next: bigint[]) => void;
  setGuestDeckBTokens: (next: bigint[]) => void;
  setEventNyanoDeckOverride: (next: bigint[] | null) => void;
  rpcStatusRef: React.MutableRefObject<RpcStatusSummary | undefined>;
  toast: MatchCardLoadToast;
};

type CreateMatchCardLoadActionsDeps = {
  loadIndexCards?: typeof loadMatchCardsFromIndex;
  loadRpcCards?: typeof loadMatchCardsFromRpc;
  resolveRpcToastMessage?: typeof resolveRpcLoadErrorToastMessage;
};

type MatchCardLoadActions = {
  loadCardsFromIndex: () => Promise<void>;
  loadCardsFromRpc: () => Promise<void>;
  loadCards: () => Promise<void>;
};

export function createMatchCardLoadActions(
  input: CreateMatchCardLoadActionsInput,
  deps?: CreateMatchCardLoadActionsDeps,
): MatchCardLoadActions {
  const loadIndexCards = deps?.loadIndexCards ?? loadMatchCardsFromIndex;
  const loadRpcCards = deps?.loadRpcCards ?? loadMatchCardsFromRpc;
  const resolveRpcToastMessage = deps?.resolveRpcToastMessage ?? resolveRpcLoadErrorToastMessage;

  const loadCardsFromIndex = async () => {
    input.setError(null);
    input.setStatus(null);
    input.setLoading(true);
    const result = await loadIndexCards({
      isGuestMode: input.isGuestMode,
      deckATokens: input.deckATokens,
      deckBTokens: input.deckBTokens,
      event: input.event,
    });
    if (result.kind === "guest_fallback") {
      input.setGuestDeckATokens(result.deckATokens);
      input.setGuestDeckBTokens(result.deckBTokens);
      input.setCards(result.cardsByTokenId);
      input.setOwners(null);
      input.setPlayerA(result.playerA);
      input.setPlayerB(result.playerB);
      input.setError(result.error);
      input.setStatus(result.status);
      input.toast.warn("Game Index unavailable", "Loaded guest fallback cards.");
    } else if (result.kind === "guest_success") {
      input.setGuestDeckATokens(result.deckATokens);
      input.setGuestDeckBTokens(result.deckBTokens);
      input.setCards(result.cardsByTokenId);
      input.setOwners(null);
      input.setPlayerA(result.playerA);
      input.setPlayerB(result.playerB);
      input.setStatus(result.status);
    } else if (result.kind === "normal_success") {
      input.setCards(result.cardsByTokenId);
      input.setOwners(null);
      input.setStatus(result.status);
    } else {
      input.setError(result.error);
    }
    input.setLoading(false);
  };

  const loadCardsFromRpc = async () => {
    input.setError(null);
    input.setStatus(null);

    if (!input.hasDeckA || input.deckATokens.length !== 5) {
      input.setError("Select Deck A before loading.");
      return;
    }
    if (input.deckBTokens.length !== 5) {
      input.setError("Deck B must contain 5 cards.");
      return;
    }

    input.setLoading(true);
    const result = await loadRpcCards({
      deckATokens: input.deckATokens,
      deckBTokens: input.deckBTokens,
      event: input.event,
      eventNyanoDeckOverride: input.eventNyanoDeckOverride,
      playerA: input.playerA,
      playerB: input.playerB,
    });
    if (result.kind === "success") {
      if (result.eventNyanoDeckOverride) {
        input.setEventNyanoDeckOverride(result.eventNyanoDeckOverride);
      }
      if (result.mintedAutoPickSummary) {
        input.toast.success("Nyano繝・ャ繧ｭ繧定・蜍暮∈謚槭＠縺ｾ縺励◆", result.mintedAutoPickSummary);
      }
      input.setCards(result.cardsByTokenId);
      input.setOwners(result.ownersByTokenId);
      input.setPlayerA(result.nextPlayerA);
      input.setPlayerB(result.nextPlayerB);
      input.setStatus(result.status);
      input.rpcStatusRef.current = result.rpcStatus;
    } else {
      input.setError(result.error);
      input.rpcStatusRef.current = result.rpcStatus;
      const toastMessage = resolveRpcToastMessage(result.toastKind);
      if (toastMessage) input.toast.warn("Card load failed", toastMessage);
    }
    input.setLoading(false);
  };

  const loadCards = () => {
    if (input.isGuestMode || input.dataMode === "fast") {
      return loadCardsFromIndex();
    }
    return loadCardsFromRpc();
  };

  return {
    loadCardsFromIndex,
    loadCardsFromRpc,
    loadCards,
  };
}

export function useMatchCardLoadActions(
  input: CreateMatchCardLoadActionsInput,
): MatchCardLoadActions {
  const {
    dataMode,
    deckATokens,
    deckBTokens,
    event,
    eventNyanoDeckOverride,
    hasDeckA,
    isGuestMode,
    playerA,
    playerB,
    rpcStatusRef,
    setCards,
    setError,
    setEventNyanoDeckOverride,
    setGuestDeckATokens,
    setGuestDeckBTokens,
    setLoading,
    setOwners,
    setPlayerA,
    setPlayerB,
    setStatus,
    toast,
  } = input;

  return React.useMemo(
    () =>
      createMatchCardLoadActions({
        isGuestMode,
        dataMode,
        hasDeckA,
        deckATokens,
        deckBTokens,
        event,
        eventNyanoDeckOverride,
        playerA,
        playerB,
        setLoading,
        setError,
        setStatus,
        setCards,
        setOwners,
        setPlayerA,
        setPlayerB,
        setGuestDeckATokens,
        setGuestDeckBTokens,
        setEventNyanoDeckOverride,
        rpcStatusRef,
        toast,
      }),
    [
      dataMode,
      deckATokens,
      deckBTokens,
      event,
      eventNyanoDeckOverride,
      hasDeckA,
      isGuestMode,
      playerA,
      playerB,
      rpcStatusRef,
      setCards,
      setError,
      setEventNyanoDeckOverride,
      setGuestDeckATokens,
      setGuestDeckBTokens,
      setLoading,
      setOwners,
      setPlayerA,
      setPlayerB,
      setStatus,
      toast,
    ],
  );
}
