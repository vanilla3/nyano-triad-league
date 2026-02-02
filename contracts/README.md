# Contracts (ETH-only)

This folder contains the on-chain components for *official* match verification on Ethereum.

## Current status (commit-0009)
- Transcript hashing + EIP-712 signature verification
- Ownership verification via Nyano Peace `ownerOf`
- Replay protection (matchId)
- Ruleset registry (v1) + NFT staking (v1, no rewards)

> Winner calculation (TriadEngine) is NOT implemented yet. This commit is about correctness primitives.

## Setup
Install Foundry: https://book.getfoundry.sh/

```bash
cd contracts
forge test
```

## Files
- `src/lib/TranscriptV1.sol` : transcript validation + matchId + EIP-712 struct hash
- `src/NyanoTriadLeague.sol` : submitMatchV1 (verify + record)
- `src/governance/RulesetRegistry.sol` : permissionless registry (balance-gated v1)
- `src/governance/NyanoStaking.sol` : minimal ERC721 staking vault (no rewards)
