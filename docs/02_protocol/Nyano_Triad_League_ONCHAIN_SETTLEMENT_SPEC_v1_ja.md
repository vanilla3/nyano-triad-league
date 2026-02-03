# Nyano Triad League — オンチェーン決済仕様（v1 / Draft）

この文書は、**Ethereum 上のみ**で公式戦を「検証可能」にするための仕様です。  
commit-0010 時点で、公式戦提出は **署名検証 + ownerOf 検証 + 二重提出防止 + Core+Tactics の勝敗確定**まで到達しています。

> Synergy（Trait）/ Formation / Season modules は、まだオンチェーン決済ではサポートしていません。

## ゴール
- 公式戦は **1 tx** で「提出・検証・確定」できる方向に寄せる
- “運営が消えても”第三者が検証できるよう、**トランスクリプト**と**イベントログ**を中核にする
- 所有権は **Nyano Peace の ownerOf** が真実（外部アテステーション不要）

## 現状のサポート範囲（commit-0010）
- ✅ Core：Triad比較 / じゃんけん / 連鎖（コンボ）
- ✅ Tactics：警戒マーク（-1 debuff / 1ターン / 最大3回）、コンボボーナス（+1/+2/fever）
- ❌ Synergy：Trait効果、Earth選択など（earthBoostEdges は NONE である必要）
- ❌ Formation：編成ボーナス
- ❌ Season：ルールモジュールの動的適用（rulesetId は参照用に保持）

---

## コントラクト
- `NyanoTriadLeague.sol`
  - `submitMatchV1(transcript, sigA, sigB)`
  - 検証：
    - EIP-712署名（playerA / playerB）
    - `deadline` 期限
    - `ownerOf(tokenId)` によるデッキ所有確認
    - `matchId` による二重提出防止
    - （任意）RulesetRegistry による active ruleset のみ受付
  - 確定：
    - TriadEngineV1 で勝敗確定（winner, tilesA/B, tieScores）
    - `settlements[matchId]` に保存

- `TriadEngineV1.sol`
  - Core+Tactics の決定論エンジン（Synergy/Formationは未対応）

- `TranscriptV1.sol`
  - `matchId(transcript)`：EIP-712 domain を含まない “ID”
  - `structHash(transcript)`：EIP-712署名検証用

---

## イベント（インデクサ前提）
- `MatchSubmitted(matchId, rulesetId, submitter, playerA, playerB)`
- `MatchSettled(matchId, rulesetId, winner, tilesA, tilesB)`

---

## 次ステップ（commit-0011 以降）
1. オンチェーンに Synergy を段階導入（まずは Earth / Shadow / Forest のような “決定論で説明しやすい”もの）
2. ruleset canonical bytes の on-chain decode（または registry からの参照）で、ルールごとに param を読める形にする
3. Tournament / LeagueFactory に拡張し、運営なしでも大会が増殖する導線を作る
