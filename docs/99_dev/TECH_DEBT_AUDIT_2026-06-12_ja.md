# 技術的負債 監査レポート（2026-06-12）

全コードベース（apps/web / packages/triad-engine / contracts / docs / scripts / CI）を対象に実施。
優先度スコア = (影響度 + リスク) × (6 − 工数)（各 1〜5）。

## 総評

- **エンジン（triad-engine）は極めて健全**: 純粋関数・決定論が守られ、`any`/`TODO`/乱数/時刻依存ゼロ。テスト 27 ファイル・Solidity との共有テストベクタで実装一致を CI 検証済み。
- **フロントは「動くが太い」**: 巨大ページコンポーネント（Match.tsx 2,639行 等）と未完了の日本語化 WIP が品質ゲートを赤にしていた（本日解消）。
- **コミュニティ自走化の土台（プロトコル仕様・ゲストプレイ・共有URL）は強いのに、入口（LICENSE / CONTRIBUTING / 公開URL明記）が欠けていた**（本日解消）。

## 対応済み（2026-06-12 のセッションで解消）

| 項目 | 内容 |
|---|---|
| ✅ テストスイート全赤 | 日本語化 WIP に未追従だった unit 36 件を期待値整合で修復（225 ファイル / 1,786 件 全緑） |
| ✅ e2e ラベルドリフト + 旧ビジュアルベースライン | 英語 aria-label 期待値・文字化け入り PNG ベースラインを現 UI に更新 |
| ✅ LICENSE 不在 | MIT を新設 + 全 package.json に license フィールド（**ライセンス種別は要オーナー確認**） |
| ✅ CONTRIBUTING / CODE_OF_CONDUCT 不在 | 日英併記で新設（不変条件・検証コマンド・第三者ツール入口を明記） |
| ✅ README が新規参加者に不親切 | 公開URL（https://v0-nyano-triad-league.vercel.app）/ NFT 不要プレイ / プロトコル入口を明記 |
| ✅ 図鑑 CSS 未定義 | `.mint-card-browser` BEM 一式が**未定義のまま参照されていた**（グリッドが無スタイル縦並び）→ 完全実装 + ティア演出 |
| ✅ 結果画面が地味 | 紙吹雪・勝利光線・スコアカウントアップ（reduced-motion / data-vfx 準拠）+ X ポストボタン |
| ✅ デッドCSS 約2,600行 | 未 import の `src/index.css` / `src/_archive/` を削除 |
| ✅ eslint 型逃げ放置 | `no-explicit-any` off→warn（現状 65 警告 = 追跡対象の債務）、`no-constant-condition` off→error |
| ✅ `pnpm test` がエンジンのみ | web unit テストも実行するよう修正 |
| ✅ handoff zip がコミット対象 | index から除外 + .gitignore 整備（ルート PNG スクショ含む） |
| ✅ lint:text 既存失敗 5 件 | 破損アーカイブを `_archive` 退避 + スキャナの `_archive` 除外 |

## 未対応（優先度順）

### P1 — スコア 32〜40

1. **巨大ページコンポーネントの分割**（影響5・リスク4・工数3 → 27）
   `pages/Match.tsx` 2,639行（useState 系 87個）、`Replay.tsx` 2,471行、`Stream.tsx` 1,546行。
   機能追加のたびに回帰リスクが増す。`features/match/` への hooks 抽出は始まっているので継続が正道。
2. **git 履歴の不在**（影響4・リスク5・工数1 → 45）
   `master` に**初回コミットが存在しない**（全変更がステージのみ）。事故 1 回で全損し得る。
   → 速やかに初回コミット + リモート push を推奨。旧 stash（`wip: before switch to main`）の棚卸しも。
3. **コントラクトのデプロイ自動化なし**（影響4・リスク4・工数2 → 32）
   `contracts/script/Deploy.s.sol` が無く、テストネット検証・本番化が手作業。Phase C（許可不要レジストリ公開）のブロッカー。

### P2 — スコア 20〜31

4. **TS⇔Solidity の統合テスト不在**（4+4)×(6-3)=24 — 共有ベクタはあるが「TS シミュレート→コントラクト送信→決済一致」の E2E が無い。
5. **DEV_TODO 本文の文字化け破損**（3+3)×(6-2)=24 — 旧セクションが `?` 置換で原文消失。IMPLEMENTATION_LOG から Done リストを再構築するのが現実的。
6. **i18n（英語対応）なし**（5+2)×(6-4)=14〜UI 全文字列が日本語直書き。コミュニティ拡大の最大ボトルネック。`react-i18next` 等での段階導入を推奨（まず match/decks/nyano の主要導線）。
7. **カバレッジ計測なし**（3+3)×(6-2)=24 — vitest/nyc/forge coverage いずれも未配線。閾値ゲートも無し。
8. **mint-theme.css モノリス**（3+2)×(6-2)=20 — 8,800行超。`_tokens.css` / `_components.css` / `_fx.css` 等への分割を推奨（ガードテストの `?raw` import 対象更新を忘れずに）。

### P3 — スコア 〜19

9. **依存メジャー遅れ**: React 18→19 / Vite 5→7 / Tailwind 3→4 / react-router 6→7。ブロッカーなし、まとめて 1〜2 日。
10. **テーマ三重実装**: BoardView / BoardViewMint / BoardViewRPG（計 1,816行）。RPG の利用実態を計測し、廃止判断を。
11. **e2e が chromium 単一 / 直列**: Firefox/WebKit 追加と `workers` 並列化で CI 時間短縮。
12. **バンドル分析なし**: rollup-plugin-visualizer 導入（pixi チャンク 500KB 超の監視）。
13. **`features/match/urlParams.ts` 群の過剰抽象**: URL 直列化ヘルパが 15 ファイル超に分散。共有リンク互換（不変条件）を壊さない範囲で段階整理。

## コミュニティ自走化ロードマップとの接続

`docs/03_autonomy/` の Phase 進行に対し、コード側の現在地は:

- Phase A（プロトコル固定）: ✅ 完了
- Phase B（イベント公開）: ✅ ほぼ完了（インデクサ実例の公開が残）
- Phase C（許可不要レジストリ）: ⚠️ コントラクトは実装済みだが**未デプロイ**（上記 P1-3 が前提）
- Phase D（リーグファクトリ）: 未着手

次の一手として価値が高い順: 初回コミット → Deploy スクリプト → 英語 README/主要 spec 英訳 → i18n 基盤。
