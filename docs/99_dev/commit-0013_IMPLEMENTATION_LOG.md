# commit-0013 IMPLEMENTATION LOG

## 目的
- 共有テストベクタ（Core + Tactics）を拡充し、TS参照実装とオンチェーン settlement の一致をより強固にする
- CI でのベクタ生成・検証フローを安定させる（address checksum 問題を根絶）

## 変更点（要約）
### 1) ベクタ生成の address checksum 問題を根本解決
- Solidity 0.8.20 の **EIP-55 checksum 強制**により、`0xaaaaaaaa...` のようなアドレスリテラルがコンパイルエラーになる問題がありました。
- 生成スクリプト `generate_core_tactics_vectors_v1.mjs` を修正し、アドレスを以下の形式で埋め込むように変更：
  - `address(uint160(uint256(0x00...)))`
- これにより **JSONベクタ内の address を小文字のまま運用可能**で、かつ追加依存（ethers 等）も不要。

### 2) 共有テストベクタの拡充
`test-vectors/core_tactics_v1.json` に以下のケースを追加：
- `single_flip_gives_B_win`：Bが 1反転で 5-4 を作って勝つ
- `chain_flip_two_tiles`：チェーン反転（flipCount=2）を保証（BFSキュー動作の検証）
- `janken_breaks_edge_tie_flips`：Triad同値のとき、じゃんけん勝利で反転することを保証

### 3) Momentum（comboCount=3）ボーナスの挙動を TS で明示検証
- `packages/triad-engine/test/combo_bonus_momentum.test.js` を追加
- `chain_flip_two_tiles` を入力に、以下を確認：
  - turn=4 で `comboEffect === "momentum"` が発火
  - 次の A の手（turn=6）で `appliedBonus.triadPlus === 1`

### 4) 生成物の更新
- `contracts/test/generated/CoreTacticsVectorsV1Test.sol` を再生成し、ケース追加 + address 形式の更新を反映

## 追加/更新ファイル
- 更新：
  - `test-vectors/core_tactics_v1.json`
  - `scripts/generate_core_tactics_vectors_v1.mjs`
  - `contracts/test/generated/CoreTacticsVectorsV1Test.sol`（生成物）
  - `docs/02_protocol/Nyano_Triad_League_TEST_VECTORS_v1_ja.md`
- 追加：
  - `packages/triad-engine/test/combo_bonus_momentum.test.js`
  - `docs/99_dev/commit-0013_IMPLEMENTATION_LOG.md`
  - `docs/99_dev/commit-0013_TODO_update.md`

## 留意点
- 3x3/9ターン固定のため、現行ルールでは tiles が同数にならず “完全な引き分け” は発生しません。
- Domination/Fever（comboCount=4/5）については次コミットでベクタ/テストを拡張予定。
