# commit-0012-fix1 — Implementation Log（差分）

## Why
- `pnpm test` で formation unit test が失敗：Earth trait が有効なとき `earthBoostEdge` が必須のため。
- `forge test` で generated solidity test がコンパイル失敗：Solidity 0.8.20 の address literal は EIP-55 チェックサムが必要。

## What
- triad-engine: formation unit test に Earth の `earthBoostEdge` を追加し、意図したテスト（formation scaling）を崩さずに通す。
- vectors generator: `ethers.getAddress()` で player addresses をチェックサム化して Solidity 生成に流し込む。
- generated solidity test: 既存の lower-case address literals をチェックサム表記に更新。

## Verify
- `cd packages/triad-engine && pnpm test`
- `cd contracts && forge test`
- `node scripts/generate_core_tactics_vectors_v1.mjs && git diff --exit-code`
