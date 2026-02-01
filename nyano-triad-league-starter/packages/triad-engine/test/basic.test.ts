import test from "node:test";
import assert from "node:assert/strict";
import { simulateMatchV1, type TranscriptV1, type CardData } from "../src/index.js";

test("core: simple placement yields deterministic winner", () => {
  const header = {
    version: 1,
    rulesetId: "0x" + "11".repeat(32),
    seasonId: 0,
    playerA: "0x" + "aa".repeat(20),
    playerB: "0x" + "bb".repeat(20),
    deckA: [1n,2n,3n,4n,5n],
    deckB: [6n,7n,8n,9n,10n],
    firstPlayer: 0 as const,
    deadline: 9999999999,
    salt: "0x" + "22".repeat(32),
  };

  const turns = [
    { cell: 0, cardIndex: 0 },
    { cell: 8, cardIndex: 0 },
    { cell: 1, cardIndex: 1 },
    { cell: 7, cardIndex: 1 },
    { cell: 2, cardIndex: 2 },
    { cell: 6, cardIndex: 2 },
    { cell: 3, cardIndex: 3 },
    { cell: 5, cardIndex: 3 },
    { cell: 4, cardIndex: 4 },
  ];

  const t: TranscriptV1 = { header, turns };

  const mk = (tokenId: bigint, edges: [number,number,number,number], j: 0|1|2, sum: number): CardData => ({
    tokenId,
    edges: { up: edges[0], right: edges[1], down: edges[2], left: edges[3] },
    jankenHand: j,
    combatStatSum: sum,
  });

  const cards = new Map<bigint, CardData>([
    [1n, mk(1n, [5,5,5,5], 0, 10)],
    [2n, mk(2n, [5,5,5,5], 0, 10)],
    [3n, mk(3n, [5,5,5,5], 0, 10)],
    [4n, mk(4n, [5,5,5,5], 0, 10)],
    [5n, mk(5n, [5,5,5,5], 0, 10)],

    [6n, mk(6n, [4,4,4,4], 2, 10)],
    [7n, mk(7n, [4,4,4,4], 2, 10)],
    [8n, mk(8n, [4,4,4,4], 2, 10)],
    [9n, mk(9n, [4,4,4,4], 2, 10)],
    [10n, mk(10n, [4,4,4,4], 2, 10)],
  ]);

  const r = simulateMatchV1(t, cards);

  // With these symmetric values, first player should end up with more tiles (odd board).
  assert.equal(r.winner, 0);
  assert.equal(r.tiles.A + r.tiles.B, 9);
});
