# 2026-02-12 — commit-0108 IMPLEMENTATION LOG

## Why
- Phase 4 の運用面として、`/stream` に NGワード / BAN / スローモードの実運用向け制御が必要だった。

## What
- `apps/web/src/lib/stream_moderation.ts` を追加。
  - moderation list parser（comma/newline）
  - banned user 判定
  - blocked word 判定
  - slow mode 判定/記録
- `apps/web/src/pages/Stream.tsx`
  - moderation 設定 state を追加し localStorage に永続化。
  - 投票受理前に BAN / NGワード / slow mode を適用。
  - vote audit に moderation reject 内訳を追加。
- `apps/web/src/components/stream/VoteControlPanel.tsx`
  - Moderation 設定UIを追加。
  - audit 表示に `banned/ng-word/slow` を追加。
- `apps/web/src/lib/local_settings.ts`
  - moderation 設定 read/write ヘルパを追加。
- `apps/web/src/lib/__tests__/stream_moderation.test.ts` を追加。
- `apps/web/src/lib/__tests__/local_settings.test.ts` に moderation roundtrip を追加。
- `docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md`
  - Phase 4 moderation 項目を完了に更新。
- `docs/99_dev/Nyano_Triad_League_DEV_TODO_v1_ja.md`
  - Commit0108 を追記。

## Verify
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web test -- src/lib/__tests__/stream_moderation.test.ts src/lib/__tests__/local_settings.test.ts`
  - 実行環境制約（`spawn EPERM`）で完走不可
