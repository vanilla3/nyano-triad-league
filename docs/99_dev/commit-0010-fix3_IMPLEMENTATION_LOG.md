# commit-0010-fix3 (Yul stack / memoryguard) — Implementation Log（差分）

## Why
- `via_ir=true` にしても Yul 最適化段階で `too deep in the stack` が発生し、コンパイルが止まった。
- 原因は `TriadEngineV1.resolve` のローカル配列/変数が多く、IR でもスタック割り当てに失敗していたこと。
- 併せて、IRパイプラインでは inline assembly に memory-safe 注釈が無いと最適化が制限される可能性がある。

## What
- `TriadEngineV1.sol` をリファクタ：
  - デッキ属性の事前ロード（多数の配列）をやめ、カード使用時にオンデマンドで読む
  - 盤面状態を `Cell[9]` 1本に集約（owner/up/right/left/down/hand/power）
  - used管理は bool配列を廃止して 5-bit マスクに変更
- `ECDSA.sol` の assembly を `assembly ("memory-safe")` に変更（IR最適化に優しい形）
- `foundry.toml` は `via_ir=false` に戻し、legacy codegen で通す方針に変更
  - もし再び stack で落ちる場合は `via_ir=true` に戻してOK

## Verify
- `cd contracts && forge test`
