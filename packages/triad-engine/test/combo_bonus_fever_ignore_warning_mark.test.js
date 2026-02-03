import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { simulateMatchV1, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1 } from "../dist/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VECTORS_PATH = path.resolve(__dirname, "../../../test-vectors/core_tactics_v1.json");

function hexToBytes(hex) {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length % 2 !== 0) throw new Error("hex must have even length");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function decodeTurns(movesHex, warningMarksHex, earthBoostEdgesHex) {
  const moves = hexToBytes(movesHex);
  const marks = hexToBytes(warningMarksHex);
  const earth = hexToBytes(earthBoostEdgesHex);

  assert.equal(moves.length, 9, "moves must be 9 bytes");
  assert.equal(marks.length, 9, "warningMarks must be 9 bytes");
  assert.equal(earth.length, 9, "earthBoostEdges must be 9 bytes");

  const turns = [];
  for (let i = 0; i < 9; i++) {
    const m = moves[i];
    const cell = (m >> 4) & 0x0f;
    const cardIndex = m & 0x0f;

    turns.push({
      cell,
      cardIndex,
      warningMarkCell: marks[i],
      earthBoostEdge: earth[i],
    });
  }
  return turns;
}

function mkCardsMap(tokensObj) {
  const m = new Map();
  for (const [k, v] of Object.entries(tokensObj)) {
    const tokenId = BigInt(k);
    m.set(tokenId, {
      tokenId,
      edges: {
        up: v.triad.up,
        right: v.triad.right,
        down: v.triad.down,
        left: v.triad.left,
      },
      jankenHand: v.hand,
      combatStatSum: v.power,
    });
  }
  return m;
}

test("combo: fever makes next card ignore warning mark (core+tactics subset)", () => {
  const vectors = JSON.parse(fs.readFileSync(VECTORS_PATH, "utf8"));
  const c = vectors.cases.find((x) => x.name === "fever_ignores_warning_mark_on_next_card_allows_flip");
  assert.ok(c, "missing vector case: fever_ignores_warning_mark_on_next_card_allows_flip");

  const t = c.transcript;
  const transcript = {
    header: {
      version: t.version,
      seasonId: t.seasonId,
      rulesetId: t.rulesetId,
      playerA: t.playerA,
      playerB: t.playerB,
      deckA: t.deckA.map(BigInt),
      deckB: t.deckB.map(BigInt),
      firstPlayer: t.firstPlayer,
      deadline: t.deadline,
      salt: t.salt,
    },
    turns: decodeTurns(t.movesHex, t.warningMarksHex, t.earthBoostEdgesHex),
  };

  const cards = mkCardsMap(c.tokens);
  const r = simulateMatchV1(transcript, cards, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1);

  // Turn6 (A) flips 4 tiles => comboCount=5 => Fever.
  assert.equal(r.turns[6].flipCount, 4);
  assert.equal(r.turns[6].comboCount, 5);
  assert.equal(r.turns[6].comboEffect, "fever");

  // Turn8 (A) steps on warning mark but should ignore it due to Fever.
  assert.equal(r.turns[8].appliedBonus.ignoreWarningMark, true);
  assert.equal(r.turns[8].flipCount, 1);

  // Expected final tiles in vector: A=8, B=1
  assert.equal(r.tiles.A, 8);
  assert.equal(r.tiles.B, 1);
});
