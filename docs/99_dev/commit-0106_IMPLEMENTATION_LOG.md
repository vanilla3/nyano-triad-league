# 2026-02-12 — commit-0106 IMPLEMENTATION LOG

## Why
- Phase 3 の未完了だった「エラートラッキング」と「リリース手順」を最小構成で実装し、運用の再現性を高めるため。

## What
- `apps/web/src/lib/error_tracking.ts` を追加。
  - global error / unhandledrejection を収集。
  - sink 切替（local / console / remote）を実装。
  - localStorage リングバッファ保持（既定50件）。
- `apps/web/src/main.tsx` で `installGlobalErrorTracking()` を導入。
- `apps/web/src/lib/__tests__/error_tracking.test.ts` を追加。
- ルート `package.json` に `release:check` スクリプトを追加。
- `docs/99_dev/RELEASE_RUNBOOK_v1_ja.md` を追加。
- ロードマップ・TODO・実装ログを同期更新。

## Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/error_tracking.test.ts`
  - 実行環境制約（`spawn EPERM`）で完走不可
