    import fs from "node:fs";
    import path from "node:path";
    import { fileURLToPath } from "node:url";
    import { getAddress } from "ethers";

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const root = path.resolve(__dirname, "..");
    const vectorsPath = path.join(root, "test-vectors", "core_tactics_v1.json");
    const outPath = path.join(root, "contracts", "test", "generated", "CoreTacticsVectorsV1Test.sol");

    const data = JSON.parse(fs.readFileSync(vectorsPath, "utf8"));
    if (!data?.cases || !Array.isArray(data.cases)) {
      throw new Error("Invalid vectors JSON: missing cases[]");
    }

    const sanitize = (name) => name.replace(/[^a-zA-Z0-9_]/g, "_");

    const solidityHeader = `// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.20;

    // -------------------------------------------------------------------------
    //  AUTO-GENERATED FILE — DO NOT EDIT MANUALLY
    //
    //  Source: test-vectors/core_tactics_v1.json
    //  Generator: scripts/generate_core_tactics_vectors_v1.mjs
    // -------------------------------------------------------------------------

    import "../../src/lib/TriadEngineV1.sol";
    import "../../src/lib/TranscriptV1.sol";
    import "../MockNyanoPeace.sol";

    contract TriadEngineV1Harness {
        function resolve(INyanoPeace nyano, TranscriptV1.Data calldata t)
            external
            view
            returns (TriadEngineV1.Result memory)
        {
            return TriadEngineV1.resolve(nyano, t);
        }
    }

    contract CoreTacticsVectorsV1Test {
        function _setToken(
            MockNyanoPeace nyano,
            uint256 tokenId,
            uint8 up,
            uint8 right,
            uint8 left,
            uint8 down,
            uint8 hand,
            uint16 power
        ) internal {
            nyano.setTriad(tokenId, up, right, left, down);
            nyano.setJankenHand(tokenId, hand);

            // Encode power as atk; other fields are irrelevant for v1 core+tactics (except tieScore).
            nyano.setCombatStats(tokenId, 1, power, 0, 1, 1, 0);
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

    let out = solidityHeader;

    for (const c of data.cases) {
      const name = sanitize(c.name);
      const t = c.transcript;
      const exp = c.expected;
      if (!t || !exp) throw new Error(`case ${c.name}: missing transcript/expected`);

      const playerA = getAddress(t.playerA);
      const playerB = getAddress(t.playerB);

      const winnerExpr =
        exp.winner === "A" ? playerA :
        exp.winner === "B" ? playerB :
        "address(0)";

      const tokenIds = Object.keys(c.tokens || {}).map((x) => BigInt(x)).sort((a,b)=> (a<b?-1:1));

      out += `    function test_vector_${name}() public {
`;
      out += `        MockNyanoPeace nyano = new MockNyanoPeace();
`;
      out += `        TriadEngineV1Harness h = new TriadEngineV1Harness();

`;

      for (const tokenId of tokenIds) {
        const tok = c.tokens[String(tokenId)];
        if (!tok) continue;
        const tri = tok.triad;
        out += `        _setToken(nyano, ${tokenId} , ${tri.up}, ${tri.right}, ${tri.left}, ${tri.down}, ${tok.hand}, ${tok.power});
`;
      }

      out += `
        TranscriptV1.Data memory tr = _buildTranscript(
`;
      out += `            ${t.version},
`;
      out += `            ${t.seasonId},
`;
      out += `            ${t.rulesetId},
`;
      out += `            ${t.playerA},
`;
      out += `            ${t.playerB},
`;
      out += `            [uint256(${t.deckA[0]}), ${t.deckA[1]}, ${t.deckA[2]}, ${t.deckA[3]}, ${t.deckA[4]}],
`;
      out += `            [uint256(${t.deckB[0]}), ${t.deckB[1]}, ${t.deckB[2]}, ${t.deckB[3]}, ${t.deckB[4]}],
`;
      out += `            hex"${t.movesHex}",
`;
      out += `            hex"${t.warningMarksHex}",
`;
      out += `            hex"${t.earthBoostEdgesHex}",
`;
      out += `            ${t.deadline}
`;
      out += `        );

`;

      out += `        TriadEngineV1.Result memory r = h.resolve(nyano, tr);
`;
      out += `        _expectWinner(${winnerExpr}, r.winner);
`;
      out += `        require(r.tilesA == ${exp.tilesA}, "tilesA mismatch");
`;
      out += `        require(r.tilesB == ${exp.tilesB}, "tilesB mismatch");
`;
      out += `        require(r.tieScoreA == ${exp.tieScoreA}, "tieScoreA mismatch");
`;
      out += `        require(r.tieScoreB == ${exp.tieScoreB}, "tieScoreB mismatch");
`;
      out += `    }

`;
    }

    out += "}\n";
fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, out);
    console.log(`Generated: ${path.relative(root, outPath)}`);
