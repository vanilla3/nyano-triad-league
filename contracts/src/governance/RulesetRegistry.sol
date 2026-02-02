// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/INyanoPeace.sol";

/// @notice Permissionless ruleset registry.
/// @dev v1: simple allow-list (balance-gated) to avoid obvious spam; upgrade later with staking/voting.
contract RulesetRegistry {
    struct RulesetInfo {
        address proposer;
        uint64 createdAt;
        bool active;
        bytes32 configHash; // optional: hash of canonical ruleset bytes (off-chain)
        string uri; // optional: IPFS/HTTPS with human-readable spec
    }

    INyanoPeace public immutable nyano;
    mapping(bytes32 => RulesetInfo) public rulesets;

    event RulesetRegistered(bytes32 indexed rulesetId, address indexed proposer, bytes32 configHash, string uri);
    event RulesetStatusChanged(bytes32 indexed rulesetId, bool active);

    constructor(address nyano_) {
        require(nyano_ != address(0), "nyano=0");
        nyano = INyanoPeace(nyano_);
    }

    function register(bytes32 rulesetId, bytes32 configHash, string calldata uri) external {
        require(rulesetId != bytes32(0), "rulesetId=0");
        require(rulesets[rulesetId].proposer == address(0), "already registered");

        // Balance-gated: proposer must hold at least 1 Nyano.
        require(nyano.balanceOf(msg.sender) > 0, "not a holder");

        rulesets[rulesetId] = RulesetInfo({
            proposer: msg.sender,
            createdAt: uint64(block.timestamp),
            active: true,
            configHash: configHash,
            uri: uri
        });

        emit RulesetRegistered(rulesetId, msg.sender, configHash, uri);
    }

    function setActive(bytes32 rulesetId, bool active) external {
        RulesetInfo storage info = rulesets[rulesetId];
        require(info.proposer != address(0), "unknown ruleset");
        require(msg.sender == info.proposer, "only proposer");
        info.active = active;
        emit RulesetStatusChanged(rulesetId, active);
    }

    function isActive(bytes32 rulesetId) external view returns (bool) {
        return rulesets[rulesetId].active;
    }
}
