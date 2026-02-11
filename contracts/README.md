# Contracts (ETH-only)

This folder contains the on-chain components for *official* match verification on Ethereum.

## Current status
- Transcript hashing + EIP-712 signature verification
- Ownership verification via Nyano Peace `ownerOf`
- Replay protection (`matchId`)
- Ruleset registry (v1, balance-gated) + NFT staking (v1, no rewards)
- On-chain settlement engines:
  - `TriadEngineV1` (Core + Tactics)
  - `TriadEngineV2` (Core + Tactics + Shadow ignores warning mark)
- League submit paths:
  - `submitMatch` (auto-routes by `rulesetRegistry.engineOf(rulesetId)`)
  - `submitMatchV1` / `submitMatchV2` (explicit engine)

## Setup
Install Foundry: https://book.getfoundry.sh/

```bash
cd contracts
forge test
```

## Files
- `src/lib/TranscriptV1.sol` : transcript validation + matchId + EIP-712 struct hash
- `src/NyanoTriadLeague.sol` : verify signatures, enforce ruleset engine, settle, and record result
- `src/lib/TriadEngineV1.sol` : on-chain settlement (Core + Tactics)
- `src/lib/TriadEngineV2.sol` : on-chain settlement (Core + Tactics + Shadow warning-mark ignore)
- `src/governance/RulesetRegistry.sol` : permissionless registry (balance-gated v1)
- `src/governance/NyanoStaking.sol` : minimal ERC721 staking vault (no rewards)
