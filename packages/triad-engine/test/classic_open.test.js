import test from "node:test";
import assert from "node:assert/strict";
import {
  computeRulesetIdV2,
  DEFAULT_RULESET_CONFIG_V2,
  resolveClassicOpenCardIndices,
} from "../dist/index.js";

function mkHeader(rulesetId) {
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
    salt: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  };
}

test("classic threeOpen: deterministic unique indices for each player", () => {
  const ruleset = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  ruleset.classic.threeOpen = true;
  const rulesetId = computeRulesetIdV2(ruleset);
  const header = mkHeader(rulesetId);

  const first = resolveClassicOpenCardIndices({ ruleset, header });
  const second = resolveClassicOpenCardIndices({ ruleset, header });
  assert.ok(first);
  assert.ok(second);
  assert.deepEqual(first, second);
  assert.equal(first.mode, "three_open");

  for (const indices of [first.playerA, first.playerB]) {
    assert.equal(indices.length, 3);
    assert.equal(new Set(indices).size, 3);
    for (const idx of indices) {
      assert.equal(Number.isInteger(idx), true);
      assert.equal(idx >= 0 && idx < 5, true);
    }
  }
});

test("classic allOpen: takes precedence when both allOpen and threeOpen are enabled", () => {
  const ruleset = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  ruleset.classic.allOpen = true;
  ruleset.classic.threeOpen = true;
  const rulesetId = computeRulesetIdV2(ruleset);
  const header = mkHeader(rulesetId);

  const open = resolveClassicOpenCardIndices({ ruleset, header });
  assert.ok(open);
  assert.equal(open.mode, "all_open");
  assert.deepEqual(open.playerA, [0, 1, 2, 3, 4]);
  assert.deepEqual(open.playerB, [0, 1, 2, 3, 4]);
});

