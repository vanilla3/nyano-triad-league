# 2026-02-13 - commit-0111 IMPLEMENTATION LOG

## Why
- DEV_TODO の Doing は「Phase 4 の運用面を pointsDelta 連携へ段階拡張」だが、現状の season points は provisional ルール固定だった。
- いきなり on-chain settled event 連携まで進めると実装差分が大きいため、まず URL/ローカル保存経由で `pointsDeltaA` を受け取り、集計ロジックを段階移行できる土台が必要だった。
- 既存データとの互換性を壊さずに進めるため、`pointsDelta` は「イベント内100%カバレッジ時のみ採用、それ以外は provisional 維持」という保守的ルールにした。

## What
- `apps/web/src/lib/event_attempts.ts`
  - `EventAttemptV1` に optional フィールドを追加:
    - `pointsDeltaA?: number`
    - `pointsDeltaSource?: "settled_attested"`
- `apps/web/src/lib/appUrl.ts`
  - `buildReplayShareUrl` に `pointsDeltaA` オプションを追加し、`pda` クエリを生成可能にした。
- `apps/web/src/pages/Replay.tsx`
  - `?pda=` を int32 として解析。
  - Event attempt 保存時に `pointsDeltaA` / `pointsDeltaSource` を保存。
  - share/canonical replay link 生成時に `pda` を保持。
  - Event replay ヘッダに `pointsDeltaA` 検出状態を表示。
- `apps/web/src/lib/season_archive.ts`
  - event集計に以下を追加:
    - `pointsDeltaTotal`
    - `pointsDeltaAttemptCount`
    - `pointsDeltaCoveragePercent`
  - archive markdown に delta 列を追加。
- `apps/web/src/lib/season_progress.ts`
  - points source 概念を追加（`provisional` / `points_delta`）。
  - ルール:
    - event内 attempt の `pointsDeltaA` が100%揃う場合のみ `points_delta` を採用
    - それ以外は既存の provisional ルール（Win/Loss/Clear）を採用
  - summary に source mix（pointsDelta/provisional 件数）を追加。
  - progress markdown に source 列を追加。
- `apps/web/src/pages/Events.tsx`
  - progress パネルに source mix 表示を追加。
  - season points board に source badge（delta/provisional）を追加。
  - event行に delta total / coverage を追加。
- Tests
  - `apps/web/src/lib/__tests__/appUrl.test.ts`
    - `pda` 生成と int32 範囲外の除外を追加。
  - `apps/web/src/lib/__tests__/season_archive.test.ts`
    - pointsDelta 集計と markdown 列更新を追加。
  - `apps/web/src/lib/__tests__/season_progress.test.ts`
    - pointsDelta 採用（100%）と provisional fallback（部分カバレッジ）を追加。

## Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web test -- src/lib/__tests__/appUrl.test.ts src/lib/__tests__/season_archive.test.ts src/lib/__tests__/season_progress.test.ts`
  - この実行環境では `vite/vitest` 起動時に `spawn EPERM` で完走不可
