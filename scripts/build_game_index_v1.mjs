/**
 * build_game_index_v1.mjs
 *
 * Reads on-chain Nyano game parameters (hand / combat stats / triad edges)
 * and writes `apps/web/public/game/index.v1.json`.
 *
 * Usage:  node scripts/build_game_index_v1.mjs [--rpc URL]
 *
 * Requires Node 20+ (native fetch).
 *
 * NOTE: The on-chain getTriad() values are the canonical source of truth.
 * An earlier version of the index was built from local metadata JSON files
 * which may contain slightly different triad values. This script always
 * reads from the chain to ensure correctness.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "apps", "web", "public", "game", "index.v1.json");

// ── Config ──

const CONTRACT = "0xd5839db20b47a06Ed09D7c0f44d9c2A4f0A6fEC3";
const MAX_TOKEN_ID = 10_000;
const BATCH_SIZE = 200; // multicall batch size

const DEFAULT_RPC_URLS = [
  "https://ethereum-rpc.publicnode.com",
  "https://rpc.ankr.com/eth",
  "https://eth.llamarpc.com",
];

function getRpcUrl() {
  const flag = process.argv.indexOf("--rpc");
  if (flag !== -1 && process.argv[flag + 1]) return process.argv[flag + 1];
  return process.env.RPC_URL ?? DEFAULT_RPC_URLS[0];
}

const RPC_URL = getRpcUrl();

// ── ABI selectors ──

// exists(uint256) => bool
const SEL_EXISTS = "0x4f558e79";
// getJankenHand(uint256) => uint8
const SEL_HAND = "0xce276e6c";
// getCombatStats(uint256) => (uint256,uint256,uint256,uint256,uint256,uint256)
const SEL_COMBAT = "0xa73eed5e";
// getTriad(uint256) => (uint256,uint256,uint256,uint256)
const SEL_TRIAD = "0x3cfa14f3";

function encodeUint256(n) {
  return n.toString(16).padStart(64, "0");
}

function encodeCall(selector, tokenId) {
  return selector + encodeUint256(tokenId);
}

// ── JSON-RPC helpers ──

let rpcId = 1;

async function rpcBatch(calls) {
  const body = calls.map((c) => ({
    jsonrpc: "2.0",
    method: "eth_call",
    params: [{ to: CONTRACT, data: c }, "latest"],
    id: rpcId++,
  }));

  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`RPC HTTP ${res.status}: ${await res.text()}`);
  const results = await res.json();

  // Sort by id to maintain order
  if (Array.isArray(results)) {
    results.sort((a, b) => a.id - b.id);
  }

  return Array.isArray(results) ? results : [results];
}

function decodeBool(hex) {
  if (!hex || hex === "0x") return false;
  return BigInt(hex) !== 0n;
}

function decodeUint8(hex) {
  if (!hex || hex === "0x") return 0;
  return Number(BigInt(hex) & 0xFFn);
}

function decodeUint256Array(hex, count) {
  if (!hex || hex === "0x") return Array(count).fill(0);
  const data = hex.startsWith("0x") ? hex.slice(2) : hex;
  const values = [];
  for (let i = 0; i < count; i++) {
    const chunk = data.slice(i * 64, (i + 1) * 64);
    values.push(chunk ? Number(BigInt("0x" + chunk)) : 0);
  }
  return values;
}

// ── Main ──

async function buildIndex() {
  console.log(`Building game index v1 from ${RPC_URL}`);
  console.log(`Contract: ${CONTRACT}`);
  console.log(`Max token ID: ${MAX_TOKEN_ID}, batch size: ${BATCH_SIZE}`);

  const tokens = {};
  const missing = [];
  let processed = 0;

  for (let start = 1; start <= MAX_TOKEN_ID; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, MAX_TOKEN_ID);
    const ids = [];
    for (let id = start; id <= end; id++) ids.push(id);

    // Build multicall: for each token, we need exists + hand + combat + triad = 4 calls
    const calls = [];
    for (const id of ids) {
      calls.push(encodeCall(SEL_EXISTS, id));
      calls.push(encodeCall(SEL_HAND, id));
      calls.push(encodeCall(SEL_COMBAT, id));
      calls.push(encodeCall(SEL_TRIAD, id));
    }

    const results = await rpcBatch(calls);

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const base = i * 4;

      const existsResult = results[base]?.result;
      const handResult = results[base + 1]?.result;
      const combatResult = results[base + 2]?.result;
      const triadResult = results[base + 3]?.result;

      // Check for errors
      if (results[base]?.error || !decodeBool(existsResult)) {
        missing.push(id);
        continue;
      }

      const hand = decodeUint8(handResult);
      const combat = decodeUint256Array(combatResult, 6); // hp, atk, matk, def, mdef, agi
      const triad = decodeUint256Array(triadResult, 4);   // up, right, left, down

      // Fields order: hand, hp, atk, matk, def, mdef, agi, up, right, left, down
      tokens[id] = [hand, ...combat, ...triad];
    }

    processed += ids.length;
    if (processed % 1000 === 0 || end === MAX_TOKEN_ID) {
      console.log(`  ${processed}/${MAX_TOKEN_ID} tokens processed (${Object.keys(tokens).length} found, ${missing.length} missing)`);
    }
  }

  // Sort missing
  missing.sort((a, b) => a - b);

  const index = {
    v: 1,
    maxTokenId: MAX_TOKEN_ID,
    fields: ["hand", "hp", "atk", "matk", "def", "mdef", "agi", "up", "right", "left", "down"],
    tokens,
    missing,
    metadata: {
      mode: "onchain",
      rpc: RPC_URL,
      contract: CONTRACT,
      generatedAt: new Date().toISOString(),
    },
  };

  fs.writeFileSync(outPath, JSON.stringify(index), "utf8");

  const size = fs.statSync(outPath).size;
  console.log(`\nDone!`);
  console.log(`  Tokens: ${Object.keys(tokens).length}`);
  console.log(`  Missing: ${missing.length}`);
  console.log(`  Output: ${outPath}`);
  console.log(`  Size: ${(size / 1024).toFixed(1)} KB`);
}

buildIndex().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
