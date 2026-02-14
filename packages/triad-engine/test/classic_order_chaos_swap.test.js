import test from "node:test";
import assert from "node:assert/strict";
import {
  computeRulesetIdV2,
  DEFAULT_RULESET_CONFIG_V2,
  resolveClassicForcedCardIndex,
  resolveClassicSwapIndices,
  simulateMatchV1,
} from "../dist/index.js";

function turnPlayer(firstPlayer, turnIndex) {
  return ((firstPlayer + (turnIndex % 2)) % 2);
}

function buildCardsMap(tokenIds) {
  const cards = new Map();
  for (const tid of tokenIds) {
    cards.set(tid, {
      tokenId: tid,
      edges: { up: 5, right: 5, down: 5, left: 5 },
      jankenHand: 0,
      combatStatSum: 20,
      trait: "none",
    });
  }
  return cards;
}

function completeTurns(partialTurns, firstPlayer, ruleset, header) {
  const turns = [...partialTurns];
  const usedCells = new Set();
  const usedA = new Set();
  const usedB = new Set();

  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    usedCells.add(t.cell);
    const p = turnPlayer(firstPlayer, i);
    if (p === 0) usedA.add(t.cardIndex);
    else usedB.add(t.cardIndex);
  }

  for (let i = turns.length; i < 9; i++) {
    const p = turnPlayer(firstPlayer, i);
    let cell = -1;
    for (let c = 0; c < 9; c++) {
      if (!usedCells.has(c)) {
        cell = c;
        break;
      }
    }
    if (cell < 0) throw new Error("no empty cell");
    usedCells.add(cell);

    const used = p === 0 ? usedA : usedB;
    const forced = resolveClassicForcedCardIndex({
      ruleset,
      header,
      turnIndex: i,
      player: p,
      usedCardIndices: used,
    });
    let cardIndex = forced;
    if (cardIndex === null) {
      for (let ci = 0; ci < 5; ci++) {
        if (!used.has(ci)) {
          cardIndex = ci;
          break;
        }
      }
    }
    if (cardIndex === null || cardIndex === undefined) throw new Error("no card index");
    used.add(cardIndex);
    turns.push({ cell, cardIndex });
  }

  return turns;
}

function mkHeader(rulesetId, firstPlayer = 0) {
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
    salt: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  };
}

test("classic order: invalid cardIndex is rejected", () => {
  const ruleset = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  ruleset.classic.order = true;
  const rulesetId = computeRulesetIdV2(ruleset);
  const header = mkHeader(rulesetId, 0);

  const validTurns = completeTurns([], header.firstPlayer, ruleset, header);
  const turns = validTurns.map((t) => ({ ...t }));
  turns[0].cardIndex = 1;

  const cards = buildCardsMap([...header.deckA, ...header.deckB]);
  assert.throws(
    () => simulateMatchV1({ header, turns }, cards, ruleset),
    /classic cardIndex constraint violated/
  );
});

test("classic chaos: deterministic choice is enforced", () => {
  const ruleset = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  ruleset.classic.chaos = true;
  const rulesetId = computeRulesetIdV2(ruleset);
  const header = mkHeader(rulesetId, 0);

  const validTurns = completeTurns([], header.firstPlayer, ruleset, header);
  const cards = buildCardsMap([...header.deckA, ...header.deckB]);
  const ok = simulateMatchV1({ header, turns: validTurns }, cards, ruleset);
  assert.equal(ok.turns.length, 9);

  const broken = validTurns.map((t) => ({ ...t }));
  const idx = 2;
  const by = turnPlayer(header.firstPlayer, idx);
  const used = new Set();
  for (let i = 0; i < idx; i++) {
    const p = turnPlayer(header.firstPlayer, i);
    if (p === by) used.add(validTurns[i].cardIndex);
  }
  const expected = validTurns[idx].cardIndex;
  let wrong = null;
  for (let ci = 0; ci < 5; ci++) {
    if (!used.has(ci) && ci !== expected) {
      wrong = ci;
      break;
    }
  }
  assert.notEqual(wrong, null);
  broken[idx].cardIndex = wrong;

  assert.throws(
    () => simulateMatchV1({ header, turns: broken }, cards, ruleset),
    /classic cardIndex constraint violated/
  );
});

test("classic swap: deck swap is applied before turn 0", () => {
  const ruleset = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  ruleset.classic.swap = true;
  const rulesetId = computeRulesetIdV2(ruleset);
  const header = mkHeader(rulesetId, 0);
  const swap = resolveClassicSwapIndices({ ruleset, header });
  assert.ok(swap);

  const partial = [{ cell: 4, cardIndex: swap.aIndex }];
  const turns = completeTurns(partial, header.firstPlayer, ruleset, header);
  const cards = buildCardsMap([...header.deckA, ...header.deckB]);
  const result = simulateMatchV1({ header, turns }, cards, ruleset);

  const expectedToken = header.deckB[swap.bIndex];
  assert.equal(result.turns[0].tokenId, expectedToken);
});

