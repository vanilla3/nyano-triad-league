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

    const warningMarkCell = marks[i];
    const earthBoostEdge = earth[i];

    turns.push({
      cell,
      cardIndex,
      warningMarkCell, // 0..8 or 255
      earthBoostEdge, // 0..3 or 255 (should be 255 for on-chain subset)
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

test("core+tactics shared vectors (off-chain engine)", () => {
  const raw = fs.readFileSync(VECTORS_PATH, "utf8");
  const vectors = JSON.parse(raw);

  for (const c of vectors.cases) {
    const t = c.transcript;
    const transcript = {
      header: {
        version: 1,
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

    // Winner + tiles
    const expectedWinner = c.expected.winner === "A" ? 0 : c.expected.winner === "B" ? 1 : "draw";
    assert.equal(r.winner, expectedWinner, `case=${c.name} winner`);

    assert.equal(r.tiles.A, c.expected.tilesA, `case=${c.name} tilesA`);
    assert.equal(r.tiles.B, c.expected.tilesB, `case=${c.name} tilesB`);

    // Tie score (sum of combatStatSum controlled at end)
    let tieA = 0;
    let tieB = 0;
    for (const cell of r.board) {
      if (!cell) continue;
      if (cell.owner === 0) tieA += cell.card.combatStatSum;
      else tieB += cell.card.combatStatSum;
    }

    assert.equal(tieA, c.expected.tieScoreA, `case=${c.name} tieScoreA`);
    assert.equal(tieB, c.expected.tieScoreB, `case=${c.name} tieScoreB`);
  }
});
