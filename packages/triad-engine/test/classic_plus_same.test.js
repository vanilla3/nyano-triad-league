import test from "node:test";
import assert from "node:assert/strict";
import {
  computeRulesetIdV2,
  DEFAULT_RULESET_CONFIG_V2,
  simulateMatchV1,
} from "../dist/index.js";

function headerFor(rulesetId, firstPlayer) {
  return {
    version: 1,
    rulesetId,
    seasonId: 1,
    playerA: "0x00000000000000000000000000000000000000a1",
    playerB: "0x00000000000000000000000000000000000000b2",
    deckA: [1n, 2n, 3n, 4n, 5n],
    deckB: [101n, 102n, 103n, 104n, 105n],
    firstPlayer,
    deadline: 9999999999,
    salt: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  };
}

function cardsForSame() {
  return new Map([
    [1n, { tokenId: 1n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [2n, { tokenId: 2n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [3n, { tokenId: 3n, edges: { up: 4, right: 1, down: 1, left: 4 }, jankenHand: 2, combatStatSum: 10, trait: "none" }], // attacker at cell4
    [4n, { tokenId: 4n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [5n, { tokenId: 5n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [101n, { tokenId: 101n, edges: { up: 1, right: 1, down: 4, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }], // target @cell1
    [102n, { tokenId: 102n, edges: { up: 1, right: 4, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }], // target @cell3
    [103n, { tokenId: 103n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [104n, { tokenId: 104n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [105n, { tokenId: 105n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
  ]);
}

function turnsForSame() {
  return [
    { cell: 0, cardIndex: 0 }, // A
    { cell: 1, cardIndex: 0 }, // B target1
    { cell: 2, cardIndex: 1 }, // A
    { cell: 3, cardIndex: 1 }, // B target2
    { cell: 4, cardIndex: 2 }, // A attacker (same)
    { cell: 5, cardIndex: 2 }, // B
    { cell: 6, cardIndex: 3 }, // A
    { cell: 7, cardIndex: 3 }, // B
    { cell: 8, cardIndex: 4 }, // A
  ];
}

function cardsForPlusChain() {
  return new Map([
    [1n, { tokenId: 1n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [2n, { tokenId: 2n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [3n, { tokenId: 3n, edges: { up: 3, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }], // attacker @cell4
    [4n, { tokenId: 4n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [5n, { tokenId: 5n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [101n, { tokenId: 101n, edges: { up: 9, right: 1, down: 9, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }], // chain target @cell0
    [102n, { tokenId: 102n, edges: { up: 1, right: 1, down: 4, left: 8 }, jankenHand: 0, combatStatSum: 10, trait: "none" }], // target @cell1
    [103n, { tokenId: 103n, edges: { up: 0, right: 6, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }], // target @cell3
    [104n, { tokenId: 104n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [105n, { tokenId: 105n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
  ]);
}

function turnsForPlusChain() {
  return [
    { cell: 0, cardIndex: 0 }, // B chain target
    { cell: 8, cardIndex: 0 }, // A filler
    { cell: 1, cardIndex: 1 }, // B target1
    { cell: 2, cardIndex: 1 }, // A filler
    { cell: 3, cardIndex: 2 }, // B target2
    { cell: 4, cardIndex: 2 }, // A attacker (plus)
    { cell: 5, cardIndex: 3 }, // B filler
    { cell: 6, cardIndex: 3 }, // A filler
    { cell: 7, cardIndex: 4 }, // B filler
  ];
}

test("classic same: captures matching neighbors even when normal compare would not flip", () => {
  const ruleset = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  ruleset.classic.same = true;
  const rulesetId = computeRulesetIdV2(ruleset);
  const header = headerFor(rulesetId, 0);

  const result = simulateMatchV1(
    { header, turns: turnsForSame() },
    cardsForSame(),
    ruleset
  );

  const t4 = result.turns[4];
  const wins = (t4.flipTraces ?? []).map((x) => x.winBy);
  assert.equal(wins.filter((x) => x === "same").length, 2);
  assert.equal(result.board[1]?.owner, 0);
  assert.equal(result.board[3]?.owner, 0);
});

test("classic plus: special captures seed chain flips", () => {
  const ruleset = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  ruleset.classic.plus = true;
  const rulesetId = computeRulesetIdV2(ruleset);
  const header = headerFor(rulesetId, 1);

  const result = simulateMatchV1(
    { header, turns: turnsForPlusChain() },
    cardsForPlusChain(),
    ruleset
  );

  const t5 = result.turns[5];
  const traces = t5.flipTraces ?? [];
  assert.equal(traces.filter((x) => x.winBy === "plus").length, 2);
  assert.ok(traces.some((x) => x.isChain), "expected at least one chain flip from plus seed");
  assert.equal(result.board[0]?.owner, 0, "chain target should be flipped to attacker side");
});

