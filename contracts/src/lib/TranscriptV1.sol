// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Transcript (match data) v1 used for matchId and signature verification.
/// @dev IMPORTANT: This struct is intended to match the off-chain reference implementation.
library TranscriptV1 {
    // Sentinel for "not used" optional fields in packed arrays.
    uint8 internal constant NONE_U8 = 255;

    /// @notice Battle transcript v1.
    /// @dev Arrays for optional-per-turn choices are packed as bytes of length 9 (one per turn).
    struct Data {
        uint8 version; // must be 1
        uint64 seasonId;
        bytes32 rulesetId;

        address playerA;
        address playerB;

        uint256[5] deckA;
        uint256[5] deckB;

        bytes moves; // length 9, each byte encodes (cellIndex 0..8, cardIndex 0..4)
        bytes warningMarks; // length 9, each byte 0..8 or 255
        bytes earthBoostEdges; // length 9, each byte 0..3 or 255

        bytes32 reserved; // future extension slot (keep in hash!)
        uint64 deadline; // unix seconds; signature validity
    }

    bytes32 internal constant TYPEHASH = keccak256(
        "TranscriptV1(uint8 version,uint64 seasonId,bytes32 rulesetId,address playerA,address playerB,bytes32 deckAHash,bytes32 deckBHash,bytes32 movesHash,bytes32 warningMarksHash,bytes32 earthBoostEdgesHash,bytes32 reserved,uint64 deadline)"
    );

    function _hashDeck(uint256[5] memory deck) private pure returns (bytes32) {
        return keccak256(abi.encode(deck));
    }

    function _hashBytes(bytes memory b) private pure returns (bytes32) {
        return keccak256(b);
    }

    /// @notice matchId for uniqueness (does not include EIP-712 domain).
    function matchId(Data memory t) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                t.version,
                t.seasonId,
                t.rulesetId,
                t.playerA,
                t.playerB,
                t.deckA,
                t.deckB,
                t.moves,
                t.warningMarks,
                t.earthBoostEdges,
                t.reserved,
                t.deadline
            )
        );
    }

    /// @notice EIP-712 struct hash for signature verification.
    function structHash(Data memory t) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                TYPEHASH,
                t.version,
                t.seasonId,
                t.rulesetId,
                t.playerA,
                t.playerB,
                _hashDeck(t.deckA),
                _hashDeck(t.deckB),
                _hashBytes(t.moves),
                _hashBytes(t.warningMarks),
                _hashBytes(t.earthBoostEdges),
                t.reserved,
                t.deadline
            )
        );
    }

    /// @notice Basic sanity checks to avoid ambiguous or malformed transcripts.
    function validate(Data memory t) internal pure {
        require(t.version == 1, "Transcript: bad version");
        require(t.playerA != address(0) && t.playerB != address(0), "Transcript: zero player");
        require(t.playerA != t.playerB, "Transcript: same player");
        require(t.moves.length == 9, "Transcript: moves len");
        require(t.warningMarks.length == 9, "Transcript: warning len");
        require(t.earthBoostEdges.length == 9, "Transcript: earth len");
    }
}
