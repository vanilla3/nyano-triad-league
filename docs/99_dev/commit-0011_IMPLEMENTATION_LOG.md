# commit-0011 Implementation Log（差分）

## Why
- `forge test` は成功しているが、NatSpec/コンパイラ警告（mutability）を放置すると将来のCI品質ゲートでノイズになる。
- CIで contracts の `forge test` を回し、オンチェーン側の健全性を自動で担保する。

## What
- `TranscriptV1Test.sol` の state mutability を適切に制限（pure/view）し、警告を解消。
- GitHub Actions CI に `contracts` job を追加し `forge test` を実行。

## Verify
- ローカル: `cd contracts && forge test`
- CI: GitHub Actions が triad-engine + contracts の両方を緑にする
