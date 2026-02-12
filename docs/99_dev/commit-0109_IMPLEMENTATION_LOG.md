# 2026-02-12 — commit-0109 IMPLEMENTATION LOG

## Why
- Phase 4 の未完了項目「シーズン制（ランキング/報酬/アーカイブ）」のうち、まず運用で即使えるアーカイブ導線が不足していた。
- 既存の `/events` はイベント単位のローカル履歴表示はあるが、season単位の振り返りができず、継続参加の可視化が弱かった。
- 集計ロジックを UI 直書きすると将来のランキング拡張で破綻しやすいため、pure function として切り出す必要があった。

## What
- `apps/web/src/lib/season_archive.ts` を新規追加。
  - `buildSeasonArchiveSummaries(...)` を実装（season/event単位の集計、勝率、best diff、最新挑戦時刻）。
  - `formatSeasonArchiveMarkdown(...)` を実装（共有用の Markdown 生成）。
- `apps/web/src/lib/event_attempts.ts`
  - `listAllEventAttempts()` を追加（全イベント横断でローカル履歴を取得）。
  - `clearAllEventAttempts()` を追加（全履歴の一括クリア）。
- `apps/web/src/pages/Events.tsx`
  - `Season Archive (local)` セクションを追加。
  - season 切替 UI、勝率/挑戦数/Win-Loss サマリー、イベント別最新 Replay 導線を追加。
  - 選択 season の Markdown コピー導線を追加。
  - 全ローカル履歴クリア導線を追加（確認ダイアログ付き）。
- Tests
  - `apps/web/src/lib/__tests__/season_archive.test.ts` を追加。
  - `apps/web/src/lib/__tests__/event_attempts.test.ts` に全件取得/全消去ケースを追加。

## Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`
