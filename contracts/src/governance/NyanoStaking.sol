// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/INyanoPeace.sol";

/// @notice Simple ERC-721 staking vault (escrow) for governance/voting primitives.
/// @dev v1: minimal stake/unstake and 'stakedBalance' view. No rewards.
contract NyanoStaking {
    INyanoPeace public immutable nyano;

    mapping(uint256 => address) public stakerOf;
    mapping(address => uint256) public stakedBalance;

    event Staked(address indexed staker, uint256 indexed tokenId);
    event Unstaked(address indexed staker, uint256 indexed tokenId);

    constructor(address nyano_) {
        require(nyano_ != address(0), "nyano=0");
        nyano = INyanoPeace(nyano_);
    }

    function stake(uint256 tokenId) external {
        require(stakerOf[tokenId] == address(0), "already staked");
        require(nyano.ownerOf(tokenId) == msg.sender, "not owner");

        // Transfer token into escrow. Requires prior approval.
        // We call transferFrom via the ERC721 interface. Nyano Peace supports ERC721.
        // solhint-disable-next-line avoid-low-level-calls
        (bool ok, ) = address(nyano).call(abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), tokenId));
        require(ok, "transferFrom failed");

        stakerOf[tokenId] = msg.sender;
        stakedBalance[msg.sender] += 1;

        emit Staked(msg.sender, tokenId);
    }

    function unstake(uint256 tokenId) external {
        address staker = stakerOf[tokenId];
        require(staker == msg.sender, "not staker");

        stakerOf[tokenId] = address(0);
        stakedBalance[msg.sender] -= 1;

        // Return token to staker.
        // solhint-disable-next-line avoid-low-level-calls
        (bool ok, ) = address(nyano).call(abi.encodeWithSignature("transferFrom(address,address,uint256)", address(this), msg.sender, tokenId));
        require(ok, "transferFrom back failed");

        emit Unstaked(msg.sender, tokenId);
    }
}
