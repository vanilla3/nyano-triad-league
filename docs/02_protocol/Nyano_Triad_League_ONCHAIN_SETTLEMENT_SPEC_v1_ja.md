# Nyano Triad League — オンチェーン決済仕様（v1 / Draft）

この文書は、**Ethereum 上のみ**で公式戦を「検証可能」にするための仕様です。  
中核は **トランスクリプト（TranscriptV1）** と、確定した結果を残す **League コントラクト**です。

## ゴール
- 公式戦は **1 tx** で「提出・検証・確定」できる
- “運営が消えても”第三者が検証できるよう、**トランスクリプト**と**イベントログ**を中核にする
- 所有権は **Nyano Peace の ownerOf** が真実（ブリッジ/外部アテステーション不要）

## コンポーネント
- `TranscriptV1`
  - matchId と EIP-712 署名の対象
  - 9手ぶんの moves / warningMarks / earthBoostEdges を packed bytes で保持
- `NyanoTriadLeague`
  - EIP-712 署名検証（playerA, playerB の両者署名）
  - ownerOf によるデッキ所有権チェック
  - replay（二重提出）防止
  - ルールの有効性チェック（RulesetRegistry が設定されている場合）
  - オンチェーン決済エンジンで勝敗計算し結果を保存

## 決済エンジン（段階導入）
- **Engine v1**: `TriadEngineV1`
  - Core + Tactics（警戒マーク、コンボ、じゃんけん）
  - Earth boost は未対応（全turnで NONE=255 必須）
- **Engine v2**: `TriadEngineV2`
  - v1 に加えて **Shadow が警戒マークのデバフを無視**（最小の Synergy 導入）
  - それ以外の Synergy/Formation/Season は引き続き未対応

## 重要：rulesetId と engineId の整合
- `RulesetRegistry` は rulesetId ごとに `engineId` を保持する
- `NyanoTriadLeague` は `submitMatchV1/V2` の入り口ごとに、
  `rulesetRegistry.engineOf(rulesetId)` が **期待する engineId と一致**することを要求する
- これにより「署名された試合を、別のエンジンで勝手に決済する」攻撃を防ぐ

## イベント（概要）
- `MatchSubmitted(matchId, rulesetId, submitter, playerA, playerB)`
- `MatchSettled(matchId, rulesetId, winner, tilesA, tilesB)`


## 提出入口（推奨）
- `submitMatch`：RulesetRegistry の engineId を参照して自動で v1/v2 を選択する。
- `submitMatchV1/V2`：明示したい場合の入口（engine mismatch は revert）。
