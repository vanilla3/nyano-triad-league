# commit-0010-fix4 (stack too deep -> via-ir) — Implementation Log（差分）

## Why
- legacy codegen（via_ir=false）で `TriadEngineV1.resolve` が `Stack too deep` になりコンパイルが止まる。
- 先の fix3 でローカル変数は減らしたが、legacy pipeline の制限にはまだ引っかかる。
- solc の推奨どおり、optimizer 有効の上で `via_ir=true` に戻して IR pipeline でコンパイルさせる。

## What
- `contracts/foundry.toml` の `via_ir` を `true` に変更

## Verify
- `cd contracts && forge test`
