import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RULESET_CONFIG_V1, computeRulesetIdV1 } from "../dist/index.js";

test("rulesetId: default rulesetId is stable (v1 test vector)", () => {
  const id = computeRulesetIdV1(DEFAULT_RULESET_CONFIG_V1);
  assert.equal(id, "0x9fbdb6105169f321d8f2342fdcc2892e559588ac37b30ab1f5012709cf92b065");
});

test("rulesetId: disabled sections do not affect id (canonicalization)", () => {
  const a = structuredClone(DEFAULT_RULESET_CONFIG_V1);
  const b = structuredClone(DEFAULT_RULESET_CONFIG_V1);

  // Disable comboBonus and mutate inner params on one side.
  a.tactics.comboBonus.enabled = false;
  a.tactics.comboBonus.momentumAt = 99;
  a.tactics.comboBonus.dominationTriadPlus = 77;

  b.tactics.comboBonus.enabled = false;
  b.tactics.comboBonus.momentumAt = 3;
  b.tactics.comboBonus.dominationTriadPlus = 2;

  assert.equal(computeRulesetIdV1(a), computeRulesetIdV1(b));
});

test("rulesetId: requiredElements order does not affect id (treated as set)", () => {
  const a = structuredClone(DEFAULT_RULESET_CONFIG_V1);
  const b = structuredClone(DEFAULT_RULESET_CONFIG_V1);

  a.synergy.formationBonuses.fiveElementsHarmony.requiredElements = ["flame", "aqua", "earth", "wind", "thunder"];
  b.synergy.formationBonuses.fiveElementsHarmony.requiredElements = ["thunder", "wind", "earth", "aqua", "flame"];

  assert.equal(computeRulesetIdV1(a), computeRulesetIdV1(b));
});

test("rulesetId: traitDerivation disabled ignores mapping arrays", () => {
  const a = structuredClone(DEFAULT_RULESET_CONFIG_V1);
  const b = structuredClone(DEFAULT_RULESET_CONFIG_V1);

  a.synergy.traitDerivation.enabled = false;
  b.synergy.traitDerivation.enabled = false;

  // Mutate arrays on one side (should be ignored when disabled)
  a.synergy.traitDerivation.seasonTrait = ["cosmic", "cosmic", "cosmic", "cosmic"];
  a.synergy.traitDerivation.fixedTrait = ["earth", "earth", "earth", "earth", "earth"];

  assert.equal(computeRulesetIdV1(a), computeRulesetIdV1(b));
});
