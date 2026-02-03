# commit-0030-fix1 — Implementation Log（差分）

## Why
- `/playground` で `vf.notes?.join is not a function` が発生。
- 原因：JSON test-vector の `notes` が配列ではなく文字列（または想定外型）になっているケースがあり、
  UI が `join()` を呼んでクラッシュしていた。

## What
- `apps/web/src/lib/vectors.ts` に runtime 正規化を追加：
  - `notes` を常に `string[]` に正規化（string の場合は `[string]` に包む）
  - UI 側は `.join(" / ")` を安全に呼べる

## Verify
- `pnpm -C apps/web dev`
- `/playground` がクラッシュせず表示される
