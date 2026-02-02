# commit-0009 Implementation Log（差分）

## Why
- コミュニティが勝手に盛り上がるためには「公式戦」が **運営サーバ不要**で検証できる必要がある。
- その第一歩として、勝敗計算より先に「トランスクリプト真正性（署名）」「所有権（ownerOf）」「二重提出防止」を固める。

## What
- Foundry scaffold を追加（contracts/）
- TranscriptV1：matchId / EIP-712 structHash / validate
- NyanoTriadLeague：submitMatchV1（署名検証＋ownerOf検証＋replay protection）
- RulesetRegistry：balance-gated の permissionless registry（v1）
- NyanoStaking：NFTステーキング最小実装（将来の投票重みに接続）
- プロトコル仕様書を追加（on-chain settlement / ruleset registry / governance primitives）

## Verify
- `cd contracts && forge test`
- `submitMatchV1` の入力生成は TS 側の transcript 実装と整合させる（次コミットでテストベクタを用意）
