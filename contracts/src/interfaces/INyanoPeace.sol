// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal read-only interface for Nyano Peace (BlueAtelierNFT).
/// @dev Function signatures are taken from the verified source on Etherscan.
interface INyanoPeace {
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);

    /// @dev Value mapping: 0=Rock, 1=Paper, 2=Scissors
    function getJankenHand(uint256 tokenId) external view returns (uint8);

    /// @return classId 1..5, seasonId 1..4, rarity 1..5
    function getTrait(uint256 tokenId) external view returns (uint8 classId, uint8 seasonId, uint8 rarity);

    /// @return hp/atk/matk/def/mdef/agi each 1..1000 in the original contract (struct fields are uint16)
    function getCombatStats(uint256 tokenId)
        external
        view
        returns (uint16 hp, uint16 atk, uint16 matk, uint16 def, uint16 mdef, uint16 agi);

    /// @return up/right/left/down each 1..10 in the original contract (struct fields are uint8)
    function getTriad(uint256 tokenId) external view returns (uint8 up, uint8 right, uint8 left, uint8 down);
}
