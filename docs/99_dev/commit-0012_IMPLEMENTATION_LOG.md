# commit-0012 IMPLEMENTATION LOG

## 目的
- TS参照実装（triad-engine）と Solidity settlement（TriadEngineV1）を **テストベクタで同一化**する
- subtle な仕様差を “差分が出た時点で即検知” できる状態にする

## 変更点（要約）
### 1) On-chain engine の tie 挙動を TS に揃える
- `TriadEngineV1._wins` から power tie-break を削除
  - Triad同値 → じゃんけん
  - じゃんけん同値 → 反転しない

### 2) TS側にオンチェーン互換ルール設定を追加
- `ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1`
  - synergy（traitEffects/formationBonuses）無効
  - secondPlayerBalance 無効（オンチェーンは firstPlayer=playerA 固定）

### 3) 共有テストベクタの導入
- JSON を “正” として置き、TS/solidity の両方で検証
- Solidity 側は JSON からテストコードを生成し、Foundry で実行

## 追加ファイル
- `test-vectors/core_tactics_v1.json`
- `scripts/generate_core_tactics_vectors_v1.mjs`
- `contracts/test/generated/CoreTacticsVectorsV1Test.sol`（生成物）
- `packages/triad-engine/test/core_tactics_vectors.test.js`
- `docs/02_protocol/Nyano_Triad_League_TEST_VECTORS_v1_ja.md`

## 既存ファイル修正
- `contracts/src/lib/TriadEngineV1.sol`
- `docs/02_protocol/Nyano_Triad_League_ONCHAIN_ENGINE_CORE_SPEC_v1_ja.md`
- `packages/triad-engine/src/engine.ts`

## 留意点
- 今回のベクタは “Core+tactics の互換性” を最優先にしているため、Synergy 系のケースは次コミット以降で追加する。
