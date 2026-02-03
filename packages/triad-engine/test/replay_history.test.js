import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  decodeTurnsFromHex,
  simulateMatchV1WithHistory,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
} from "../dist/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VECTORS_PATH = path.resolve(__dirname, "../../../test-vectors/core_tactics_v1.json");

function mkCardsMap(tokensObj) {
  const m = new Map();
  for (const [k, v] of Object.entries(tokensObj)) {
    const tokenId = BigInt(k);
    m.set(tokenId, {
      tokenId,
      edges: v.triad,
      jankenHand: v.hand,
      combatStatSum: v.power,
      trait: "none",
    });
  }
  return m;
}

test("simulateMatchV1WithHistory: boardHistory has 10 snapshots (initial + 9 turns)", () => {
  const vectors = JSON.parse(fs.readFileSync(VECTORS_PATH, "utf8"));
  const c = vectors.cases[0];

  const turns = decodeTurnsFromHex({
    movesHex: c.transcript.movesHex,
    warningMarksHex: c.transcript.warningMarksHex,
    earthBoostEdgesHex: c.transcript.earthBoostEdgesHex,
  });

  const t = {
    header: {
      version: c.transcript.version,
      seasonId: c.transcript.seasonId,
      rulesetId: c.transcript.rulesetId,
      playerA: c.transcript.playerA,
      playerB: c.transcript.playerB,
      deckA: c.transcript.deckA.map((x) => BigInt(x)),
      deckB: c.transcript.deckB.map((x) => BigInt(x)),
      firstPlayer: c.transcript.firstPlayer,
      deadline: c.transcript.deadline,
      salt: c.transcript.salt,
    },
    turns,
  };

  const cards = mkCardsMap(c.tokens);

  const r = simulateMatchV1WithHistory(t, cards, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);

  assert.equal(r.boardHistory.length, 10);

  // initial board is empty
  assert.equal(r.boardHistory[0].filter(Boolean).length, 0);

  // after first turn, one card exists
  assert.equal(r.boardHistory[1].filter(Boolean).length, 1);

  // after all turns, 9 cards exist
  assert.equal(r.boardHistory[9].filter(Boolean).length, 9);
});
