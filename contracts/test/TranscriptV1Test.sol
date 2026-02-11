// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/lib/TranscriptV1.sol";

/// @notice Minimal tests without external deps (forge treats reverts as failures).
contract TranscriptV1Test {
    function _makeValid() internal pure returns (TranscriptV1.Data memory t) {
        t.version = 1;
        t.seasonId = 1;
        t.rulesetId = bytes32(uint256(123));
        t.playerA = address(0x1111);
        t.playerB = address(0x2222);
        t.deckA = [uint256(1), 2, 3, 4, 5];
        t.deckB = [uint256(6), 7, 8, 9, 10];

        // 9 bytes each
        t.moves = hex"001021314252637384";
        t.warningMarks = hex"ffffffffffffffffff";     // 0xff * 9
        t.earthBoostEdges = hex"ffffffffffffffffff";  // 0xff * 9

        t.reserved = bytes32(0);
        t.deadline = 9999999999;
    }

    function validateExternal(TranscriptV1.Data calldata t) external pure {
        TranscriptV1.validate(t);
    }

    function _expectValidateRevert(TranscriptV1.Data memory t) private view {
        bool ok;
        try this.validateExternal(t) {
            ok = true;
        } catch {
            ok = false;
        }
        require(!ok, "expected revert");
    }

    function test_validate_ok() public pure {
        TranscriptV1.Data memory t = _makeValid();
        TranscriptV1.validate(t);
    }

    function test_validate_reverts_on_bad_moves_len() public view {
        TranscriptV1.Data memory t = _makeValid();
        t.moves = hex"0001020304050607"; // 8 bytes
        _expectValidateRevert(t);
    }

    function test_validate_reverts_on_move_cell_out_of_range() public view {
        TranscriptV1.Data memory t = _makeValid();
        t.moves = hex"901020304050607080"; // first cell = 9 (invalid)
        _expectValidateRevert(t);
    }

    function test_validate_reverts_on_move_card_index_out_of_range() public view {
        TranscriptV1.Data memory t = _makeValid();
        t.moves = hex"051020304050607080"; // first cardIndex = 5 (invalid)
        _expectValidateRevert(t);
    }

    function test_validate_reverts_on_warning_mark_value() public view {
        TranscriptV1.Data memory t = _makeValid();
        t.warningMarks = hex"09ffffffffffffffff"; // first warning mark = 9 (invalid)
        _expectValidateRevert(t);
    }

    function test_validate_reverts_on_earth_boost_edge_value() public view {
        TranscriptV1.Data memory t = _makeValid();
        t.earthBoostEdges = hex"04ffffffffffffffff"; // first edge = 4 (invalid)
        _expectValidateRevert(t);
    }

    function test_matchId_changes_when_one_field_changes() public pure {
        TranscriptV1.Data memory a = _makeValid();
        TranscriptV1.Data memory b = _makeValid();
        b.rulesetId = bytes32(uint256(124));

        bytes32 ida = TranscriptV1.matchId(a);
        bytes32 idb = TranscriptV1.matchId(b);
        require(ida != idb, "matchId should differ");
    }
}
