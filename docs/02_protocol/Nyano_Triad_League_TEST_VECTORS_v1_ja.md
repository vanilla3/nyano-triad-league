# Nyano Triad League — Test Vectors（v1）

本ドキュメントは **TS参照実装（packages/triad-engine）** と **オンチェーン settlement engine（contracts/src/lib/TriadEngineV1.sol）** を
“同一ルール” として維持するための **共有テストベクタ** の運用手順です。

## 目的
- 仕様のズレ（例：tie-break の順序差、警戒マークの適用タイミング差）を **自動で検出**する
- 「どの入力で、どういう結果になるべきか」を **外部レビューしやすい形（JSON）** で公開する

## 対象ルールセット
現行のオンチェーン settlement は **Core + Tactics** のみ対応です。  
TS側の互換設定は以下を使用します：

- `ONCHAIN_CORE_TACTICS_RULESET_CONFIG_V1`

## ファイル構成
- 共有ベクタ（正）：`test-vectors/core_tactics_v1.json`
- Solidity テスト（生成物）：`contracts/test/generated/CoreTacticsVectorsV1Test.sol`
- 生成スクリプト：`scripts/generate_core_tactics_vectors_v1.mjs`
- TSテスト：`packages/triad-engine/test/core_tactics_vectors.test.js`

## 現在のケース一覧（Core + Tactics）
- `ties_do_not_flip_even_if_power_diff`
  - Triad が同値 & じゃんけんも同値 → **反転しない**（power は tie-break に使わない）
- `warning_mark_prevents_flip_no_other_flips`
  - 警戒マーク（-1 デバフ）により、反転が 1 回防がれる
- `single_flip_edge_advantage`
  - Triad edge の単純な大小で 1 回だけ反転する
- `single_flip_gives_B_win`
  - **B が 1 反転で 5-4 を作り勝利**（A 先手でも勝てるパターンを保証）
- `chain_flip_two_tiles`
  - 反転したカードがさらに反転を連鎖させる **チェーン反転（flipCount=2）** を保証  
  - 併せて comboCount=3（Momentum）の発火が再現される（※ bonus の効果そのものは別テストで検証）
- `janken_breaks_edge_tie_flips`
  - Triad が同値のとき、じゃんけんで勝てば **反転する**（Rock/Paper/Scissors の順序）
- `domination_flips_three_next_bonus_plus2`
  - 1手で 3 反転（comboCount=4）→ **Domination** が発火し、次のカードに `triadPlus=+2` が付与される
- `fever_flips_four_final_turn`
  - 1手で 4 反転（comboCount=5）→ **Fever** が発火する（3x3/9手では最終手で起こりやすく、次手ボーナスは将来拡張用）

## ベクタ形式（JSON）
各 `case` は次を含みます：

- `transcript.movesHex`：9 bytes（各ターン 1 byte）
  - 上位4bit：cellIndex（0..8）
  - 下位4bit：cardIndex（0..4）
- `transcript.warningMarksHex`：9 bytes（0..8 または 255）
- `transcript.earthBoostEdgesHex`：9 bytes（オンチェーン互換は常に 255）
- `tokens`：tokenId → triad / hand / power
  - `triad` は `{up,right,left,down}`
  - `hand` は 0=Rock,1=Paper,2=Scissors
  - `power` は `combatStatSum`（オンチェーンでは `atk+matk+agi` として解釈）

## 更新フロー
1. `test-vectors/core_tactics_v1.json` に case を追加 or 修正
2. 生成スクリプトを実行して Solidity テストを更新
   ```bash
   node scripts/generate_core_tactics_vectors_v1.mjs
   ```
3. テスト実行
   ```bash
   cd contracts && forge test
   cd ../packages/triad-engine && pnpm test
   ```
4. 生成物の差分（`git diff`）を確認してコミット

## 注意点
- オンチェーン互換（Core + Tactics）では、**“Triad が同値かつ じゃんけんも同値” の場合は反転しません。**
- `earthBoostEdges` は v1 では未対応のため、必ず `255` にしてください。
- 3x3 / 9ターン固定のため、現行ルールでは **完全な引き分け（tilesA==tilesB）は発生しません**（将来拡張時は別途扱います）。

## Solidity 0.8.20 の address checksum について
Solidity 0.8.20 以降では、`0xaaaaaaaa...` のような 20-byte hex literal を address として扱うとき、
EIP-55 checksum を要求してコンパイルエラーになります。

このリポジトリでは **生成スクリプト側で数値リテラルとして埋め込み → cast** することで回避しています：

- `0xaaaaaaaa...` → `address(uint160(uint256(0x00aaaaaaaa...)))`

これにより、JSONベクタ内の `playerA/playerB` は小文字のままでも運用できます。

## ベクタ外の不変条件テスト
共有ベクタは「正常系（settlement が成立する入力）」に寄せています。  
一方で、**上限超過・形式違反など “revert/throw を期待する系”** はベクタに混ぜると運用が煩雑になるため、別テストとして保持します。

- 警戒マーク使用回数上限（各プレイヤー最大3回）
  - TS: `packages/triad-engine/test/warning_mark_limit.test.js`
  - Solidity: `contracts/test/WarningMarkLimitTest.sol`

