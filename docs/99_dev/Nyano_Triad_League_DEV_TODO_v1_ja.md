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
- ✅ Sprint UX: Home「すぐ遊ぶ」→初手配置までの時間計測を追加（`quickplay_to_first_place_ms`）
- ✅ Sprint UX: Home LCP のローカル計測を追加（`home_lcp_ms`）
- ✅ Sprint UX: Home Settings に UX目標の PASS/FAIL 判定を追加（A-1/B-1/B-4/G-3）
- ✅ Sprint UX: `Copy Snapshot` と `PLAYTEST_LOG.md` を追加し、計測ログ運用を固定
- ✅ Sprint UX: web lint warning 2件を解消（`pnpm -C apps/web lint` warning 0）
- ✅ Sprint UX: Snapshotに環境コンテキスト（route/viewport/language/UA）を含め、比較ログ精度を向上
- ✅ Sprint UX: NyanoCardArt の失敗時に Retry 導線を追加（retry nonce 付き再読込）
- ✅ Commit0104: 「シーズンの議会」最小プロトコル（proposal / vote / adopt）を TS 参照実装
  - `season_council.ts` を追加（proposalId / vote hash / EIP-712 vote verify / tally / adopt）
  - 決定論ルールを固定（候補集合 canonicalize、同一voterは最大nonce採用、同率は rulesetId 昇順）
  - 仕様書 `SEASON_COUNCIL_SPEC` を追加
- ✅ Commit0105: permissionless ladder format v1（transcript + settled event + 両署名）を TS 参照実装
  - `ladder.ts` を追加（EIP-712 attestation / record verify / deterministic standings）
  - indexer 非依存の tie-break を固定（points → wins → tileDiff → losses → address）
  - 仕様書 `LADDER_FORMAT_SPEC` を追加
- ✅ Commit0106: Phase 3 hardening（error tracking + release runbook）を最小実装
  - `apps/web/src/lib/error_tracking.ts` を追加（global error / unhandledrejection の収集）
  - sink を切替可能化（local / console / remote, env設定）
  - `docs/99_dev/RELEASE_RUNBOOK_v1_ja.md` を追加（versioning/changelog/rollback/feature flag）
  - `pnpm run release:check` を追加（出荷前チェックの標準化）
- ✅ Commit0107: 新規参加者向け quickstart 導線（3ステップ進捗）を実装
  - `apps/web/src/lib/onboarding.ts` を追加（localStorage永続化・進捗集計・リセット）
  - Home に「はじめての1分スタート」チェックリストと1分ルールモーダルを追加
  - Match のゲスト対戦導線で `start_first_match` / `commit_first_move` を自動更新
  - `onboarding.test.ts` を追加（既定値、永続化、異常値fallback、reset）
- ✅ Commit0108: /stream モデレーション（NGワード / BAN / slow mode）を実装
  - `stream_moderation.ts` を追加（判定ロジックを pure function 化）
  - VoteControlPanel に moderation 設定UI（slow mode秒数 / banned users / blocked words）を追加
  - 投票受理前に BAN / NGワード / slow mode を適用し、audit に reject 理由を記録
  - `local_settings` に moderation 永続化キーを追加（roundtrip test 付き）
- ✅ Commit0109: /events に Season Archive（local）を追加
  - `season_archive.ts` を追加（season/event単位の集計を pure function 化）
  - Events に season 切替・勝率/挑戦数サマリー・最新Replay導線・Markdownコピーを追加
  - `event_attempts` に全件取得/全消去 API を追加（ローカル運用の保守性向上）
  - `season_archive.test.ts` / `event_attempts.test.ts` で集計と storage API を検証
## 🚧 Doing (now)

- 🔧 Phase 4 の運用面（ランキング / 報酬導線）の最小設計を進める

## 🧩 Next (high priority)


### A. ルール・プロトコルの安定化
- [x] 公式戦向け：Solidity側のTranscript検証（v1 ABI-encode hash）
- [x] RulesetRegistry（permissionless）最小実装：rulesetId -> config hash / metadata を登録できる
- [x] 「Wind（先攻/後攻選択）」の公平な表現（commit-reveal / seed / 両者合意など）

### B. ゲームの“面白さ”を積み増す（ただし決定論で）
- [x] メタ（Layer4）の小さな可変（例：corner boost / center locked / chain cap）を1つ追加
  - `meta.chainCapPerTurn` を TS参照エンジンに追加（1ターンの成功フリップ数を上限化可能）
  - v1では engine-only（rulesetId canonicalization には未反映）

### C. 自走するコミュニティ設計（運営が消えても回る）
- [x] 「シーズンの議会」：ruleset proposal / vote / adopt の最小プロトコル
- [x] ラダー（ランキング）を“許可不要”で第三者が運用できるフォーマット
  - transcript + settled event + EIP-712 attestation で再計算可能
  - indexer 非依存の固定 tie-break を実装（`buildLadderStandingsV1`）

---

## 🔬 Research / Optional

- [ ] ERC-6551（Nyanoトークン境界のアカウント）を使った「チーム/ギルド」
- [ ] NFTステーキングで Season Pass / ルール投票権 / 参加枠（sybil対策）を提供する設計
- [ ] 互換性：過去のOasysエコシステムからの資産移行方針（必要なら）
- Sprint UX: Home Settings now keeps local UX snapshot history (save on copy, view recent 5, clear history).
