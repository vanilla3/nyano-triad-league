# commit-0031 — Implementation Log（差分）

## Why
- 現状は「参照ツール」中心で、ゲームとして遊ぶ導線が弱い。
- 運営品質へ寄せるには、Play の起点（Arena）と、遊びの準備（Decks）を先に固める必要がある。
- 同時に、仕様（どこまでが機能で、どこからがゲームか）を明文化し、実装順序をぶれさせない。

## What
### UI
- App ナビを “Play / Watch / Tools” に整理
- `/arena` を追加（ゲーム導線のハブ）
- `/decks` を追加（tokenId 5枚のデッキ管理、localStorage）

### Docs
- Game UI / Product Spec v1（Draft）を追加
- Game UI Implementation Plan v1 を追加

## Verify
- `pnpm -C apps/web dev`
- ナビから Arena / Decks に移動できる
- Decks で保存/編集/削除/インポート/エクスポートが動く
