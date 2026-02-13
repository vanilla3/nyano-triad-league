# 2026-02-13 - commit-0113 IMPLEMENTATION LOG

## Why
- settled import を毎回手貼りする運用から、既定パス読み込みで短縮したかった。
- pointsDelta をより安全に取り込むため、`domain + signatures` を使う検証モードを導入したかった。

## What
- `apps/web/src/lib/settled_points_import.ts`
  - `parseVerifiedLadderRecordsImportJson(...)` を追加。
  - `{ domain, records }` 入力で `verifyLadderMatchRecordV1(...)` を実行し、検証済み settled 情報を抽出。
  - issue code `attestation_invalid` を追加。
- `apps/web/src/lib/__tests__/settled_points_import.test.ts`
  - verified import の schema 不正・署名検証失敗を追加検証。
- `apps/web/src/pages/Events.tsx`
  - import mode 切替 UI（fast / verified）を追加。
  - `/game/settled_events.json` 自動読込ボタンを追加。
  - mode ごとに parser を切替え、既存 apply フローで local attempts へ反映。
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0113 を追記し、Doing を更新。
- `docs/99_dev/IMPLEMENTATION_LOG.md`
  - commit-0113 記録を追記。

## Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web test -- src/lib/__tests__/settled_points_import.test.ts`
- `pnpm -C apps/web test`
- `pnpm -C apps/web build`
