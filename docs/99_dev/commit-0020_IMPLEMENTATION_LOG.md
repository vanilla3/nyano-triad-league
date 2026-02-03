# commit-0020 — Implementation Log（差分）

## Why
- オンチェーン settlement（`TriadEngineV1`）は Core + Tactics だけを対象にしており、Synergy を一気に持ち込むと
  - 既存ベクタの互換性が壊れる
  - 仕様差分が大きすぎて監査コストが跳ねる
- そこで **Synergy を “v2” として段階導入**し、まずは影響範囲が最小でベクタ化しやすい 1 点だけを追加する。

## What
- contracts
  - `contracts/src/lib/TriadEngineV2.sol` を追加
    - v1 と同じ Core + Tactics に **Shadow のみ**を追加（Shadow は警戒マーク -1 を無視）
    - 判定は `INyanoPeace.getTrait()`（rarity=3 & classId=5 ⇒ shadow）を参照
- test-vectors / tests
  - 新しい共有ベクタ：`test-vectors/core_tactics_shadow_v2.json`
    - v2 ベクタは token に `trait`（classId/seasonId/rarity）を持つ（オンチェーンが参照するため）
  - generator：`scripts/generate_core_tactics_shadow_v2.mjs`
  - Solidity 生成テスト：`contracts/test/generated/CoreTacticsShadowV2Test.sol`
  - TS 側の互換設定：`ONCHAIN_CORE_TACTICS_SHADOW_RULESET_CONFIG_V2`
  - TS 共有ベクタテスト：`packages/triad-engine/test/core_tactics_shadow_v2_vectors.test.js`

## Notes
- v2 はまだ “Synergy 全部” ではありません。
  - Cosmic / Light / Formation などは無効のまま（Shadow の警戒マーク無視だけ）
- 既存の on-chain subset 制約は維持します（`firstPlayer=0`、`earthBoostEdges=0xFF`）。

## Verify
- `pnpm -C packages/triad-engine test`
- `cd contracts && forge test`
