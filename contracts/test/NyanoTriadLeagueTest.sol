// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/NyanoTriadLeague.sol";
import "../src/governance/RulesetRegistry.sol";
import "../src/lib/TranscriptV1.sol";
import "./MockNyanoPeace.sol";

interface Vm {
    function addr(uint256 privateKey) external returns (address);
    function sign(uint256 privateKey, bytes32 digest) external returns (uint8 v, bytes32 r, bytes32 s);
}

/// @notice Foundry tests for NyanoTriadLeague v1 (core+tactics settlement).
contract NyanoTriadLeagueTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 private constant PK_A = 0xA11CE;
    uint256 private constant PK_B = 0xB0B;

    address private playerA;
    address private playerB;

    MockNyanoPeace private nyano;
    RulesetRegistry private registry;
    NyanoTriadLeague private league;

    bytes32 private constant RULESET_ID = bytes32(uint256(1));

    function setUp() public {
        playerA = vm.addr(PK_A);
        playerB = vm.addr(PK_B);

        nyano = new MockNyanoPeace();

        // mint 10 tokens with identical attributes to avoid flips (A should win 5-4 by placement count)
        for (uint256 tokenId = 1; tokenId <= 10; tokenId++) {
            address owner = tokenId <= 5 ? playerA : playerB;
            nyano.mintTo(owner, tokenId);

            nyano.setTriad(tokenId, 1, 1, 1, 1);
            nyano.setJankenHand(tokenId, 0); // Rock
            nyano.setCombatStats(tokenId, 1, 1, 1, 1, 1, 1); // power=atk+matk+agi=3
            nyano.setTrait(tokenId, 1, 1, 1);
        }

        // mint 1 token to this test contract so it can register rulesets (balance-gated)
        nyano.mintTo(address(this), 999);
        nyano.setTriad(999, 1, 1, 1, 1);
        nyano.setJankenHand(999, 0);
        nyano.setCombatStats(999, 1, 1, 1, 1, 1, 1);
        nyano.setTrait(999, 1, 1, 1);
        registry = new RulesetRegistry(address(nyano));
        registry.register(RULESET_ID, bytes32(0), "ipfs://ruleset");

        league = new NyanoTriadLeague(address(nyano), address(registry));
    }

    function test_submitMatchV1_settles_and_records() public {
        TranscriptV1.Data memory t = _makeTranscript();

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", league.domainSeparator(), TranscriptV1.structHash(t)));

        bytes memory sigA = _sig(PK_A, digest);
        bytes memory sigB = _sig(PK_B, digest);

        league.submitMatchV1(t, sigA, sigB);

        bytes32 matchId = TranscriptV1.matchId(t);
        require(league.submitted(matchId), "submitted=false");

        (address winner, uint8 tilesA, uint8 tilesB, , ) = league.settlements(matchId);
        require(winner == playerA, "winner should be A (5-4)");
        require(tilesA == 5 && tilesB == 4, "tiles mismatch");
    }

    function test_submitMatchV1_reverts_on_replay() public {
        TranscriptV1.Data memory t = _makeTranscript();
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", league.domainSeparator(), TranscriptV1.structHash(t)));
        bytes memory sigA = _sig(PK_A, digest);
        bytes memory sigB = _sig(PK_B, digest);

        league.submitMatchV1(t, sigA, sigB);

        bool ok;
        try league.submitMatchV1(t, sigA, sigB) {
            ok = true;
        } catch {
            ok = false;
        }
        require(!ok, "expected revert on replay");
    }

    function test_submitMatchV1_reverts_when_ruleset_inactive() public {
        registry.setActive(RULESET_ID, false);

        TranscriptV1.Data memory t = _makeTranscript();
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", league.domainSeparator(), TranscriptV1.structHash(t)));
        bytes memory sigA = _sig(PK_A, digest);
        bytes memory sigB = _sig(PK_B, digest);

        bool ok;
        try league.submitMatchV1(t, sigA, sigB) {
            ok = true;
        } catch {
            ok = false;
        }
        require(!ok, "expected revert when inactive ruleset");
    }

    // ---- helpers ----

    function _makeTranscript() private view returns (TranscriptV1.Data memory t) {
        t.version = 1;
        t.seasonId = 1;
        t.rulesetId = RULESET_ID;
        t.playerA = playerA;
        t.playerB = playerB;

        t.deckA = [uint256(1),2,3,4,5];
        t.deckB = [uint256(6),7,8,9,10];

        // 9 turns, each move byte: (cell<<4) | cardIndex
        t.moves = hex"001021314252637384";
        t.warningMarks = hex"ffffffffffffffffff";     // 9 bytes of NONE
        t.earthBoostEdges = hex"ffffffffffffffffff";  // 9 bytes of NONE

        t.reserved = bytes32(0);
        t.deadline = uint64(block.timestamp + 3600);
    }

    function _sig(uint256 pk, bytes32 digest) private returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }
}
