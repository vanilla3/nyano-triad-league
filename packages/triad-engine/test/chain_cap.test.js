import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RULESET_CONFIG_V1, simulateMatchV1 } from "../dist/index.js";

const mkCard = (tokenId, edges, j, sum) => ({
  tokenId,
  edges: { up: edges[0], right: edges[1], down: edges[2], left: edges[3] },
  jankenHand: j,
  combatStatSum: sum,
});

function makeTranscriptAndCards() {
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
    salt: "0x" + "44".repeat(32),
  };

  const turns = [
    { cell: 8, cardIndex: 0 }, // A
    { cell: 1, cardIndex: 0 }, // B (chain source)
    { cell: 7, cardIndex: 1 }, // A
    { cell: 2, cardIndex: 1 }, // B (chain target)
    { cell: 0, cardIndex: 2 }, // A (attacker; flips 1 then chains to 2)
    { cell: 3, cardIndex: 2 }, // B
    { cell: 4, cardIndex: 3 }, // A
    { cell: 5, cardIndex: 3 }, // B
    { cell: 6, cardIndex: 4 }, // A
  ];

  const cards = new Map([
    // Player A
    [1n, mkCard(1n, [1, 1, 1, 1], 0, 10)],
    [2n, mkCard(2n, [1, 1, 1, 1], 0, 10)],
    [3n, mkCard(3n, [1, 8, 1, 1], 0, 10)], // main attacker at turn 4
    [4n, mkCard(4n, [1, 1, 1, 1], 0, 10)],
    [5n, mkCard(5n, [1, 1, 1, 1], 0, 10)],

    // Player B
    [6n, mkCard(6n, [1, 9, 1, 1], 0, 10)], // chain source: right edge is strong
    [7n, mkCard(7n, [1, 1, 1, 1], 0, 10)], // chain target
    [8n, mkCard(8n, [1, 1, 1, 1], 0, 10)],
    [9n, mkCard(9n, [1, 1, 1, 1], 0, 10)],
    [10n, mkCard(10n, [1, 1, 1, 1], 0, 10)],
  ]);

  return { transcript: { header, turns }, cards };
}

function makeBaseRuleset() {
  const ruleset = structuredClone(DEFAULT_RULESET_CONFIG_V1);
  ruleset.tactics.warningMark.enabled = false;
  ruleset.tactics.comboBonus.enabled = false;
  ruleset.tactics.secondPlayerBalance.enabled = false;
  ruleset.synergy.traitEffects.enabled = false;
  ruleset.synergy.formationBonuses.enabled = false;
  return ruleset;
}

test("meta.chainCapPerTurn: uncapped turn keeps chain flips", () => {
  const { transcript, cards } = makeTranscriptAndCards();
  const ruleset = makeBaseRuleset();

  const r = simulateMatchV1(transcript, cards, ruleset);
  assert.equal(r.turns[4].flipCount, 2);
  assert.equal(r.board[2].owner, 0);
});

test("meta.chainCapPerTurn: cap=1 limits total flips on the turn", () => {
  const { transcript, cards } = makeTranscriptAndCards();
  const ruleset = makeBaseRuleset();
  ruleset.meta = { chainCapPerTurn: 1 };

  const r = simulateMatchV1(transcript, cards, ruleset);
  assert.equal(r.turns[4].flipCount, 1);
  assert.equal(r.board[2].owner, 1);
});

test("meta.chainCapPerTurn: invalid negative value throws", () => {
  const { transcript, cards } = makeTranscriptAndCards();
  const ruleset = makeBaseRuleset();
  ruleset.meta = { chainCapPerTurn: -1 };

  assert.throws(() => simulateMatchV1(transcript, cards, ruleset));
});
