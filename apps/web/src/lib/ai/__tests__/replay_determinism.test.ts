import { describe, it, expect } from "vitest";
import {
  simulateMatchV1WithHistory,
  DEFAULT_RULESET_CONFIG_V1,
} from "@nyano/triad-engine";
import type {
  CardData,
  TranscriptV1,
  BoardState,
} from "@nyano/triad-engine";

/* ═══════════════════════════════════════════════════════════════════
   replay_determinism.test.ts

   Phase 1 Stability: Formally verify that the engine is deterministic.
   Same transcript + same cards → same board states every time.
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Helpers ─── */

function mkCard(
  tokenId: bigint,
  edges: [number, number, number, number],
  jankenHand: 0 | 1 | 2,
): CardData {
  return {
    tokenId,
    edges: { up: edges[0], right: edges[1], down: edges[2], left: edges[3] },
    jankenHand,
    combatStatSum: edges[0] + edges[1] + edges[2] + edges[3],
  };
}

/** Build a cards map from an array of CardData. */
function toCardMap(cards: CardData[]): Map<bigint, CardData> {
  return new Map(cards.map((c) => [c.tokenId, c]));
}

/** Serialize a board state to a comparable string (strip functions, handle bigints). */
function serializeBoard(board: BoardState): string {
  return JSON.stringify(board, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}

/* ─── Test fixtures ─── */

// 10 distinct cards (5 per player) with varying edges and janken hands
const CARDS: CardData[] = [
  // Deck A (tokenIds 1-5): mixed strengths
  mkCard(1n, [7, 3, 5, 4], 0), // Rock
  mkCard(2n, [4, 6, 3, 5], 1), // Paper
  mkCard(3n, [5, 5, 5, 5], 2), // Scissors
  mkCard(4n, [8, 2, 4, 6], 0), // Rock
  mkCard(5n, [3, 7, 6, 3], 1), // Paper
  // Deck B (tokenIds 6-10): mixed strengths
  mkCard(6n, [4, 5, 6, 3], 2), // Scissors
  mkCard(7n, [6, 4, 3, 7], 0), // Rock
  mkCard(8n, [3, 8, 4, 5], 1), // Paper
  mkCard(9n, [5, 3, 7, 4], 2), // Scissors
  mkCard(10n, [4, 6, 5, 6], 0), // Rock
];

const CARD_MAP = toCardMap(CARDS);

const TRANSCRIPT: TranscriptV1 = {
  header: {
    version: 1,
    rulesetId: `0x${"11".repeat(32)}` as `0x${string}`,
    seasonId: 0,
    playerA: `0x${"aa".repeat(20)}` as `0x${string}`,
    playerB: `0x${"bb".repeat(20)}` as `0x${string}`,
    deckA: [1n, 2n, 3n, 4n, 5n],
    deckB: [6n, 7n, 8n, 9n, 10n],
    firstPlayer: 0,
    deadline: 9999999999,
    salt: `0x${"22".repeat(32)}` as `0x${string}`,
  },
  turns: [
    { cell: 4, cardIndex: 0 }, // A plays center
    { cell: 0, cardIndex: 0 }, // B plays top-left corner
    { cell: 2, cardIndex: 1 }, // A plays top-right corner
    { cell: 6, cardIndex: 1 }, // B plays bottom-left corner
    { cell: 8, cardIndex: 2 }, // A plays bottom-right corner
    { cell: 1, cardIndex: 2 }, // B plays top-center
    { cell: 3, cardIndex: 3 }, // A plays mid-left
    { cell: 5, cardIndex: 3 }, // B plays mid-right
    { cell: 7, cardIndex: 4 }, // A plays bottom-center
  ],
};

/* ═══════════════════════════════════════════════════════════════════
   Tests
   ═══════════════════════════════════════════════════════════════════ */

describe("Replay determinism", () => {
  it("produces identical board states across 3 runs", () => {
    const runs: { boardHistory: string[]; matchId: string; winner: string }[] = [];

    for (let i = 0; i < 3; i++) {
      const result = simulateMatchV1WithHistory(
        TRANSCRIPT,
        CARD_MAP,
        DEFAULT_RULESET_CONFIG_V1,
      );

      runs.push({
        boardHistory: result.boardHistory.map(serializeBoard),
        matchId: result.matchId,
        winner: String(result.winner),
      });
    }

    // All 3 runs must produce identical results
    for (let i = 1; i < runs.length; i++) {
      expect(runs[i].matchId).toBe(runs[0].matchId);
      expect(runs[i].winner).toBe(runs[0].winner);
      expect(runs[i].boardHistory.length).toBe(runs[0].boardHistory.length);

      // Compare every board state snapshot (initial + after each of 9 turns = 10 snapshots)
      for (let j = 0; j < runs[0].boardHistory.length; j++) {
        expect(runs[i].boardHistory[j]).toBe(runs[0].boardHistory[j]);
      }
    }
  });

  it("produces 10 board state snapshots (initial + 9 turns)", () => {
    const result = simulateMatchV1WithHistory(
      TRANSCRIPT,
      CARD_MAP,
      DEFAULT_RULESET_CONFIG_V1,
    );

    expect(result.boardHistory.length).toBe(10);
  });

  it("initial board state is empty", () => {
    const result = simulateMatchV1WithHistory(
      TRANSCRIPT,
      CARD_MAP,
      DEFAULT_RULESET_CONFIG_V1,
    );

    const initial = result.boardHistory[0];
    for (let i = 0; i < 9; i++) {
      expect(initial[i]).toBeNull();
    }
  });

  it("final board state has all 9 cells occupied", () => {
    const result = simulateMatchV1WithHistory(
      TRANSCRIPT,
      CARD_MAP,
      DEFAULT_RULESET_CONFIG_V1,
    );

    const final = result.boardHistory[9];
    for (let i = 0; i < 9; i++) {
      expect(final[i]).not.toBeNull();
    }
  });

  it("matchId is a valid hex string", () => {
    const result = simulateMatchV1WithHistory(
      TRANSCRIPT,
      CARD_MAP,
      DEFAULT_RULESET_CONFIG_V1,
    );

    expect(result.matchId).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("turn summaries have correct count", () => {
    const result = simulateMatchV1WithHistory(
      TRANSCRIPT,
      CARD_MAP,
      DEFAULT_RULESET_CONFIG_V1,
    );

    expect(result.turns.length).toBe(9);
  });
});
