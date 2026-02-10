import { describe, it, expect } from "vitest";
import {
  computeStrictAllowed,
  toViewerMoveText,
} from "../triad_vote_utils";
import type { OverlayStateV1 } from "../streamer_bus";

/* ═══════════════════════════════════════════════════════════════════
   vote_legality.test.ts

   P2-350: Verify that vote legality checks work correctly.
   Tests that legal moves are in the allowlist and illegal moves
   (occupied cells, used cards) are rejected.
   ═══════════════════════════════════════════════════════════════════ */

/** Minimal OverlayStateV1 factory for tests. */
function makeState(overrides: Partial<OverlayStateV1> & Record<string, unknown> = {}): OverlayStateV1 {
  return {
    version: 1,
    updatedAtMs: Date.now(),
    mode: "live",
    ...overrides,
  } as OverlayStateV1;
}

describe("Vote legality (P2-350)", () => {
  describe("legal moves on empty board", () => {
    it("all card+cell combinations are in allowlist for turn 0", () => {
      const state = makeState({ turn: 0, firstPlayer: 0 });
      const strict = computeStrictAllowed(state);
      expect(strict).not.toBeNull();
      expect(strict!.count).toBe(45); // 5 cards × 9 cells

      // Every cell × every card should be legal
      for (let cell = 0; cell < 9; cell++) {
        for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
          const moveText = toViewerMoveText({ cell, cardIndex });
          expect(strict!.allowlist).toContain(moveText);
        }
      }
    });
  });

  describe("occupied cell rejection", () => {
    it("move to occupied cell is NOT in allowlist", () => {
      const state = makeState({
        turn: 1,
        firstPlayer: 0,
        usedCells: [4], // center occupied
        usedCardIndicesA: [0], // A used card 0
      });
      const strict = computeStrictAllowed(state);
      expect(strict).not.toBeNull();
      // toPlay is B (turn 1, firstPlayer 0 → B's turn)
      expect(strict!.toPlay).toBe(1);

      // Any move targeting cell 4 (occupied) should not be in allowlist
      for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
        const moveText = toViewerMoveText({ cell: 4, cardIndex });
        expect(strict!.allowlist).not.toContain(moveText);
      }
    });

    it("moves to empty cells remain legal", () => {
      const state = makeState({
        turn: 1,
        firstPlayer: 0,
        usedCells: [4],
        usedCardIndicesA: [0],
      });
      const strict = computeStrictAllowed(state);
      expect(strict).not.toBeNull();

      // Cell 0 is empty, card 0 is available for B → should be legal
      const moveText = toViewerMoveText({ cell: 0, cardIndex: 0 });
      expect(strict!.allowlist).toContain(moveText);
    });
  });

  describe("used card rejection", () => {
    it("move with used card is NOT in allowlist", () => {
      const state = makeState({
        turn: 2,
        firstPlayer: 0,
        usedCells: [0, 4],
        usedCardIndicesA: [0],
        usedCardIndicesB: [0],
      });
      const strict = computeStrictAllowed(state);
      expect(strict).not.toBeNull();
      // Turn 2, firstPlayer 0 → A's turn
      expect(strict!.toPlay).toBe(0);

      // Card index 0 is used by A → any move with cardIndex 0 should be illegal
      for (let cell = 0; cell < 9; cell++) {
        const moveText = toViewerMoveText({ cell, cardIndex: 0 });
        expect(strict!.allowlist).not.toContain(moveText);
      }

      // Card index 1 on empty cell 1 should be legal
      const legalMove = toViewerMoveText({ cell: 1, cardIndex: 1 });
      expect(strict!.allowlist).toContain(legalMove);
    });
  });

  describe("game over", () => {
    it("computeStrictAllowed returns null when game is finished", () => {
      const state = makeState({
        turn: 9,
        firstPlayer: 0,
        status: { finished: true, winner: "A" },
      });
      const strict = computeStrictAllowed(state);
      expect(strict).toBeNull();
    });
  });

  describe("allowlist stability", () => {
    it("allowlist is sorted deterministically", () => {
      const state = makeState({ turn: 0, firstPlayer: 0 });
      const r1 = computeStrictAllowed(state);
      const r2 = computeStrictAllowed(state);
      expect(r1!.allowlist).toEqual(r2!.allowlist);
      // Verify sorted
      const sorted = [...r1!.allowlist].sort();
      expect(r1!.allowlist).toEqual(sorted);
    });

    it("warningMark is NOT included in base allowlist entries", () => {
      const state = makeState({ turn: 0, firstPlayer: 0 });
      const strict = computeStrictAllowed(state);
      expect(strict).not.toBeNull();

      // No allowlist entry should contain "wm="
      for (const entry of strict!.allowlist) {
        expect(entry).not.toContain("wm=");
      }
    });
  });
});
