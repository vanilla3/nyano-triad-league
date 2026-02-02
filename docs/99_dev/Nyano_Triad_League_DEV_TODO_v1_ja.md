# Nyano Triad League — 開発TODO（v1）

このファイルは「今なにを作っているか」「次になにを作るか」を、コミュニティと共有するための実装TODOです。

---

## ✅ Done

- ✅ Commit0001: 初期セットアップ（docs雛形、triad-engine skeleton）
- ✅ Commit0002: トランスクリプトv1（EIP-712 / matchId方針）+ ruleset config spec（概念）
- ✅ Commit0003: オートノミー視点（運営不在でも回る仕組み）のロードマップ草案 + ERC-6551 / staking検討メモ
- ✅ Commit0004: triad-engine Layer2（warning mark / combo bonus / second-player balance）実装 + ゴールデンテスト
- ✅ Commit0005: triad-engine Layer3（Trait効果 v1）実装 + 仕様更新
- ✅ Commit0006: Nyano Peace オンチェーン Trait → ゲーム内 TraitType の導出（v1）
  - `synergy.traitDerivation` を ruleset に追加
  - TSヘルパ（`makeCardDataFromNyano` / `deriveTraitTypeFromNyanoTraitV1`）
  - `TRAIT_DERIVATION_SPEC` 追加

  - Shadow / Forest / Earth / Thunder / Light
  - Cosmic / Metal / Flame / Aqua / Wind
  - `TRAIT_EFFECTS_SPEC` 追加、既存仕様（ruleset/transcript）を実装に追従

---

- ✅ Commit0007: Formation bonuses（Layer3拡張）v1 実装 + 仕様追加
  - 五行調和（Five Elements Harmony）：comboBonus の triadPlus を倍率適用
  - 日食（Eclipse）：Light+Shadow のクロス（Lightが警戒無効／ShadowがLight光源）
  - MatchResult に `formations` を追加（UI/解析が “運営なし” でも作りやすい）
  - `FORMATION_BONUS_SPEC` 追加、ruleset/transcript 追従


- ✅ Commit0008: rulesetId 参照実装（固定ABIエンコード）+ RULESET_ID_SPEC + テストベクタ
  - 無効化セクションを正規化（同挙動でIDが分裂しない）
  - 五行調和の requiredElements を集合扱い（順序を無視）
  - `computeRulesetIdV1(ruleset)` を追加（TS参照実装）
## 🚧 Doing (now)

- 🔧 Solidity側：Transcript検証（v1 ABI-encode hash）の最小実装（foundry/hardhatは後で選定）
  - `matchId` の計算と二重提出防止（replay防止）
  - `rulesetId` を受け取り、RulesetRegistry（後続）と接続できる形にする

## 🧩 Next (high priority)


### A. ルール・プロトコルの安定化
- [ ] 公式戦向け：Solidity側のTranscript検証（v1 ABI-encode hash）
- [ ] RulesetRegistry（permissionless）最小実装：rulesetId -> config hash / metadata を登録できる
- [ ] 「Wind（先攻/後攻選択）」の公平な表現（commit-reveal / seed / 両者合意など）

### B. ゲームの“面白さ”を積み増す（ただし決定論で）
- [ ] メタ（Layer4）の小さな可変（例：corner boost / center locked / chain cap）を1つ追加

### C. 自走するコミュニティ設計（運営が消えても回る）
- [ ] 「シーズンの議会」：ruleset proposal / vote / adopt の最小プロトコル
- [ ] ラダー（ランキング）を“許可不要”で第三者が運用できるフォーマット
  - 例：イベントログ＋署名検証＋ランキング算出の決定論

---

## 🔬 Research / Optional

- [ ] ERC-6551（Nyanoトークン境界のアカウント）を使った「チーム/ギルド」
- [ ] NFTステーキングで Season Pass / ルール投票権 / 参加枠（sybil対策）を提供する設計
- [ ] 互換性：過去のOasysエコシステムからの資産移行方針（必要なら）