#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");
const vectorsPath = path.join(root, "test-vectors", "core_tactics_shadow_v2.json");
const outPath = path.join(root, "contracts", "test", "generated", "CoreTacticsShadowV2Test.sol");

const raw = fs.readFileSync(vectorsPath, "utf8");
const vectors = JSON.parse(raw);

function addrExpr(addr) {
  // Avoid Solidity checksum warnings by turning 20-byte hex into uint160(uint256(0x00...)).
  // Example: 0xaaaaaaaa.... => address(uint160(uint256(0x00aaaaaaaa....)))
  if (!addr.startsWith("0x") || addr.length !== 42) throw new Error(`bad addr: ${addr}`);
  return `address(uint160(uint256(0x00${addr.slice(2)})))`;
}

function bytesHexLiteral(hexStr) {
  // Accept either "0x..." or "...."
  const h = hexStr.startsWith("0x") ? hexStr.slice(2) : hexStr;
  if (h.length % 2 !== 0) throw new Error(`bad hex length: ${hexStr}`);
  return `hex"${h}"`;
}

function emitHeader() {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// -------------------------------------------------------------------------
//  AUTO-GENERATED FILE — DO NOT EDIT MANUALLY
//
//  Source: test-vectors/core_tactics_shadow_v2.json
//  Generator: scripts/generate_core_tactics_shadow_v2.mjs
// -------------------------------------------------------------------------

import "../../src/lib/TriadEngineV2.sol";
import "../../src/lib/TranscriptV1.sol";
import "../MockNyanoPeace.sol";

contract TriadEngineV2Harness {
    function resolve(INyanoPeace nyano, TranscriptV1.Data calldata t)
        external
        view
        returns (TriadEngineV2.Result memory)
    {
        return TriadEngineV2.resolve(nyano, t);
    }
}

contract CoreTacticsShadowV2Test {
    function _setToken(
        MockNyanoPeace nyano,
        uint256 tokenId,
        uint8 up,
        uint8 right,
        uint8 left,
        uint8 down,
        uint8 hand,
        uint16 power,
        uint8 classId,
        uint8 seasonId,
        uint8 rarity
    ) internal {
        nyano.setTriad(tokenId, up, right, left, down);
        nyano.setJankenHand(tokenId, hand);

        // Encode power as atk; other fields are irrelevant for v2 core+tactics+shadow subset (except tieScore).
        nyano.setCombatStats(tokenId, 1, power, 0, 1, 1, 0);

        nyano.setTrait(tokenId, classId, seasonId, rarity);
    }

    function _buildTranscript(
        uint8 version,
        uint64 seasonId,
        bytes32 rulesetId,
        address playerA,
        address playerB,
        uint256[5] memory deckA,
        uint256[5] memory deckB,
        bytes memory moves,
        bytes memory warningMarks,
        bytes memory earthBoostEdges,
        uint64 deadline
    ) internal pure returns (TranscriptV1.Data memory t) {
        t.version = version;
        t.seasonId = seasonId;
        t.rulesetId = rulesetId;
        t.playerA = playerA;
        t.playerB = playerB;
        t.deckA = deckA;
        t.deckB = deckB;
        t.moves = moves;
        t.warningMarks = warningMarks;
        t.earthBoostEdges = earthBoostEdges;
        t.reserved = bytes32(0);
        t.deadline = deadline;
    }

    function _expectWinner(address expected, address actual) internal pure {
        require(actual == expected, "winner mismatch");
    }
`;
}

function emitTestCase(c) {
  const t = c.transcript;
  const tokens = c.tokens;

  // Sort token ids numerically for deterministic output
  const tokenIds = Object.keys(tokens).map((s) => Number(s)).sort((a, b) => a - b);

  const setTokens = tokenIds.map((tid) => {
    const tok = tokens[String(tid)];
    const triad = tok.triad;
    const trait = tok.trait;
    if (!trait) throw new Error(`missing trait for token ${tid} in case ${c.name}`);
    return `        _setToken(nyano, ${tid}, ${triad.up}, ${triad.right}, ${triad.left}, ${triad.down}, ${tok.hand}, ${tok.power}, ${trait.classId}, ${trait.seasonId}, ${trait.rarity});`;
  }).join("\n");

  const winnerExpr = c.expected.winner === "A"
    ? addrExpr(t.playerA)
    : c.expected.winner === "B"
      ? addrExpr(t.playerB)
      : "address(0)";

  return `
    function test_vector_${c.name}() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV2Harness h = new TriadEngineV2Harness();

${setTokens}

        TranscriptV1.Data memory tr = _buildTranscript(
            ${t.version},
            ${t.seasonId},
            ${t.rulesetId},
            ${addrExpr(t.playerA)},
            ${addrExpr(t.playerB)},
            [uint256(${t.deckA[0]}), ${t.deckA[1]}, ${t.deckA[2]}, ${t.deckA[3]}, ${t.deckA[4]}],
            [uint256(${t.deckB[0]}), ${t.deckB[1]}, ${t.deckB[2]}, ${t.deckB[3]}, ${t.deckB[4]}],
            ${bytesHexLiteral(t.movesHex)},
            ${bytesHexLiteral(t.warningMarksHex)},
            ${bytesHexLiteral(t.earthBoostEdgesHex)},
            ${t.deadline}
        );

        TriadEngineV2.Result memory r = h.resolve(nyano, tr);

        _expectWinner(${winnerExpr}, r.winner);
        require(r.tilesA == ${c.expected.tilesA}, "tilesA mismatch");
        require(r.tilesB == ${c.expected.tilesB}, "tilesB mismatch");
        require(r.tieScoreA == ${c.expected.tieScoreA}, "tieScoreA mismatch");
        require(r.tieScoreB == ${c.expected.tieScoreB}, "tieScoreB mismatch");
    }
`;
}

let out = emitHeader();

for (const c of vectors.cases) {
  out += emitTestCase(c);
}

out += "}\n";

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);

console.log(`Generated: ${outPath}`);
