import test from "node:test";
import assert from "node:assert/strict";

import { simulateMatchV1, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1 } from "../dist/index.js";

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
      warningMarkCell: marks[i], // 0..8 or 255
      earthBoostEdge: earth[i],  // 0..3 or 255
    });
  }
  return turns;
}

function mkUniformCardsMap() {
  const m = new Map();
  for (let id = 1; id <= 10; id++) {
    const tokenId = BigInt(id);
    m.set(tokenId, {
      tokenId,
      edges: { up: 1, right: 1, down: 1, left: 1 },
      jankenHand: 0,
      combatStatSum: 3,
    });
  }
  return m;
}

test("core+tactics (on-chain subset): earthBoostEdge must be NONE(255) on every turn (non-255 throws)", () => {
  const movesHex = "001021314252637384";
  const warningMarksHex = "ffffffffffffffffff"; // none
  const earthBoostEdgesHex = "00ffffffffffffffff"; // INVALID: turn0 has 0 (edge=0)

  const transcript = {
    header: {
      version: 1,
      seasonId: 1,
      rulesetId: "0x1111111111111111111111111111111111111111111111111111111111111111",
      playerA: "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
      playerB: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
      deckA: [1n, 2n, 3n, 4n, 5n],
      deckB: [6n, 7n, 8n, 9n, 10n],
      firstPlayer: 0,
      deadline: 9999999999,
      salt: "0x2222222222222222222222222222222222222222222222222222222222222222",
    },
    turns: decodeTurns(movesHex, warningMarksHex, earthBoostEdgesHex),
  };

  const cards = mkUniformCardsMap();

  assert.throws(() => simulateMatchV1(transcript, cards, ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1));
});
