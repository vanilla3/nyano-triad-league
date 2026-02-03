// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/interfaces/INyanoPeace.sol";
import "../src/lib/TriadEngineV1.sol";
import "../src/lib/TranscriptV1.sol";

import "./MockNyanoPeace.sol";

contract TriadEngineV1Harness_WarningMarkLimit {
    function resolve(INyanoPeace nyano, TranscriptV1.Data calldata t)
        external
        view
        returns (TriadEngineV1.Result memory)
    {
        return TriadEngineV1.resolve(nyano, t);
    }
}

contract WarningMarkLimitTest {
    function _setToken(MockNyanoPeace nyano, uint256 tokenId) internal {
        nyano.setTriad(tokenId, 1, 1, 1, 1);
        nyano.setJankenHand(tokenId, 0);

        // Encode deterministic power as atk; other fields irrelevant for core+tactics v1.
        nyano.setCombatStats(tokenId, 1, 3, 0, 1, 1, 0);
    }

    function test_warning_mark_limit_reverts_on_4th_mark_for_A() public {
        MockNyanoPeace nyano = new MockNyanoPeace();
        TriadEngineV1Harness_WarningMarkLimit h = new TriadEngineV1Harness_WarningMarkLimit();

        for (uint256 i = 1; i <= 10; i++) {
            _setToken(nyano, i);
        }

        TranscriptV1.Data memory t;
        t.version = 1;
        t.seasonId = 1;
        t.rulesetId = bytes32(uint256(1));
        t.playerA = 0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa;
        t.playerB = 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB;
        t.deckA = [uint256(1), 2, 3, 4, 5];
        t.deckB = [uint256(6), 7, 8, 9, 10];

        // Standard placement (no flips in this setup). A attempts 4 warning marks -> should revert at turn 6.
        t.moves = hex"001021314252637384";
        t.warningMarks = hex"08ff07ff06ff07ffff";     // A uses mark on turns 0/2/4/6 (4 uses)
        t.earthBoostEdges = hex"ffffffffffffffffff";  // on-chain subset requires NONE

        t.reserved = bytes32(0);
        t.deadline = 9999999999;

        bool ok;
        try h.resolve(nyano, t) returns (TriadEngineV1.Result memory) {
            ok = true;
        } catch {
            ok = false;
        }

        require(!ok, "expected revert: warning mark uses > 3");
    }
}
