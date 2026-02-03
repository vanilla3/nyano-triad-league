// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRulesetRegistry {
    function isActive(bytes32 rulesetId) external view returns (bool);
}
