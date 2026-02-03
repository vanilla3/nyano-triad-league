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
        t.moves = hex"000102030405060708";
        t.warningMarks = hex"ffffffffffffffffff";     // 0xff * 9
        t.earthBoostEdges = hex"ffffffffffffffffff";  // 0xff * 9

        t.reserved = bytes32(0);
        t.deadline = 9999999999;
    }

    function validateExternal(TranscriptV1.Data calldata t) external pure {
        TranscriptV1.validate(t);
    }

    function test_validate_ok() public pure {
        TranscriptV1.Data memory t = _makeValid();
        TranscriptV1.validate(t);
    }

    function test_validate_reverts_on_bad_moves_len() public view {
        TranscriptV1.Data memory t = _makeValid();
        t.moves = hex"0001020304050607"; // 8 bytes

        bool ok;
        try this.validateExternal(t) {
            ok = true;
        } catch {
            ok = false;
        }
        require(!ok, "expected revert");
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
