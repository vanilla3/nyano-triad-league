import test from "node:test";
import assert from "node:assert/strict";
import {
  computeRulesetIdV2,
  DEFAULT_RULESET_CONFIG_V2,
  simulateMatchV1,
} from "../dist/index.js";

function header(rulesetId) {
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
    salt: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
  };
}

function turns() {
  return [
    { cell: 0, cardIndex: 0 }, // A flame setup
    { cell: 5, cardIndex: 0 }, // B defender for turn2
    { cell: 4, cardIndex: 1 }, // A flame attacker
    { cell: 8, cardIndex: 1 }, // B
    { cell: 1, cardIndex: 2 }, // A
    { cell: 2, cardIndex: 2 }, // B
    { cell: 3, cardIndex: 3 }, // A
    { cell: 6, cardIndex: 3 }, // B
    { cell: 7, cardIndex: 4 }, // A
  ];
}

function cards({ attackerRight, defenderLeft }) {
  return new Map([
    [1n, { tokenId: 1n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "flame" }],
    [2n, { tokenId: 2n, edges: { up: 1, right: attackerRight, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "flame" }],
    [3n, { tokenId: 3n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [4n, { tokenId: 4n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [5n, { tokenId: 5n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [101n, { tokenId: 101n, edges: { up: 1, right: 1, down: 1, left: defenderLeft }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [102n, { tokenId: 102n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [103n, { tokenId: 103n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [104n, { tokenId: 104n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
    [105n, { tokenId: 105n, edges: { up: 1, right: 1, down: 1, left: 1 }, jankenHand: 0, combatStatSum: 10, trait: "none" }],
  ]);
}

test("classic type ascend: placement count boosts same-trait edge", () => {
  const normal = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  const ascend = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  ascend.classic.typeAscend = true;

  const ts = turns();
  const cs = cards({ attackerRight: 2, defenderLeft: 3 });

  const rNormal = simulateMatchV1(
    { header: header(computeRulesetIdV2(normal)), turns: ts },
    cs,
    normal
  );
  assert.equal(rNormal.turns[2].flipCount, 0);

  const rAscend = simulateMatchV1(
    { header: header(computeRulesetIdV2(ascend)), turns: ts },
    cs,
    ascend
  );
  assert.equal(rAscend.turns[2].flipCount, 1);
  assert.equal(rAscend.turns[2].flipTraces?.[0]?.aVal, 4);
});

test("classic type descend: placement count debuffs same-trait edge", () => {
  const normal = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  const descend = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  descend.classic.typeDescend = true;

  const ts = turns();
  const cs = cards({ attackerRight: 3, defenderLeft: 2 });

  const rNormal = simulateMatchV1(
    { header: header(computeRulesetIdV2(normal)), turns: ts },
    cs,
    normal
  );
  assert.equal(rNormal.turns[2].flipCount, 1);

  const rDescend = simulateMatchV1(
    { header: header(computeRulesetIdV2(descend)), turns: ts },
    cs,
    descend
  );
  assert.equal(rDescend.turns[2].flipCount, 0);
});

