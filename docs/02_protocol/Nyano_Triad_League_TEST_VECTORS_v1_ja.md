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
