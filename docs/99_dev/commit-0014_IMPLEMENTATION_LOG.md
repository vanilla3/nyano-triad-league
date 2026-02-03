# commit-0014 — Implementation Log

## Why
- Core+tactics の共有ベクタは Momentum までしか “ボーナス系” を直接カバーしていなかった。
- Domination（triadPlus +2）/ Fever（comboCount=5）の発火条件をベクタ化し、TS参照実装とオンチェーン settlement のズレを早期検出したい。

## What
- `test-vectors/core_tactics_v1.json` に 2ケース追加
  - `domination_flips_three_next_bonus_plus2`
  - `fever_flips_four_final_turn`
- `scripts/generate_core_tactics_vectors_v1.mjs` を実行し、Solidity 生成テストを更新
  - `contracts/test/generated/CoreTacticsVectorsV1Test.sol`
- triad-engine に “combo効果そのもの” を直接検証する unit test を追加
  - `combo_bonus_domination.test.js`
  - `combo_bonus_fever.test.js`
- 運用ドキュメント `Nyano_Triad_League_TEST_VECTORS_v1_ja.md` のケース一覧を更新

## Verify
- `node scripts/generate_core_tactics_vectors_v1.mjs && git diff --exit-code`
- `pnpm -C packages/triad-engine test`
- `cd contracts && forge test`
