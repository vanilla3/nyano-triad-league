// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/INyanoPeace.sol";
import "./lib/ECDSA.sol";
import "./lib/EIP712Domain.sol";
import "./lib/TranscriptV1.sol";

/// @notice ETH-only official match submission contract (v1 skeleton).
/// @dev This commit focuses on *transcript verification* (hashing, signatures, ownership checks, replay protection).
///      Match resolution (winner calculation) will be implemented in a later commit once we lock the on-chain engine.
contract NyanoTriadLeague is EIP712Domain {
    using ECDSA for bytes32;

    INyanoPeace public immutable nyano;

    // replay protection
    mapping(bytes32 => bool) public submitted;

    event MatchSubmitted(
        bytes32 indexed matchId,
        bytes32 indexed rulesetId,
        address indexed submitter,
        address playerA,
        address playerB
    );

    string private constant _NAME = "Nyano Triad League";
    string private constant _VERSION = "1";

    constructor(address nyano_) EIP712Domain(_NAME, _VERSION) {
        require(nyano_ != address(0), "nyano=0");
        nyano = INyanoPeace(nyano_);
    }

    function _name() internal pure override returns (string memory) { return _NAME; }
    function _version() internal pure override returns (string memory) { return _VERSION; }

    /// @notice Submit an official match transcript (verifies signatures + ownership at submit time).
    /// @dev v1 skeleton: stores matchId to prevent replays and emits an event. Settlement (winner) is TODO.
    function submitMatchV1(TranscriptV1.Data calldata t, bytes calldata sigA, bytes calldata sigB) external {
        TranscriptV1.validate(t);
        require(block.timestamp <= t.deadline, "expired");

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

        submitted[matchId_] = true;
        emit MatchSubmitted(matchId_, t.rulesetId, msg.sender, t.playerA, t.playerB);
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
