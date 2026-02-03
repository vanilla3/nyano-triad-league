import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RULESET_CONFIG_V1, simulateMatchV1 } from "../dist/index.js";

const mkCard = (tokenId, edges, j, sum, trait) => ({
  tokenId,
  edges: { up: edges[0], right: edges[1], down: edges[2], left: edges[3] },
  jankenHand: j,
  combatStatSum: sum,
  trait,
});

test("formation: five elements harmony scales combo bonus triadPlus", () => {
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
    { cell: 2, cardIndex: 2, earthBoostEdge: 1 }, // Earth requires a boost edge choice
    { cell: 6, cardIndex: 2 },
    { cell: 3, cardIndex: 3 },
    { cell: 5, cardIndex: 3 },
    { cell: 4, cardIndex: 4 },
  ];

  const t = { header, turns };

  const cards = new Map([
    // Player A: 5 elements (flame/aqua/earth/wind/thunder)
    [1n, mkCard(1n, [5, 5, 5, 5], 0, 10, "flame")],
    [2n, mkCard(2n, [5, 5, 5, 5], 0, 10, "aqua")],
    [3n, mkCard(3n, [5, 5, 5, 5], 0, 10, "earth")],
    [4n, mkCard(4n, [5, 5, 5, 5], 0, 10, "wind")],
    [5n, mkCard(5n, [5, 5, 5, 5], 0, 10, "thunder")],

    // Player B: none
    [6n, mkCard(6n, [5, 5, 5, 5], 0, 10, "none")],
    [7n, mkCard(7n, [5, 5, 5, 5], 0, 10, "none")],
    [8n, mkCard(8n, [5, 5, 5, 5], 0, 10, "none")],
    [9n, mkCard(9n, [5, 5, 5, 5], 0, 10, "none")],
    [10n, mkCard(10n, [5, 5, 5, 5], 0, 10, "none")],
  ]);

  const ruleset = structuredClone(DEFAULT_RULESET_CONFIG_V1);

  // Make momentum trigger even on flipCount=0 for a deterministic unit test.
  ruleset.tactics.comboBonus.enabled = true;
  ruleset.tactics.comboBonus.momentumAt = 1;
  ruleset.tactics.comboBonus.dominationAt = 250;
  ruleset.tactics.comboBonus.feverAt = 250;
  ruleset.tactics.comboBonus.momentumTriadPlus = 1;

  // Ensure no other deltas
  ruleset.tactics.secondPlayerBalance.enabled = false;
  ruleset.tactics.warningMark.enabled = false;

  // Default formation scale is 2 (so +1 becomes +2).
  const r = simulateMatchV1(t, cards, ruleset);

  assert.deepEqual(r.formations.A, ["five_elements_harmony"]);
  assert.deepEqual(r.formations.B, []);

  // Turn 2 is player A's second move; it should consume the pending bonus set by turn 0.
  assert.equal(r.turns[2].player, 0);
  assert.equal(r.turns[2].appliedBonus.triadPlus, 2);
});

test("formation: eclipse lets Light ignore warning mark penalty", () => {
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
    { cell: 1, cardIndex: 0, warningMarkCell: 4 }, // B places mark on center
    { cell: 4, cardIndex: 1 }, // A steps on marked cell with Light
    { cell: 8, cardIndex: 1 },
    { cell: 2, cardIndex: 2, earthBoostEdge: 1 }, // Earth requires a boost edge choice
    { cell: 7, cardIndex: 2 },
    { cell: 3, cardIndex: 3 },
    { cell: 6, cardIndex: 3 },
    { cell: 5, cardIndex: 4 },
  ];

  const t = { header, turns };

  const cards = new Map([
    // Player A: has both shadow + light => eclipse formation active
    [1n, mkCard(1n, [5, 5, 5, 5], 0, 10, "shadow")],
    [2n, mkCard(2n, [5, 5, 5, 5], 0, 10, "light")],
    [3n, mkCard(3n, [5, 5, 5, 5], 0, 10, "none")],
    [4n, mkCard(4n, [5, 5, 5, 5], 0, 10, "none")],
    [5n, mkCard(5n, [5, 5, 5, 5], 0, 10, "none")],

    // Player B: none
    [6n, mkCard(6n, [5, 5, 5, 5], 0, 10, "none")],
    [7n, mkCard(7n, [5, 5, 5, 5], 0, 10, "none")],
    [8n, mkCard(8n, [5, 5, 5, 5], 0, 10, "none")],
    [9n, mkCard(9n, [5, 5, 5, 5], 0, 10, "none")],
    [10n, mkCard(10n, [5, 5, 5, 5], 0, 10, "none")],
  ]);

  const ruleset = structuredClone(DEFAULT_RULESET_CONFIG_V1);
  ruleset.tactics.comboBonus.enabled = false; // simplify

  const r = simulateMatchV1(t, cards, ruleset);

  assert.deepEqual(r.formations.A, ["eclipse"]);
  assert.deepEqual(r.formations.B, []);

  // A's light card stepped on a warning mark, but eclipse makes it ignore the -1 penalty.
  const center = r.board[4];
  assert.ok(center);
  assert.equal(center.owner, 0);
  assert.equal(center.card.trait, "light");
  assert.equal(center.card.edges.up, 5);
});
