import test from "node:test";
import assert from "node:assert/strict";

import { decodeTurnsFromHex, encodeTurnsToHex } from "../dist/index.js";

test("transcript_codec: encode/decode roundtrip (9 turns)", () => {
  const turns = Array.from({ length: 9 }, (_, i) => ({
    cell: i,
    cardIndex: i % 5,
    warningMarkCell: i === 3 ? 2 : 255,
    earthBoostEdge: 255,
  }));

  const hex = encodeTurnsToHex(turns, { prefix: false });
  const decoded = decodeTurnsFromHex(hex);

  assert.equal(decoded.length, 9);
  for (let i = 0; i < 9; i++) {
    assert.equal(decoded[i].cell, turns[i].cell);
    assert.equal(decoded[i].cardIndex, turns[i].cardIndex);
    assert.equal(decoded[i].warningMarkCell, turns[i].warningMarkCell);
    assert.equal(decoded[i].earthBoostEdge, turns[i].earthBoostEdge);
  }
});
