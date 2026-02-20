import { describe, expect, it, vi } from "vitest";
import type { CardData, TranscriptV1 } from "@nyano/triad-engine";
import type { ParsedReplay } from "@/lib/replay_bundle";
import {
  formatReplayMissingCardsError,
  resolveReplayCardsFromPayload,
} from "@/features/match/replayCardLoaders";

function createCard(tokenId: bigint): CardData {
  return {
    tokenId,
    edges: { up: 1, right: 2, down: 3, left: 4 },
    jankenHand: 0,
    combatStatSum: 10,
    trait: "none",
  };
}

function createTranscript(deckA: bigint[], deckB: bigint[]): TranscriptV1 {
  return {
    header: {
      version: 1,
      rulesetId: "0x01",
      seasonId: 1,
      playerA: "0x0000000000000000000000000000000000000001",
      playerB: "0x0000000000000000000000000000000000000002",
      deckA,
      deckB,
      firstPlayer: 0,
      deadline: 0,
      salt: "0x0",
    },
    turns: [],
  } as TranscriptV1;
}

describe("features/match/replayCardLoaders", () => {
  it("uses embedded v2 cards and skips resolveCards", async () => {
    const embeddedCards = new Map<bigint, CardData>([
      [1n, createCard(1n)],
      [2n, createCard(2n)],
    ]);
    const parsed = {
      version: 2,
      transcript: createTranscript([1n], [2n]),
      cards: embeddedCards,
    } as ParsedReplay;
    const resolveCardsSpy = vi.fn();

    const result = await resolveReplayCardsFromPayload(
      { parsed },
      { resolveCards: resolveCardsSpy as never },
    );

    expect(result.cards).toBe(embeddedCards);
    expect(result.owners.size).toBe(0);
    expect(resolveCardsSpy).not.toHaveBeenCalled();
  });

  it("resolves v1 cards via resolveCards and keeps owners map", async () => {
    const parsed = {
      version: 1,
      transcript: createTranscript([1n, 2n, 1n], [3n, 4n, 5n]),
    } as ParsedReplay;
    const cards = new Map<bigint, CardData>([
      [1n, createCard(1n)],
      [2n, createCard(2n)],
      [3n, createCard(3n)],
      [4n, createCard(4n)],
      [5n, createCard(5n)],
    ]);
    const owners = new Map<bigint, `0x${string}`>([
      [1n, "0x00000000000000000000000000000000000000aa"],
    ]);
    const resolveCardsSpy = vi.fn().mockResolvedValue({ cards, owners });

    const result = await resolveReplayCardsFromPayload(
      { parsed },
      { resolveCards: resolveCardsSpy as never },
    );

    expect(resolveCardsSpy).toHaveBeenCalledWith([1n, 2n, 1n, 3n, 4n, 5n]);
    expect(result.cards).toBe(cards);
    expect(result.owners).toBe(owners);
  });

  it("throws a clear error when v1 cards are partially missing", async () => {
    const parsed = {
      version: 1,
      transcript: createTranscript([1n, 2n, 3n, 4n, 5n], [6n, 7n, 8n, 9n, 10n]),
    } as ParsedReplay;
    const cards = new Map<bigint, CardData>([
      [1n, createCard(1n)],
      [2n, createCard(2n)],
      [3n, createCard(3n)],
      [4n, createCard(4n)],
    ]);
    const resolveCardsSpy = vi.fn().mockResolvedValue({ cards, owners: new Map() });

    await expect(
      resolveReplayCardsFromPayload(
        { parsed },
        { resolveCards: resolveCardsSpy as never },
      ),
    ).rejects.toThrow(formatReplayMissingCardsError(["5", "6", "7", "8", "9", "10"]));
  });
});
