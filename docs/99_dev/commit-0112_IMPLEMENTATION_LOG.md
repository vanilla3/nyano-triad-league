# 2026-02-13 - commit-0112 IMPLEMENTATION LOG

## Why
- Phase 4 の pointsDelta 連携を URL 手入力だけに依存せず、`on-chain settled event` の JSON 取り込みで移行できるようにしたかった。
- local season points の信頼性を維持するため、`matchId` 一致だけでなく winner / tiles の整合チェックが必要だった。

## What
- `apps/web/src/lib/settled_points_import.ts`
  - settled event JSON の parse/検証/重複競合検知を追加。
  - `applySettledPointsToAttempts(...)` で整合した local attempts にのみ `pointsDeltaA` を反映。
- `apps/web/src/pages/Events.tsx`
  - `Settled points import (local)` UI を追加。
  - 適用結果のサマリ表示（updated/mismatch/no-local 等）を追加。
  - 更新対象 attempt を `upsertEventAttempt(...)` で永続化。
  - My Pawprints に `deltaA` バッジを追加。
- Tests
  - `apps/web/src/lib/__tests__/settled_points_import.test.ts` を追加。
- Docs
  - `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md` を更新（Commit0112追加 / Doing更新）。
  - `docs/99_dev/IMPLEMENTATION_LOG.md` を更新。

## Verify
- `pnpm -C apps/web test -- src/lib/__tests__/settled_points_import.test.ts`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
