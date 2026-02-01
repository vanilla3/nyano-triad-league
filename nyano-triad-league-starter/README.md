# nyano-triad-league-starter

This folder contains:
- `docs/` — living specs (transcript, ruleset config, events, autonomy roadmap, TODO template)
- `packages/triad-engine/` — pure TypeScript reference engine for deterministic match simulation (Core rules v1)

## Quick start (engine)

```bash
cd packages/triad-engine
npm install
npm run build
npm test
```

> NOTE: `matchId` hashing is currently a placeholder (sha256 of JSON).  
> Replace with your canonical EIP-712 / abi-encode hashing and keep it in sync with Solidity.
