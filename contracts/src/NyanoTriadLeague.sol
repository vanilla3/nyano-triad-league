// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/INyanoPeace.sol";
import "./interfaces/IRulesetRegistry.sol";
import "./lib/ECDSA.sol";
import "./lib/EIP712Domain.sol";
import "./lib/TranscriptV1.sol";
import "./lib/TriadEngineV1.sol";

/// @notice ETH-only official match submission contract (v1).
/// @dev This version settles matches with the on-chain Core+Tactics engine (TriadEngineV1).
///      Synergy/Formation/Season modules are not supported yet.
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

    /// @notice Submit an official match transcript. Verifies signatures + ownership, settles result, stores it, emits events.
    function submitMatchV1(TranscriptV1.Data calldata t, bytes calldata sigA, bytes calldata sigB) external {
        TranscriptV1.validate(t);
        require(block.timestamp <= t.deadline, "expired");

        // Optional ruleset gating (active rulesets only)
        if (address(rulesetRegistry) != address(0)) {
            require(rulesetRegistry.isActive(t.rulesetId), "ruleset inactive");
        }

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

        // settle with on-chain engine (Core + Tactics only)
        TriadEngineV1.Result memory res = TriadEngineV1.resolve(nyano, t);

        submitted[matchId_] = true;
        settlements[matchId_] = Settlement({
            winner: res.winner,
            tilesA: res.tilesA,
            tilesB: res.tilesB,
            tieScoreA: res.tieScoreA,
            tieScoreB: res.tieScoreB
        });

        emit MatchSubmitted(matchId_, t.rulesetId, msg.sender, t.playerA, t.playerB);
        emit MatchSettled(matchId_, t.rulesetId, res.winner, res.tilesA, res.tilesB);
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
