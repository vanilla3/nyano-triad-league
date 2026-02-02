import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_NYANO_TRAIT_DERIVATION_CONFIG_V1,
  deriveTraitTypeFromNyanoTraitV1,
  makeCardDataFromNyano,
} from "../dist/index.js";

test("nyano: trait derivation v1 (season/class/fixed by rarity)", () => {
  const cfg = DEFAULT_NYANO_TRAIT_DERIVATION_CONFIG_V1;

  // Common/Uncommon => season mapping.
  assert.equal(deriveTraitTypeFromNyanoTraitV1({ classId: 1, seasonId: 1, rarity: 1 }, cfg), "wind");
  assert.equal(deriveTraitTypeFromNyanoTraitV1({ classId: 5, seasonId: 2, rarity: 2 }, cfg), "flame");
  assert.equal(deriveTraitTypeFromNyanoTraitV1({ classId: 2, seasonId: 3, rarity: 1 }, cfg), "earth");
  assert.equal(deriveTraitTypeFromNyanoTraitV1({ classId: 3, seasonId: 4, rarity: 2 }, cfg), "aqua");

  // Rare => class mapping.
  assert.equal(deriveTraitTypeFromNyanoTraitV1({ classId: 1, seasonId: 1, rarity: 3 }, cfg), "light");
  assert.equal(deriveTraitTypeFromNyanoTraitV1({ classId: 2, seasonId: 4, rarity: 3 }, cfg), "metal");
  assert.equal(deriveTraitTypeFromNyanoTraitV1({ classId: 3, seasonId: 2, rarity: 3 }, cfg), "cosmic");
  assert.equal(deriveTraitTypeFromNyanoTraitV1({ classId: 4, seasonId: 3, rarity: 3 }, cfg), "forest");
  assert.equal(deriveTraitTypeFromNyanoTraitV1({ classId: 5, seasonId: 1, rarity: 3 }, cfg), "shadow");

  // SuperRare/Legendary => fixed
  assert.equal(deriveTraitTypeFromNyanoTraitV1({ classId: 1, seasonId: 1, rarity: 4 }, cfg), "thunder");
  assert.equal(deriveTraitTypeFromNyanoTraitV1({ classId: 2, seasonId: 2, rarity: 5 }, cfg), "cosmic");
});

test("nyano: makeCardDataFromNyano builds CardData with derived trait + stat sum", () => {
  const c = makeCardDataFromNyano({
    tokenId: 123n,
    triad: { up: 1, right: 2, left: 3, down: 4 },
    jankenHand: 2,
    combatStats: { hp: 10, atk: 20, matk: 30, def: 40, mdef: 50, agi: 60 },
    trait: { classId: 1, seasonId: 1, rarity: 1 },
  });

  assert.deepEqual(c.edges, { up: 1, right: 2, down: 4, left: 3 });
  assert.equal(c.combatStatSum, 210);
  assert.equal(c.trait, "wind");
});
