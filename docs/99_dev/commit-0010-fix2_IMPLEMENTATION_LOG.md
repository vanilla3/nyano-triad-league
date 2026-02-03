# commit-0010-fix2 (stack too deep) — Implementation Log（差分）

## Why
- `TriadEngineV1.resolve` がローカル変数/一時値を多く使うため、Solidity の legacy codegen で `Stack too deep` が発生。
- solc エラーメッセージが示すとおり、optimizer 有効の上で `via-ir`（IRパイプライン）を使うのが最短で確実。

## What
- `contracts/foundry.toml` の `via_ir` を `true` に変更

## Verify
- `cd contracts && forge test`
