// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/interfaces/INyanoPeace.sol";

/// @notice Minimal mock of Nyano Peace for testing.
contract MockNyanoPeace is INyanoPeace {
    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _balanceOf;

    mapping(uint256 => uint8) private _hand;
    mapping(uint256 => uint8[3]) private _trait; // classId, seasonId, rarity
    mapping(uint256 => uint8[4]) private _triad; // up,right,left,down
    mapping(uint256 => uint16[6]) private _combat; // hp,atk,matk,def,mdef,agi

    function mintTo(address to, uint256 tokenId) external {
        require(_ownerOf[tokenId] == address(0), "exists");
        _ownerOf[tokenId] = to;
        _balanceOf[to] += 1;
    }

    function setJankenHand(uint256 tokenId, uint8 hand_) external {
        _hand[tokenId] = hand_;
    }

    function setTrait(uint256 tokenId, uint8 classId, uint8 seasonId, uint8 rarity) external {
        _trait[tokenId] = [classId, seasonId, rarity];
    }

    function setTriad(uint256 tokenId, uint8 up, uint8 right, uint8 left, uint8 down) external {
        _triad[tokenId] = [up, right, left, down];
    }

    function setCombatStats(uint256 tokenId, uint16 hp, uint16 atk, uint16 matk, uint16 def, uint16 mdef, uint16 agi) external {
        _combat[tokenId] = [hp, atk, matk, def, mdef, agi];
    }

    // ---- INyanoPeace ----

    function ownerOf(uint256 tokenId) external view returns (address) {
        address o = _ownerOf[tokenId];
        require(o != address(0), "nonexistent");
        return o;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _balanceOf[owner];
    }

    function getJankenHand(uint256 tokenId) external view returns (uint8) {
        return _hand[tokenId];
    }

    function getTrait(uint256 tokenId) external view returns (uint8 classId, uint8 seasonId, uint8 rarity) {
        uint8[3] memory t = _trait[tokenId];
        return (t[0], t[1], t[2]);
    }

    function getCombatStats(uint256 tokenId)
        external
        view
        returns (uint16 hp, uint16 atk, uint16 matk, uint16 def, uint16 mdef, uint16 agi)
    {
        uint16[6] memory c = _combat[tokenId];
        return (c[0], c[1], c[2], c[3], c[4], c[5]);
    }

    function getTriad(uint256 tokenId) external view returns (uint8 up, uint8 right, uint8 left, uint8 down) {
        uint8[4] memory t = _triad[tokenId];
        return (t[0], t[1], t[2], t[3]);
    }

    // ---- ERC721-ish transfer for staking tests ----
    function transferFrom(address from, address to, uint256 tokenId) external {
        require(_ownerOf[tokenId] == from, "not owner");
        _ownerOf[tokenId] = to;
        _balanceOf[from] -= 1;
        _balanceOf[to] += 1;
    }
}
