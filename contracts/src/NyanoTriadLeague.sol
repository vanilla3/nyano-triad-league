// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/INyanoPeace.sol";
import "./interfaces/IRulesetRegistry.sol";
import "./lib/ECDSA.sol";
import "./lib/EIP712Domain.sol";
import "./lib/TranscriptV1.sol";
import "./lib/TriadEngineV1.sol";
import "./lib/TriadEngineV2.sol";

/// @notice ETH-only official match submission contract.
/// @dev Settles matches on-chain with deterministic engines:
///      - submitMatchV1 -> TriadEngineV1 (Core + Tactics)
///      - submitMatchV2 -> TriadEngineV2 (Core + Tactics + Shadow ignores warning mark)
///
/// SECURITY NOTE:
/// - The RulesetRegistry stores `engineId` per rulesetId.
/// - Each submit function enforces (if registry is configured) that the ruleset's engineId matches.
///   This prevents settling a signed match with the wrong engine.
contract NyanoTriadLeague is EIP712Domain {
    using ECDSA for bytes32;

    INyanoPeace public immutable nyano;
    IRulesetRegistry public immutable rulesetRegistry; // optional; address(0) disables checks

    // replay protection
    mapping(bytes32 => bool) public submitted;

    struct Settlement {
        address winner; // address(0) if draw
        uint8 tilesA;
        uint8 tilesB;
        uint64 tieScoreA;
        uint64 tieScoreB;
    }
    mapping(bytes32 => Settlement) public settlements;

    event MatchSubmitted(
        bytes32 indexed matchId,
        bytes32 indexed rulesetId,
        address indexed submitter,
        address playerA,
        address playerB
    );

    event MatchSettled(
        bytes32 indexed matchId,
        bytes32 indexed rulesetId,
        address winner,
        uint8 tilesA,
        uint8 tilesB
    );

    string private constant _NAME = "Nyano Triad League";
    string private constant _VERSION = "1";

    constructor(address nyano_, address rulesetRegistry_) EIP712Domain(_NAME, _VERSION) {
        require(nyano_ != address(0), "nyano=0");
        nyano = INyanoPeace(nyano_);
        rulesetRegistry = IRulesetRegistry(rulesetRegistry_); // may be 0
    }

    function _name() internal pure override returns (string memory) { return _NAME; }
    function _version() internal pure override returns (string memory) { return _VERSION; }

    /// @notice Submit an official match transcript using TriadEngineV1.
    function submitMatchV1(TranscriptV1.Data calldata t, bytes calldata sigA, bytes calldata sigB) external {
        _submit(t, sigA, sigB, 1);
    }

    /// @notice Submit an official match transcript using TriadEngineV2.
    function submitMatchV2(TranscriptV1.Data calldata t, bytes calldata sigA, bytes calldata sigB) external {
        _submit(t, sigA, sigB, 2);
    }

    function _submit(TranscriptV1.Data calldata t, bytes calldata sigA, bytes calldata sigB, uint8 engineId) private {
        TranscriptV1.validate(t);
        require(block.timestamp <= t.deadline, "expired");

        _requireRulesetActiveAndEngine(t.rulesetId, engineId);

        // prevent duplicates
        bytes32 matchId_ = TranscriptV1.matchId(t);
        require(!submitted[matchId_], "already submitted");

        // verify signatures (EIP-712 typed data)
        bytes32 digest = _hashTypedData(TranscriptV1.structHash(t));
        address recoveredA = digest.recover(sigA);
        address recoveredB = digest.recover(sigB);

        require(recoveredA == t.playerA, "bad sigA");
        require(recoveredB == t.playerB, "bad sigB");

        // ownership checks at submit time
        _requireDeckOwnership(t.playerA, t.deckA);
        _requireDeckOwnership(t.playerB, t.deckB);

        // basic deck sanity
        _requireUnique(t.deckA);
        _requireUnique(t.deckB);

        // settle with selected engine
        address winner;
        uint8 tilesA;
        uint8 tilesB;
        uint64 tieScoreA;
        uint64 tieScoreB;

        if (engineId == 1) {
            TriadEngineV1.Result memory res1 = TriadEngineV1.resolve(nyano, t);
            winner = res1.winner;
            tilesA = res1.tilesA;
            tilesB = res1.tilesB;
            tieScoreA = res1.tieScoreA;
            tieScoreB = res1.tieScoreB;
        } else if (engineId == 2) {
            TriadEngineV2.Result memory res2 = TriadEngineV2.resolve(nyano, t);
            winner = res2.winner;
            tilesA = res2.tilesA;
            tilesB = res2.tilesB;
            tieScoreA = res2.tieScoreA;
            tieScoreB = res2.tieScoreB;
        } else {
            revert("unsupported engine");
        }

        submitted[matchId_] = true;
        settlements[matchId_] = Settlement({
            winner: winner,
            tilesA: tilesA,
            tilesB: tilesB,
            tieScoreA: tieScoreA,
            tieScoreB: tieScoreB
        });

        emit MatchSubmitted(matchId_, t.rulesetId, msg.sender, t.playerA, t.playerB);
        emit MatchSettled(matchId_, t.rulesetId, winner, tilesA, tilesB);
    }

    function _requireRulesetActiveAndEngine(bytes32 rulesetId, uint8 expectedEngineId) private view {
        if (address(rulesetRegistry) == address(0)) return;

        require(rulesetRegistry.isActive(rulesetId), "ruleset inactive");

        uint8 actual = rulesetRegistry.engineOf(rulesetId);
        // Back-compat: treat 0 as v1 (older registry versions / unset info).
        if (actual == 0) actual = 1;

        require(actual == expectedEngineId, "ruleset engine mismatch");
    }

    function _requireDeckOwnership(address player, uint256[5] calldata deck) private view {
        for (uint256 i = 0; i < 5; i++) {
            require(nyano.ownerOf(deck[i]) == player, "not ownerOf token");
        }
    }

    function _requireUnique(uint256[5] calldata deck) private pure {
        for (uint256 i = 0; i < 5; i++) {
            for (uint256 j = i + 1; j < 5; j++) {
                require(deck[i] != deck[j], "duplicate token in deck");
            }
        }
    }
}
