// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/INyanoPeace.sol";

/// @notice Permissionless ruleset registry.
/// @dev v1: simple allow-list (balance-gated) to avoid obvious spam; upgrade later with staking/voting.
///
/// IMPORTANT:
/// - A ruleset MUST declare which on-chain settlement engine it targets (engineId).
/// - This prevents "submitMatchV1 with v2 ruleset" style mismatches that would otherwise let
///   a third party settle a signed match with the wrong engine.
contract RulesetRegistry {
    struct RulesetInfo {
        address proposer;
        uint64 createdAt;
        bool active;
        bytes32 configHash; // optional: hash of canonical ruleset bytes (off-chain)
        uint8 engineId;     // 1=TriadEngineV1 (core+tactics), 2=TriadEngineV2 (core+tactics+shadow), ...
        string uri;         // optional: IPFS/HTTPS with human-readable spec
    }

    INyanoPeace public immutable nyano;
    mapping(bytes32 => RulesetInfo) public rulesets;

    event RulesetRegistered(bytes32 indexed rulesetId, address indexed proposer, bytes32 configHash, uint8 engineId, string uri);
    event RulesetStatusChanged(bytes32 indexed rulesetId, bool active);

    constructor(address nyano_) {
        require(nyano_ != address(0), "nyano=0");
        nyano = INyanoPeace(nyano_);
    }

    function register(bytes32 rulesetId, bytes32 configHash, uint8 engineId, string calldata uri) external {
        require(rulesetId != bytes32(0), "rulesetId=0");
        require(engineId != 0, "engineId=0");
        require(rulesets[rulesetId].proposer == address(0), "already registered");

        // Balance-gated: proposer must hold at least 1 Nyano.
        require(nyano.balanceOf(msg.sender) > 0, "not a holder");

        rulesets[rulesetId] = RulesetInfo({
            proposer: msg.sender,
            createdAt: uint64(block.timestamp),
            active: true,
            configHash: configHash,
            engineId: engineId,
            uri: uri
        });

        emit RulesetRegistered(rulesetId, msg.sender, configHash, engineId, uri);
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

    function engineOf(bytes32 rulesetId) external view returns (uint8) {
        return rulesets[rulesetId].engineId;
    }
}
