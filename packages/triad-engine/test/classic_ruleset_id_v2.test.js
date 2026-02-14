import test from "node:test";
import assert from "node:assert/strict";
import {
  computeRulesetId,
  computeRulesetIdV1,
  computeRulesetIdV2,
  DEFAULT_RULESET_CONFIG_V1,
  DEFAULT_RULESET_CONFIG_V2,
} from "../dist/index.js";

test("rulesetId v2: deterministic for same config", () => {
  const a = computeRulesetIdV2(DEFAULT_RULESET_CONFIG_V2);
  const b = computeRulesetIdV2(structuredClone(DEFAULT_RULESET_CONFIG_V2));
  assert.equal(a, b);
});

test("rulesetId v2: classic toggles change id", () => {
  const a = computeRulesetIdV2(DEFAULT_RULESET_CONFIG_V2);
  const bCfg = structuredClone(DEFAULT_RULESET_CONFIG_V2);
  bCfg.classic.plus = true;
  const b = computeRulesetIdV2(bCfg);
  assert.notEqual(a, b);
});

test("rulesetId: dispatch helper keeps v1 behavior", () => {
  const v1a = computeRulesetIdV1(DEFAULT_RULESET_CONFIG_V1);
  const v1b = computeRulesetId(DEFAULT_RULESET_CONFIG_V1);
  assert.equal(v1a, v1b);
});

test("rulesetId: v1 and v2 defaults do not collide", () => {
  const v1 = computeRulesetIdV1(DEFAULT_RULESET_CONFIG_V1);
  const v2 = computeRulesetIdV2(DEFAULT_RULESET_CONFIG_V2);
  assert.notEqual(v1, v2);
});

