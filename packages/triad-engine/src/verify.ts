/**
 * verify.ts — Replay verification for Nyano Triad League.
 *
 * Provides a simple API to re-simulate a transcript and verify that
 * the computed matchId matches an expected value. This guarantees:
 *   1. The transcript (turns + deck) is authentic
 *   2. The engine produces a deterministic outcome
 *   3. No data was tampered with after the match
 *
 * The engine is fully deterministic (no RNG, no shuffle). Each player
 * has exactly 5 cards, all of which are used across 9 turns.
 * Given the same transcript + card data, the result is always identical.
 */

import type {
  TranscriptV1,
  CardData,
  PlayerIndex,
  RulesetConfig,
} from "./types.js";
import { simulateMatchV1, DEFAULT_RULESET_CONFIG_V1 } from "./engine.js";

export interface VerifyResult {
  /** Whether the computed matchId matches the expected one. */
  ok: boolean;
  /** The matchId computed by re-simulating the transcript. */
  computedMatchId: `0x${string}`;
  /** The matchId that was expected. */
  expectedMatchId: string;
  /** Winner of the match. */
  winner: PlayerIndex | "draw";
  /** Final tile counts. */
  tiles: { A: number; B: number };
}

/**
 * Re-simulate a transcript and verify the matchId.
 *
 * @param transcript The full transcript (header + turns).
 * @param cardsByTokenId Map of token IDs to card data.
 * @param expectedMatchId The matchId to verify against.
 * @param ruleset Optional ruleset config (defaults to DEFAULT_RULESET_CONFIG_V1).
 * @returns VerifyResult with ok=true if matchIds match.
 */
export function verifyReplayV1(
  transcript: TranscriptV1,
  cardsByTokenId: Map<bigint, CardData>,
  expectedMatchId: string,
  ruleset: RulesetConfig = DEFAULT_RULESET_CONFIG_V1,
): VerifyResult {
  const result = simulateMatchV1(transcript, cardsByTokenId, ruleset);

  return {
    ok: result.matchId === expectedMatchId,
    computedMatchId: result.matchId,
    expectedMatchId,
    winner: result.winner,
    tiles: result.tiles,
  };
}
