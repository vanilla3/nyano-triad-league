import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  computeRulesetIdV1,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
} from "../dist/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OFFICIAL_PATH = path.resolve(__dirname, "../../../rulesets/official_onchain_rulesets.json");

test("official on-chain rulesets snapshot matches computed rulesetId", () => {
  const json = JSON.parse(fs.readFileSync(OFFICIAL_PATH, "utf8"));

  assert.ok(Array.isArray(json.rulesets), "rulesets must be an array");

  const byName = new Map(json.rulesets.map((r) => [r.name, r]));

  const v1 = byName.get("onchain_core_tactics_v1");
  const v2 = byName.get("onchain_core_tactics_shadow_v2");

  assert.ok(v1, "missing onchain_core_tactics_v1");
  assert.ok(v2, "missing onchain_core_tactics_shadow_v2");

  const v1Id = computeRulesetIdV1(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
  const v2Id = computeRulesetIdV1(ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2);

  assert.equal(v1.engineId, 1);
  assert.equal(v1.rulesetId, v1Id);
  assert.equal(v1.configHash, v1Id);

  assert.equal(v2.engineId, 2);
  assert.equal(v2.rulesetId, v2Id);
  assert.equal(v2.configHash, v2Id);
});
