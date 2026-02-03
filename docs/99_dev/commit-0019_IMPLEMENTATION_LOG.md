# commit-0019 — Implementation Log（差分）

## Why
- `ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1`（on-chain settlement互換サブセット）は firstPlayer が playerA 固定という前提で成立する。
- TS側では `onchainSettlementCompat` により firstPlayer=0 を強制しているが、退行を防ぐには “不変条件テスト” が必要。

## What
- TS: firstPlayer=1 の transcript を on-chain subset に渡すと throw するテストを追加
  - `packages/triad-engine/test/first_player_invalid_onchain_subset.test.js`
- docs: ベクタ外の不変条件テストに firstPlayer 制約を追記

## Verify
- `pnpm -C packages/triad-engine test`
