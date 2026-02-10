import { describe, it, expect } from "vitest";
import {
  simulateMatchV1WithHistory,
  verifyReplayV1,
  DEFAULT_RULESET_CONFIG_V1,
} from "@nyano/triad-engine";
import type { CardData, TranscriptV1 } from "@nyano/triad-engine";

/* ═══════════════════════════════════════════════════════════════════
   replay_verification.test.ts

   Phase 1 Completion: verifyReplayV1 integration tests.
   Validates the explicit verification API works correctly from the
   web app's perspective.
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

function toCardMap(cards: CardData[]): Map<bigint, CardData> {
  return new Map(cards.map((c) => [c.tokenId, c]));
}

/* ─── Fixtures ─── */

const CARDS: CardData[] = [
  mkCard(1n, [7, 3, 5, 4], 0),
  mkCard(2n, [4, 6, 3, 5], 1),
  mkCard(3n, [5, 5, 5, 5], 2),
  mkCard(4n, [8, 2, 4, 6], 0),
  mkCard(5n, [3, 7, 6, 3], 1),
  mkCard(6n, [4, 5, 6, 3], 2),
  mkCard(7n, [6, 4, 3, 7], 0),
  mkCard(8n, [3, 8, 4, 5], 1),
  mkCard(9n, [5, 3, 7, 4], 2),
  mkCard(10n, [4, 6, 5, 6], 0),
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
    { cell: 4, cardIndex: 0 },
    { cell: 0, cardIndex: 0 },
    { cell: 2, cardIndex: 1 },
    { cell: 6, cardIndex: 1 },
    { cell: 8, cardIndex: 2 },
    { cell: 1, cardIndex: 2 },
    { cell: 3, cardIndex: 3 },
    { cell: 5, cardIndex: 3 },
    { cell: 7, cardIndex: 4 },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
   Tests
   ═══════════════════════════════════════════════════════════════════ */

describe("verifyReplayV1 (web integration)", () => {
  it("returns ok:true for correct matchId", () => {
    const sim = simulateMatchV1WithHistory(TRANSCRIPT, CARD_MAP, DEFAULT_RULESET_CONFIG_V1);
    const result = verifyReplayV1(TRANSCRIPT, CARD_MAP, sim.matchId);

    expect(result.ok).toBe(true);
    expect(result.computedMatchId).toBe(sim.matchId);
    expect(result.expectedMatchId).toBe(sim.matchId);
    expect(result.winner).toBe(sim.winner);
    expect(result.tiles).toEqual(sim.tiles);
  });

  it("returns ok:false for wrong matchId", () => {
    const result = verifyReplayV1(TRANSCRIPT, CARD_MAP, "0xdead");

    expect(result.ok).toBe(false);
    expect(result.expectedMatchId).toBe("0xdead");
    expect(result.computedMatchId).not.toBe("0xdead");
  });

  it("detects tampered transcript (swapped same-player turns)", () => {
    const sim = simulateMatchV1WithHistory(TRANSCRIPT, CARD_MAP, DEFAULT_RULESET_CONFIG_V1);
    const originalMatchId = sim.matchId;

    // Swap turns 5 and 7 (both player B's turns, indices 5 and 7)
    // This keeps cardIndex usage valid per player but changes the game sequence.
    const turns = [...TRANSCRIPT.turns];
    const tmp = turns[5]!;
    turns[5] = turns[7]!;
    turns[7] = tmp;

    const tampered: TranscriptV1 = { ...TRANSCRIPT, turns };

    const result = verifyReplayV1(tampered, CARD_MAP, originalMatchId);

    expect(result.ok).toBe(false);
    expect(result.computedMatchId).not.toBe(originalMatchId);
  });

  it("verify result includes winner and tile counts", () => {
    const sim = simulateMatchV1WithHistory(TRANSCRIPT, CARD_MAP, DEFAULT_RULESET_CONFIG_V1);
    const result = verifyReplayV1(TRANSCRIPT, CARD_MAP, sim.matchId);

    expect(typeof result.winner === "number" || result.winner === "draw").toBe(true);
    expect(typeof result.tiles.A).toBe("number");
    expect(typeof result.tiles.B).toBe("number");
    expect(result.tiles.A + result.tiles.B).toBe(9);
  });
});
