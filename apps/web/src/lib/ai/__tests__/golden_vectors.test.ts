import { describe, it, expect } from "vitest";
import {
  simulateMatchV1WithHistory,
  verifyReplayV1,
} from "@nyano/triad-engine";
import type { CardData, TranscriptV1, TraitType } from "@nyano/triad-engine";
import { resolveRulesetOrThrow } from "@/lib/ruleset_registry";
import vectors from "./golden_vectors.json";

/* ═══════════════════════════════════════════════════════════════════
   golden_vectors.test.ts — Phase 3 web-layer golden tests

   Loads hand-crafted test vectors from JSON, simulates with the
   engine, and asserts matchId / winner / tiles match expected values.
   Any engine regression (logic, hashing, or ruleset default) will
   cause these tests to fail in CI.
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Helpers ─── */

interface VectorCard {
  tokenId: string;
  edges: [number, number, number, number];
  jankenHand: 0 | 1 | 2;
  trait?: string;
}

interface VectorCase {
  name: string;
  description: string;
  rulesetKey: string;
  transcript: {
    header: {
      version: number;
      seasonId: number;
      firstPlayer: 0 | 1;
      deadline: number;
    };
    turns: Array<{ cell: number; cardIndex: number; warningMarkCell?: number | null }>;
  };
  cards: VectorCard[];
  deckA: string[];
  deckB: string[];
  expected: {
    matchId: string;
    winner: number;
    tilesA: number;
    tilesB: number;
    tieBreak: string;
  };
}

function buildCardMap(cards: VectorCard[]): Map<bigint, CardData> {
  const map = new Map<bigint, CardData>();
  for (const c of cards) {
    const tokenId = BigInt(c.tokenId);
    map.set(tokenId, {
      tokenId,
      edges: { up: c.edges[0], right: c.edges[1], down: c.edges[2], left: c.edges[3] },
      jankenHand: c.jankenHand,
      combatStatSum: c.edges[0] + c.edges[1] + c.edges[2] + c.edges[3],
      ...(c.trait ? { trait: c.trait as TraitType } : {}),
    });
  }
  return map;
}

function buildTranscript(vec: VectorCase): TranscriptV1 {
  return {
    header: {
      version: vec.transcript.header.version,
      rulesetId: `0x${"11".repeat(32)}` as `0x${string}`,
      seasonId: vec.transcript.header.seasonId,
      playerA: `0x${"aa".repeat(20)}` as `0x${string}`,
      playerB: `0x${"bb".repeat(20)}` as `0x${string}`,
      deckA: vec.deckA.map((x) => BigInt(x)),
      deckB: vec.deckB.map((x) => BigInt(x)),
      firstPlayer: vec.transcript.header.firstPlayer,
      deadline: vec.transcript.header.deadline,
      salt: `0x${"22".repeat(32)}` as `0x${string}`,
    },
    turns: vec.transcript.turns.map((t) => ({
      cell: t.cell,
      cardIndex: t.cardIndex,
      ...(t.warningMarkCell != null ? { warningMarkCell: t.warningMarkCell } : {}),
    })),
  };
}

/* ─── Tests ─── */

describe("Web golden test vectors", () => {
  const cases = vectors.cases as unknown as VectorCase[];

  for (const vec of cases) {
    describe(vec.name, () => {
      const cardMap = buildCardMap(vec.cards);
      const transcript = buildTranscript(vec);
      const ruleset = resolveRulesetOrThrow(vec.rulesetKey);

      it("simulateMatchV1WithHistory produces expected matchId", () => {
        const result = simulateMatchV1WithHistory(transcript, cardMap, ruleset);
        expect(result.matchId).toBe(vec.expected.matchId);
      });

      it("verifyReplayV1 agrees with simulation", () => {
        const result = verifyReplayV1(transcript, cardMap, vec.expected.matchId as `0x${string}`, ruleset);
        expect(result.ok).toBe(true);
      });

      it("winner matches expected", () => {
        const result = simulateMatchV1WithHistory(transcript, cardMap, ruleset);
        expect(Number(result.winner)).toBe(vec.expected.winner);
      });

      it("tile counts match expected", () => {
        const result = simulateMatchV1WithHistory(transcript, cardMap, ruleset);
        expect(result.tiles.A).toBe(vec.expected.tilesA);
        expect(result.tiles.B).toBe(vec.expected.tilesB);
      });
    });
  }
});
