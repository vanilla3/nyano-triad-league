# 2026-02-12 — commit-0107 IMPLEMENTATION LOG

## Why
- Phase 4 の参加導線タスクとして、新規参加者の初回体験を短くする quickstart 導線が必要だった。

## What
- `apps/web/src/lib/onboarding.ts` を追加。
  - 3ステップ進捗（`read_quick_guide` / `start_first_match` / `commit_first_move`）を永続化。
  - 完了数集計、全完了判定、reset API を実装。
- `apps/web/src/lib/__tests__/onboarding.test.ts` を追加。
  - 既定値、永続化、異常値fallback、reset を検証。
- `apps/web/src/pages/Home.tsx`
  - quickstart checklist UI を追加。
  - 1分ルールモーダルと進捗表示/リセット導線を追加。
- `apps/web/src/pages/Match.tsx`
  - ゲスト対戦開始時に `start_first_match` を更新。
  - 初手確定時に `commit_first_move` を更新。
- `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md`
  - Phase 4 のチュートリアル項目を完了に更新。
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0107 を追記し、Doing を次フェーズへ更新。

## Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web test -- src/lib/__tests__/onboarding.test.ts`
  - 実行環境制約（`spawn EPERM`）で完走不可
