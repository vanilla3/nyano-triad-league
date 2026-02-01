import test from "node:test";
import assert from "node:assert/strict";
import { simulateMatchV1 } from "../dist/index.js";

const mkCard = (tokenId, edges, j, sum) => ({
  tokenId,
  edges: { up: edges[0], right: edges[1], down: edges[2], left: edges[3] },
  jankenHand: j,
  combatStatSum: sum,
});

test("core: simple placement yields deterministic winner", () => {
  const header = {
    version: 1,
    rulesetId: "0x" + "11".repeat(32),
    seasonId: 0,
    playerA: "0x" + "aa".repeat(20),
    playerB: "0x" + "bb".repeat(20),
    deckA: [1n, 2n, 3n, 4n, 5n],
    deckB: [6n, 7n, 8n, 9n, 10n],
    firstPlayer: 0,
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

  const t = { header, turns };

  const cards = new Map([
    [1n, mkCard(1n, [5, 5, 5, 5], 0, 10)],
    [2n, mkCard(2n, [5, 5, 5, 5], 0, 10)],
    [3n, mkCard(3n, [5, 5, 5, 5], 0, 10)],
    [4n, mkCard(4n, [5, 5, 5, 5], 0, 10)],
    [5n, mkCard(5n, [5, 5, 5, 5], 0, 10)],

    [6n, mkCard(6n, [4, 4, 4, 4], 2, 10)],
    [7n, mkCard(7n, [4, 4, 4, 4], 2, 10)],
    [8n, mkCard(8n, [4, 4, 4, 4], 2, 10)],
    [9n, mkCard(9n, [4, 4, 4, 4], 2, 10)],
    [10n, mkCard(10n, [4, 4, 4, 4], 2, 10)],
  ]);

  const r = simulateMatchV1(t, cards);

  // With these symmetric values, first player should end up with more tiles (odd board).
  assert.equal(r.winner, 0);
  assert.equal(r.tiles.A + r.tiles.B, 9);
  assert.ok(/^0x[0-9a-fA-F]{64}$/.test(r.matchId));
});

test("tactics: warning mark debuffs placed card edges by -1", () => {
  const header = {
    version: 1,
    rulesetId: "0x" + "11".repeat(32),
    seasonId: 0,
    playerA: "0x" + "aa".repeat(20),
    playerB: "0x" + "bb".repeat(20),
    deckA: [1n, 2n, 3n, 4n, 5n],
    deckB: [6n, 7n, 8n, 9n, 10n],
    firstPlayer: 0,
    deadline: 9999999999,
    salt: "0x" + "33".repeat(32),
  };

  // Turn0: A places center, then warns cell 5.
  // Turn1: B places on warned cell 5. Without debuff, B's left edge ties (5 vs 5)
  //        and B's janken (Paper) would win vs A (Rock), flipping center.
  //        With debuff (-1), B's left edge becomes 4, so it cannot flip the center.
  const turns = [
    { cell: 4, cardIndex: 0, warningMarkCell: 5 },
    { cell: 5, cardIndex: 0 },
    { cell: 0, cardIndex: 1 },
    { cell: 8, cardIndex: 1 },
    { cell: 1, cardIndex: 2 },
    { cell: 7, cardIndex: 2 },
    { cell: 2, cardIndex: 3 },
    { cell: 6, cardIndex: 3 },
    { cell: 3, cardIndex: 4 },
  ];

  const t = { header, turns };

  const cards = new Map([
    // A: center card (Rock)
    [1n, mkCard(1n, [5, 5, 5, 5], 0, 10)],
    [2n, mkCard(2n, [5, 5, 5, 5], 0, 10)],
    [3n, mkCard(3n, [5, 5, 5, 5], 0, 10)],
    [4n, mkCard(4n, [5, 5, 5, 5], 0, 10)],
    [5n, mkCard(5n, [5, 5, 5, 5], 0, 10)],

    // B: warned placement card (Paper)
    [6n, mkCard(6n, [5, 5, 5, 5], 1, 10)],
    [7n, mkCard(7n, [4, 4, 4, 4], 2, 10)],
    [8n, mkCard(8n, [4, 4, 4, 4], 2, 10)],
    [9n, mkCard(9n, [4, 4, 4, 4], 2, 10)],
    [10n, mkCard(10n, [4, 4, 4, 4], 2, 10)],
  ]);

  const r = simulateMatchV1(t, cards);

  // Verify the warned placement card got debuffed.
  assert.equal(r.board[5].card.edges.left, 4);

  // Verify center did not flip due to debuff.
  assert.equal(r.board[4].owner, 0);
});
