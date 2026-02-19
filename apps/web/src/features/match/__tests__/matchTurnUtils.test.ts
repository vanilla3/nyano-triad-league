import { describe, expect, it } from "vitest";
import {
  computeRulesetId,
  DEFAULT_RULESET_CONFIG_V2,
  type Turn,
} from "@nyano/triad-engine";
import type { DeckV1 } from "@/lib/deck_store";
import {
  computeUsed,
  countWarningMarks,
  fillTurns,
  parseDeckTokenIds,
  turnPlayer,
} from "@/features/match/matchTurnUtils";

describe("features/match/matchTurnUtils", () => {
  it("resolves alternating turn player from first player", () => {
    expect(turnPlayer(0, 0)).toBe(0);
    expect(turnPlayer(0, 1)).toBe(1);
    expect(turnPlayer(1, 0)).toBe(1);
    expect(turnPlayer(1, 1)).toBe(0);
  });

  it("parses deck token ids to bigint list", () => {
    const deck: DeckV1 = {
      id: "d1",
      name: "deck",
      tokenIds: ["1", "2", "3", "4", "5"],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(parseDeckTokenIds(deck)).toEqual([1n, 2n, 3n, 4n, 5n]);
    expect(parseDeckTokenIds(null)).toEqual([]);
  });

  it("computes used cells/cards and warning mark counts", () => {
    const turns: Turn[] = [
      { cell: 0, cardIndex: 1 },
      { cell: 1, cardIndex: 2, warningMarkCell: 5 },
      { cell: 4, cardIndex: 0, warningMarkCell: 7 },
    ];

    const used = computeUsed(turns, 0);
    expect(used.cells.size).toBe(3);
    expect(used.usedA.has(1)).toBe(true);
    expect(used.usedA.has(0)).toBe(true);
    expect(used.usedB.has(2)).toBe(true);

    const warn = countWarningMarks(turns, 0);
    expect(warn.A).toBe(1);
    expect(warn.B).toBe(1);
  });

  it("fills partial turns to a full 9-turn transcript deterministically", () => {
    const partial: Turn[] = [
      { cell: 0, cardIndex: 0 },
      { cell: 1, cardIndex: 1 },
    ];
    const header = {
      salt: ("0x" + "11".repeat(32)) as `0x${string}`,
      playerA: "0x1111111111111111111111111111111111111111",
      playerB: "0x2222222222222222222222222222222222222222",
      rulesetId: computeRulesetId(DEFAULT_RULESET_CONFIG_V2),
    } as const;

    const filled = fillTurns(partial, 0, DEFAULT_RULESET_CONFIG_V2, header);
    expect(filled.length).toBe(9);
    expect(filled[0]).toEqual(partial[0]);
    expect(filled[1]).toEqual(partial[1]);
    expect(new Set(filled.map((turn) => turn.cell)).size).toBe(9);

    const used = computeUsed(filled, 0);
    expect(used.usedA.size).toBe(5);
    expect(used.usedB.size).toBe(4);
  });
});
