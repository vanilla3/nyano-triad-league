// SPDX-License-Identifier: MIT
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

    function test_vector_ties_do_not_flip_even_if_power_diff() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV1Harness h = new TriadEngineV1Harness();

        _setToken(nyano, 1, 5, 5, 5, 5, 0, 10);
        _setToken(nyano, 2, 5, 5, 5, 5, 0, 10);
        _setToken(nyano, 3, 5, 5, 5, 5, 0, 10);
        _setToken(nyano, 4, 5, 5, 5, 5, 0, 10);
        _setToken(nyano, 5, 5, 5, 5, 5, 0, 10);
        _setToken(nyano, 6, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 7, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 8, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 9, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 10, 5, 5, 5, 5, 0, 1);

        TranscriptV1.Data memory tr = _buildTranscript(
            1,
            0,
            0x1111111111111111111111111111111111111111111111111111111111111111,
            address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))),
            address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))),
            [uint256(1), 2, 3, 4, 5],
            [uint256(6), 7, 8, 9, 10],
            hex"001021314252637384",
            hex"ffffffffffffffffff",
            hex"ffffffffffffffffff",
            9999999999
        );

        TriadEngineV1.Result memory r = h.resolve(nyano, tr);
        _expectWinner(address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))), r.winner);
        require(r.tilesA == 5, "tilesA mismatch");
        require(r.tilesB == 4, "tilesB mismatch");
        require(r.tieScoreA == 50, "tieScoreA mismatch");
        require(r.tieScoreB == 4, "tieScoreB mismatch");
    }

    function test_vector_warning_mark_prevents_flip_no_other_flips() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV1Harness h = new TriadEngineV1Harness();

        _setToken(nyano, 1, 5, 5, 5, 5, 0, 10);
        _setToken(nyano, 2, 4, 4, 4, 4, 0, 10);
        _setToken(nyano, 3, 4, 4, 4, 4, 0, 10);
        _setToken(nyano, 4, 4, 4, 4, 4, 0, 10);
        _setToken(nyano, 5, 4, 4, 4, 4, 0, 10);
        _setToken(nyano, 6, 5, 5, 5, 5, 1, 10);
        _setToken(nyano, 7, 4, 4, 4, 4, 0, 10);
        _setToken(nyano, 8, 4, 4, 4, 4, 0, 10);
        _setToken(nyano, 9, 4, 4, 4, 4, 0, 10);
        _setToken(nyano, 10, 4, 4, 4, 4, 0, 10);

        TranscriptV1.Data memory tr = _buildTranscript(
            1,
            0,
            0x1111111111111111111111111111111111111111111111111111111111111111,
            address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))),
            address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))),
            [uint256(1), 2, 3, 4, 5],
            [uint256(6), 7, 8, 9, 10],
            hex"405001811272236334",
            hex"05ffffffffffffffff",
            hex"ffffffffffffffffff",
            9999999999
        );

        TriadEngineV1.Result memory r = h.resolve(nyano, tr);
        _expectWinner(address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))), r.winner);
        require(r.tilesA == 5, "tilesA mismatch");
        require(r.tilesB == 4, "tilesB mismatch");
        require(r.tieScoreA == 50, "tieScoreA mismatch");
        require(r.tieScoreB == 40, "tieScoreB mismatch");
    }

    function test_vector_single_flip_edge_advantage() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV1Harness h = new TriadEngineV1Harness();

        _setToken(nyano, 1, 1, 1, 1, 1, 0, 10);
        _setToken(nyano, 2, 1, 1, 2, 1, 0, 10);
        _setToken(nyano, 3, 1, 1, 1, 1, 0, 10);
        _setToken(nyano, 4, 1, 1, 1, 1, 0, 10);
        _setToken(nyano, 5, 1, 1, 1, 1, 0, 10);
        _setToken(nyano, 6, 1, 1, 1, 1, 0, 10);
        _setToken(nyano, 7, 1, 1, 1, 1, 0, 10);
        _setToken(nyano, 8, 1, 1, 1, 1, 0, 10);
        _setToken(nyano, 9, 1, 1, 1, 1, 0, 10);
        _setToken(nyano, 10, 1, 1, 1, 1, 0, 10);

        TranscriptV1.Data memory tr = _buildTranscript(
            1,
            0,
            0x1111111111111111111111111111111111111111111111111111111111111111,
            address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))),
            address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))),
            [uint256(1), 2, 3, 4, 5],
            [uint256(6), 7, 8, 9, 10],
            hex"001021314252637384",
            hex"ffffffffffffffffff",
            hex"ffffffffffffffffff",
            9999999999
        );

        TriadEngineV1.Result memory r = h.resolve(nyano, tr);
        _expectWinner(address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))), r.winner);
        require(r.tilesA == 6, "tilesA mismatch");
        require(r.tilesB == 3, "tilesB mismatch");
        require(r.tieScoreA == 60, "tieScoreA mismatch");
        require(r.tieScoreB == 30, "tieScoreB mismatch");
    }

    function test_vector_single_flip_gives_B_win() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV1Harness h = new TriadEngineV1Harness();

        _setToken(nyano, 1, 5, 5, 5, 5, 0, 10);
        _setToken(nyano, 2, 5, 5, 5, 5, 0, 10);
        _setToken(nyano, 3, 5, 5, 5, 5, 0, 10);
        _setToken(nyano, 4, 5, 5, 5, 5, 0, 10);
        _setToken(nyano, 5, 5, 5, 5, 5, 0, 10);
        _setToken(nyano, 6, 5, 5, 5, 6, 0, 1);
        _setToken(nyano, 7, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 8, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 9, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 10, 5, 5, 5, 5, 0, 1);

        TranscriptV1.Data memory tr = _buildTranscript(
            1,
            0,
            0x1111111111111111111111111111111111111111111111111111111111111111,
            address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))),
            address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))),
            [uint256(1), 2, 3, 4, 5],
            [uint256(6), 7, 8, 9, 10],
            hex"401001213252637384",
            hex"ffffffffffffffffff",
            hex"ffffffffffffffffff",
            9999999999
        );

        TriadEngineV1.Result memory r = h.resolve(nyano, tr);
        _expectWinner(address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))), r.winner);
        require(r.tilesA == 4, "tilesA mismatch");
        require(r.tilesB == 5, "tilesB mismatch");
        require(r.tieScoreA == 40, "tieScoreA mismatch");
        require(r.tieScoreB == 14, "tieScoreB mismatch");
    }

    function test_vector_chain_flip_two_tiles() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV1Harness h = new TriadEngineV1Harness();

        _setToken(nyano, 1, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 2, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 3, 6, 5, 5, 5, 0, 1);
        _setToken(nyano, 4, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 5, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 6, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 7, 5, 5, 6, 5, 0, 1);
        _setToken(nyano, 8, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 9, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 10, 5, 5, 5, 5, 0, 1);

        TranscriptV1.Data memory tr = _buildTranscript(
            1,
            0,
            0x1111111111111111111111111111111111111111111111111111111111111111,
            address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))),
            address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))),
            [uint256(1), 2, 3, 4, 5],
            [uint256(6), 7, 8, 9, 10],
            hex"800021114232536374",
            hex"ffffffffffffffffff",
            hex"ffffffffffffffffff",
            9999999999
        );

        TriadEngineV1.Result memory r = h.resolve(nyano, tr);
        _expectWinner(address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))), r.winner);
        require(r.tilesA == 7, "tilesA mismatch");
        require(r.tilesB == 2, "tilesB mismatch");
        require(r.tieScoreA == 7, "tieScoreA mismatch");
        require(r.tieScoreB == 2, "tieScoreB mismatch");
    }

    function test_vector_janken_breaks_edge_tie_flips() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV1Harness h = new TriadEngineV1Harness();

        _setToken(nyano, 1, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 2, 5, 5, 5, 5, 1, 1);
        _setToken(nyano, 3, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 4, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 5, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 6, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 7, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 8, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 9, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 10, 5, 5, 5, 5, 0, 1);

        TranscriptV1.Data memory tr = _buildTranscript(
            1,
            0,
            0x1111111111111111111111111111111111111111111111111111111111111111,
            address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))),
            address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))),
            [uint256(1), 2, 3, 4, 5],
            [uint256(6), 7, 8, 9, 10],
            hex"801001213242536374",
            hex"ffffffffffffffffff",
            hex"ffffffffffffffffff",
            9999999999
        );

        TriadEngineV1.Result memory r = h.resolve(nyano, tr);
        _expectWinner(address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))), r.winner);
        require(r.tilesA == 6, "tilesA mismatch");
        require(r.tilesB == 3, "tilesB mismatch");
        require(r.tieScoreA == 6, "tieScoreA mismatch");
        require(r.tieScoreB == 3, "tieScoreB mismatch");
    }

    function test_vector_domination_flips_three_next_bonus_plus2() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV1Harness h = new TriadEngineV1Harness();

        _setToken(nyano, 1, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 2, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 3, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 4, 5, 6, 6, 6, 0, 1);
        _setToken(nyano, 5, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 6, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 7, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 8, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 9, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 10, 5, 5, 5, 5, 0, 1);

        TranscriptV1.Data memory tr = _buildTranscript(
            1,
            0,
            0x1111111111111111111111111111111111111111111111111111111111111111,
            address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))),
            address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))),
            [uint256(1), 2, 3, 4, 5],
            [uint256(6), 7, 8, 9, 10],
            hex"600081217242133354",
            hex"ffffffffffffffffff",
            hex"ffffffffffffffffff",
            9999999999
        );

        TriadEngineV1.Result memory r = h.resolve(nyano, tr);
        _expectWinner(address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))), r.winner);
        require(r.tilesA == 8, "tilesA mismatch");
        require(r.tilesB == 1, "tilesB mismatch");
        require(r.tieScoreA == 8, "tieScoreA mismatch");
        require(r.tieScoreB == 1, "tieScoreB mismatch");
    }

    function test_vector_fever_flips_four_final_turn() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV1Harness h = new TriadEngineV1Harness();

        _setToken(nyano, 1, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 2, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 3, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 4, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 5, 6, 6, 6, 6, 0, 1);
        _setToken(nyano, 6, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 7, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 8, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 9, 5, 5, 5, 5, 0, 1);
        _setToken(nyano, 10, 5, 5, 5, 5, 0, 1);

        TranscriptV1.Data memory tr = _buildTranscript(
            1,
            0,
            0x1111111111111111111111111111111111111111111111111111111111111111,
            address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))),
            address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))),
            [uint256(1), 2, 3, 4, 5],
            [uint256(6), 7, 8, 9, 10],
            hex"001021316252837344",
            hex"ffffffffffffffffff",
            hex"ffffffffffffffffff",
            9999999999
        );

        TriadEngineV1.Result memory r = h.resolve(nyano, tr);
        _expectWinner(address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))), r.winner);
        require(r.tilesA == 9, "tilesA mismatch");
        require(r.tilesB == 0, "tilesB mismatch");
        require(r.tieScoreA == 9, "tieScoreA mismatch");
        require(r.tieScoreB == 0, "tieScoreB mismatch");
    }

    function test_vector_warning_mark_expires_if_not_stepped_allows_flip() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV1Harness h = new TriadEngineV1Harness();

        _setToken(nyano, 1, 1, 1, 1, 5, 0, 1);
        _setToken(nyano, 2, 1, 1, 1, 1, 0, 1);
        _setToken(nyano, 3, 1, 1, 1, 1, 0, 1);
        _setToken(nyano, 4, 1, 1, 1, 1, 0, 1);
        _setToken(nyano, 5, 1, 1, 1, 1, 0, 1);
        _setToken(nyano, 6, 1, 1, 1, 1, 0, 1);
        _setToken(nyano, 7, 5, 5, 5, 5, 1, 1);
        _setToken(nyano, 8, 1, 1, 1, 1, 0, 1);
        _setToken(nyano, 9, 1, 1, 1, 1, 0, 1);
        _setToken(nyano, 10, 1, 1, 1, 1, 0, 1);

        TranscriptV1.Data memory tr = _buildTranscript(
            1,
            1,
            0x1111111111111111111111111111111111111111111111111111111111111111,
            address(uint160(uint256(0x00aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa))),
            address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))),
            [uint256(1), 2, 3, 4, 5],
            [uint256(6), 7, 8, 9, 10],
            hex"100021413252637384",
            hex"04ffffffffffffffff",
            hex"ffffffffffffffffff",
            9999999999
        );

        TriadEngineV1.Result memory r = h.resolve(nyano, tr);
        _expectWinner(address(uint160(uint256(0x00bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb))), r.winner);
        require(r.tilesA == 4, "tilesA mismatch");
        require(r.tilesB == 5, "tilesB mismatch");
        require(r.tieScoreA == 4, "tieScoreA mismatch");
        require(r.tieScoreB == 5, "tieScoreB mismatch");
    }

}
