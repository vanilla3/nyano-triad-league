#!/usr/bin/env node
/**
 * Print official on-chain rulesets for community sharing.
 *
 * Usage:
 *   pnpm -C packages/triad-engine build
 *   node scripts/print_official_onchain_rulesets.mjs
 *
 * Write stable JSON (no timestamp) to a file:
 *   node scripts/print_official_onchain_rulesets.mjs --out rulesets/official_onchain_rulesets.json
 *
 * Include timestamp even when writing:
 *   node scripts/print_official_onchain_rulesets.mjs --out rulesets/official_onchain_rulesets.json --with-timestamp
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const out = { out: null, pretty: true, withTimestamp: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") out.out = argv[++i];
    if (a === "--compact") out.pretty = false;

    // Timestamp policy:
    // - default: stdout -> include timestamp, file -> omit timestamp (stable)
    if (a === "--with-timestamp") out.withTimestamp = true;
    if (a === "--no-timestamp" || a === "--stable") out.withTimestamp = false;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const triadDistIndex = path.resolve(repoRoot, "packages/triad-engine/dist/index.js");

let triad;
try {
  triad = await import(triadDistIndex);
} catch (e) {
  console.error("Failed to import triad-engine dist. Did you run build?");
  console.error("  pnpm -C packages/triad-engine build");
  console.error(String(e?.message ?? e));
  process.exit(1);
}

const {
  computeRulesetIdV1,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2,
} = triad;

if (typeof computeRulesetIdV1 !== "function") {
  console.error("computeRulesetIdV1 is not exported from triad-engine. (dist/index.js)");
  process.exit(1);
}

if (!ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1 || !ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2) {
  console.error("Missing exported on-chain ruleset configs from triad-engine.");
  process.exit(1);
}

const v1RulesetId = computeRulesetIdV1(ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
const v2RulesetId = computeRulesetIdV1(ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2);

// Timestamp defaults: stable when writing to file, timestamp when printing to stdout.
let includeTimestamp = args.out ? false : true;
if (args.withTimestamp !== null) includeTimestamp = args.withTimestamp;

const outObj = {
  ...(includeTimestamp ? { generatedAt: new Date().toISOString() } : {}),
  notes: [
    "On-chain settlement is currently supported only for the official fixed configs below.",
    "configHash == rulesetId for v1 (ABI encoded canonical config hashed with keccak256).",
  ],
  rulesets: [
    {
      name: "onchain_core_tactics_v1",
      engineId: 1,
      rulesetId: v1RulesetId,
      configHash: v1RulesetId,
      uri: "(set your spec uri; e.g. ipfs://...)",
    },
    {
      name: "onchain_core_tactics_shadow_v2",
      engineId: 2,
      rulesetId: v2RulesetId,
      configHash: v2RulesetId,
      uri: "(set your spec uri; e.g. ipfs://...)",
    },
  ],
};

const jsonText = args.pretty ? JSON.stringify(outObj, null, 2) : JSON.stringify(outObj);

if (args.out) {
  const outPath = path.resolve(repoRoot, args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, jsonText + "\n", "utf8");
  console.log(`wrote: ${path.relative(repoRoot, outPath)}`);
} else {
  console.log(jsonText);
}
