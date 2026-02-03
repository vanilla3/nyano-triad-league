# commit-0012 TODO update（差分）

## Done（commit-0012）
- Core+tactics の **TS参照実装とオンチェーン settlement の挙動差**を解消
  - Triad同値かつ じゃんけん同値（同ハンド）の場合：**反転しない**（power tie-break を廃止）
- オンチェーン互換のルール設定を TS 側に明示
  - `ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1` を追加
- “共有テストベクタ” の導入
  - JSON（正）: `test-vectors/core_tactics_v1.json`
  - TSテスト: `packages/triad-engine/test/core_tactics_vectors.test.js`
  - Solidityテスト（生成物）: `contracts/test/generated/CoreTacticsVectorsV1Test.sol`
  - 生成スクリプト: `scripts/generate_core_tactics_vectors_v1.mjs`
- テストベクタ運用ドキュメントを追加
  - `docs/02_protocol/Nyano_Triad_League_TEST_VECTORS_v1_ja.md`

## Next（commit-0013）
- テストベクタを拡充
  - combo（momentum / domination / fever）を最低1ケースずつ追加
  - “負け側勝利” / “ドロー” のケースも追加
- Synergy を段階導入（オンチェーン側は v2 として分離する想定）
  - まずは **Earth / Shadow** など、影響範囲が狭いものから
- UI/バックエンド側の “オンチェーン互換モード” を明示（ルール差が出ないように）
