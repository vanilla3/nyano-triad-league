# commit-0010-fix1 (NatSpec) — Implementation Log（差分）

## Why
- `forge test` のコンパイルで NatSpec の `@return` 形式に起因するエラーが発生していたため。
- Solidity 0.8.20 のドキュメンテーション解析は、`@return` タグに戻り値名が含まれることを要求する。

## What
- `contracts/src/interfaces/INyanoPeace.sol` の NatSpec を修正
  - `getCombatStats` / `getTriad` の `@return` を戻り値ごとに分割し、パラメータ名を明記

## Verify
- `cd contracts && forge test`
