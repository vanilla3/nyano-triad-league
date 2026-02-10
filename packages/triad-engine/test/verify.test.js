import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  decodeTurnsFromHex,
  verifyReplayV1,
  ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1,
  simulateMatchV1,
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

function loadVector() {
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
  return { t, cards };
}

test("verifyReplayV1: correct matchId → ok: true", () => {
  const { t, cards } = loadVector();
  // First simulate to get the real matchId
  const result = simulateMatchV1(t, cards, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
  const expected = result.matchId;

  const verify = verifyReplayV1(t, cards, expected, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
  assert.equal(verify.ok, true);
  assert.equal(verify.computedMatchId, expected);
  assert.equal(verify.expectedMatchId, expected);
  assert.equal(verify.winner, result.winner);
  assert.deepEqual(verify.tiles, result.tiles);
});

test("verifyReplayV1: wrong matchId → ok: false", () => {
  const { t, cards } = loadVector();

  const fakeMatchId = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const verify = verifyReplayV1(t, cards, fakeMatchId, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
  assert.equal(verify.ok, false);
  assert.notEqual(verify.computedMatchId, fakeMatchId);
  assert.equal(verify.expectedMatchId, fakeMatchId);
});

test("verifyReplayV1: tampered turn produces different matchId", () => {
  const { t, cards } = loadVector();
  const result = simulateMatchV1(t, cards, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
  const originalMatchId = result.matchId;

  // Tamper: swap the cells of the last two turns (both valid positions, no duplicates)
  const tamperedTurns = t.turns.map((turn, i) => {
    if (i === 7) return { ...turn, cell: t.turns[8].cell };
    if (i === 8) return { ...turn, cell: t.turns[7].cell };
    return turn;
  });
  const tamperedTranscript = { ...t, turns: tamperedTurns };

  const verify = verifyReplayV1(tamperedTranscript, cards, originalMatchId, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
  assert.equal(verify.ok, false, "Tampered transcript should not match original matchId");
  assert.notEqual(verify.computedMatchId, originalMatchId, "Tampered matchId should differ");
});

test("verifyReplayV1: deterministic across runs", () => {
  const { t, cards } = loadVector();

  const v1 = verifyReplayV1(t, cards, "ignored", ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
  const v2 = verifyReplayV1(t, cards, "ignored", ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);
  const v3 = verifyReplayV1(t, cards, "ignored", ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);

  assert.equal(v1.computedMatchId, v2.computedMatchId);
  assert.equal(v2.computedMatchId, v3.computedMatchId);
  assert.equal(v1.winner, v2.winner);
  assert.deepEqual(v1.tiles, v2.tiles);
});
