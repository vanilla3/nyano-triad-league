// SPDX-License-Identifier: MIT
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

    function test_vector_non_shadow_warning_mark_still_prevents_flip() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV2Harness h = new TriadEngineV2Harness();

        _setToken(nyano, 1, 5, 5, 5, 5, 0, 10, 1, 1, 1);
        _setToken(nyano, 2, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 3, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 4, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 5, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 6, 5, 5, 5, 5, 1, 10, 1, 1, 1);
        _setToken(nyano, 7, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 8, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 9, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 10, 4, 4, 4, 4, 0, 10, 1, 1, 1);

        TranscriptV1.Data memory tr = _buildTranscript(
            1,
            0,
            0x2222222222222222222222222222222222222222222222222222222222222222,
            address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))),
            address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))),
            [uint256(1), 2, 3, 4, 5],
            [uint256(6), 7, 8, 9, 10],
            hex"405001811272236334",
            hex"05ffffffffffffffff",
            hex"ffffffffffffffffff",
            9999999999
        );

        TriadEngineV2.Result memory r = h.resolve(nyano, tr);

        _expectWinner(address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))), r.winner);
        require(r.tilesA == 5, "tilesA mismatch");
        require(r.tilesB == 4, "tilesB mismatch");
        require(r.tieScoreA == 50, "tieScoreA mismatch");
        require(r.tieScoreB == 40, "tieScoreB mismatch");
    }

    function test_vector_shadow_ignores_warning_mark_allows_flip() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV2Harness h = new TriadEngineV2Harness();

        _setToken(nyano, 1, 5, 5, 5, 5, 0, 10, 1, 1, 1);
        _setToken(nyano, 2, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 3, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 4, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 5, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 6, 5, 5, 5, 5, 1, 10, 5, 1, 3);
        _setToken(nyano, 7, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 8, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 9, 4, 4, 4, 4, 0, 10, 1, 1, 1);
        _setToken(nyano, 10, 4, 4, 4, 4, 0, 10, 1, 1, 1);

        TranscriptV1.Data memory tr = _buildTranscript(
            1,
            0,
            0x2222222222222222222222222222222222222222222222222222222222222222,
            address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))),
            address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))),
            [uint256(1), 2, 3, 4, 5],
            [uint256(6), 7, 8, 9, 10],
            hex"405001811272236334",
            hex"05ffffffffffffffff",
            hex"ffffffffffffffffff",
            9999999999
        );

        TriadEngineV2.Result memory r = h.resolve(nyano, tr);

        _expectWinner(address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))), r.winner);
        require(r.tilesA == 4, "tilesA mismatch");
        require(r.tilesB == 5, "tilesB mismatch");
        require(r.tieScoreA == 40, "tieScoreA mismatch");
        require(r.tieScoreB == 50, "tieScoreB mismatch");
    }
}
