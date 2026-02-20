import { describe, expect, it } from "vitest";
import { resolveReplayPreloadTokenIds } from "@/features/match/replayPreloadTokenIds";

describe("features/match/replayPreloadTokenIds", () => {
  it("returns unique token ids while preserving first-seen order", () => {
    const tokenIds = resolveReplayPreloadTokenIds({
      deckA: [10n, 11n, 12n, 10n],
      deckB: [12n, 13n, 14n, 11n],
    });
    expect(tokenIds).toEqual([10n, 11n, 12n, 13n, 14n]);
  });

  it("returns empty list when both decks are empty", () => {
    const tokenIds = resolveReplayPreloadTokenIds({
      deckA: [],
      deckB: [],
    });
    expect(tokenIds).toEqual([]);
  });
});
