import test from "node:test";
import assert from "node:assert/strict";
import {
  computeRulesetIdV2,
  DEFAULT_RULESET_CONFIG_V2,
  simulateMatchV1,
} from "../dist/index.js";

function baseHeader(rulesetId) {
  return {
    version: 1,
    rulesetId,
    seasonId: 1,
    playerA: "0x00000000000000000000000000000000000000a1",
    playerB: "0x00000000000000000000000000000000000000b2",
    deckA: [1n, 2n, 3n, 4n, 5n],
    deckB: [101n, 102n, 103n, 104n, 105n],
    firstPlayer: 0,
    deadline: 9999999999,
    salt: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  };
}

function fullTurns() {
  return [
    { cell: 4, cardIndex: 0 }, // A
    { cell: 3, cardIndex: 0 }, // B (attacks right -> cell4)
    { cell: 0, cardIndex: 1 }, // A
    { cell: 1, cardIndex: 1 }, // B
    { cell: 2, cardIndex: 2 }, // A
    { cell: 5, cardIndex: 2 }, // B
    { cell: 6, cardIndex: 3 }, // A
    { cell: 7, cardIndex: 3 }, // B
    { cell: 8, cardIndex: 4 }, // A
  ];
}

function mkCards({ aLeft, bRight }) {
  return new Map([
    [1n, { tokenId: 1n, edges: { up: 1, right: 1, down: 1, left: aLeft }, jankenHand: 2, combatStatSum: 10, trait: "none" }],
    [2n, { tokenId: 2n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [3n, { tokenId: 3n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [4n, { tokenId: 4n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [5n, { tokenId: 5n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [101n, { tokenId: 101n, edges: { up: 1, right: bRight, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [102n, { tokenId: 102n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [103n, { tokenId: 103n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [104n, { tokenId: 104n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [105n, { tokenId: 105n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
  ]);
}

test("classic reverse: lower edge can win (winBy=lt)", () => {
  const normal = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  const reverse = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  reverse.classic.reverse = true;

  const cards = mkCards({ aLeft: 8, bRight: 2 });
  const turns = fullTurns();

  const hNormal = baseHeader(computeRulesetIdV2(normal));
  const rNormal = simulateMatchV1({ header: hNormal, turns }, cards, normal);
  assert.equal(rNormal.turns[1].flipCount, 0);

  const hReverse = baseHeader(computeRulesetIdV2(reverse));
  const rReverse = simulateMatchV1({ header: hReverse, turns }, cards, reverse);
  assert.equal(rReverse.turns[1].flipCount, 1);
  assert.equal(rReverse.turns[1].flipTraces?.[0]?.winBy, "lt");
});

test("classic ace killer: 1 beats 10 (winBy=aceKiller)", () => {
  const normal = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  const ace = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  ace.classic.aceKiller = true;

  const cards = mkCards({ aLeft: 10, bRight: 1 });
  const turns = fullTurns();

  const hNormal = baseHeader(computeRulesetIdV2(normal));
  const rNormal = simulateMatchV1({ header: hNormal, turns }, cards, normal);
  assert.equal(rNormal.turns[1].flipCount, 0);

  const hAce = baseHeader(computeRulesetIdV2(ace));
  const rAce = simulateMatchV1({ header: hAce, turns }, cards, ace);
  assert.equal(rAce.turns[1].flipCount, 1);
  assert.equal(rAce.turns[1].flipTraces?.[0]?.winBy, "aceKiller");
});
