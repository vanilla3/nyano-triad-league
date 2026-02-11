// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/governance/RulesetRegistry.sol";
import "./MockNyanoPeace.sol";

contract RulesetRegistryCaller {
    function register(
        RulesetRegistry registry,
        bytes32 rulesetId,
        bytes32 configHash,
        uint8 engineId,
        string calldata uri
    ) external {
        registry.register(rulesetId, configHash, engineId, uri);
    }

    function setActive(RulesetRegistry registry, bytes32 rulesetId, bool active) external {
        registry.setActive(rulesetId, active);
    }
}

contract RulesetRegistryTest {
    MockNyanoPeace private nyano;
    RulesetRegistry private registry;
    RulesetRegistryCaller private caller;

    bytes32 private constant RULESET_ID = bytes32(uint256(1));

    function setUp() public {
        nyano = new MockNyanoPeace();
        nyano.mintTo(address(this), 1); // holder-gate for this test contract

        registry = new RulesetRegistry(address(nyano));
        caller = new RulesetRegistryCaller();
    }

    function test_register_stores_ruleset_info() public {
        bytes32 configHash = keccak256("ruleset-v1");
        string memory uri = "ipfs://ruleset-v1";

        registry.register(RULESET_ID, configHash, 2, uri);

        (address proposer, uint64 createdAt, bool active, bytes32 storedConfigHash, uint8 engineId, string memory storedUri) =
            registry.rulesets(RULESET_ID);

        require(proposer == address(this), "proposer mismatch");
        require(createdAt > 0, "createdAt=0");
        require(active, "active should be true");
        require(storedConfigHash == configHash, "configHash mismatch");
        require(engineId == 2, "engineId mismatch");
        require(keccak256(bytes(storedUri)) == keccak256(bytes(uri)), "uri mismatch");
    }

    function test_register_reverts_when_not_holder() public {
        bool ok;
        try caller.register(registry, bytes32(uint256(2)), bytes32(0), 1, "ipfs://ruleset-non-holder") {
            ok = true;
        } catch {
            ok = false;
        }
        require(!ok, "expected revert");
    }

    function test_register_reverts_on_engine_zero() public {
        bool ok;
        try registry.register(bytes32(uint256(3)), bytes32(0), 0, "ipfs://ruleset-bad-engine") {
            ok = true;
        } catch {
            ok = false;
        }
        require(!ok, "expected revert");
    }

    function test_register_reverts_on_duplicate_ruleset_id() public {
        registry.register(RULESET_ID, bytes32(0), 1, "ipfs://ruleset-v1");

        bool ok;
        try registry.register(RULESET_ID, bytes32(0), 1, "ipfs://ruleset-v1-dup") {
            ok = true;
        } catch {
            ok = false;
        }
        require(!ok, "expected revert");
    }

    function test_setActive_reverts_when_not_proposer() public {
        registry.register(RULESET_ID, bytes32(0), 1, "ipfs://ruleset-v1");

        bool ok;
        try caller.setActive(registry, RULESET_ID, false) {
            ok = true;
        } catch {
            ok = false;
        }
        require(!ok, "expected revert");
    }

    function test_setActive_allows_proposer_toggle() public {
        registry.register(RULESET_ID, bytes32(0), 1, "ipfs://ruleset-v1");

        registry.setActive(RULESET_ID, false);
        require(!registry.isActive(RULESET_ID), "should be inactive");

        registry.setActive(RULESET_ID, true);
        require(registry.isActive(RULESET_ID), "should be active");
    }
}
