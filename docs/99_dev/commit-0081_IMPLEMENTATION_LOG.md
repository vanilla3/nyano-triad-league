# commit-0081 IMPLEMENTATION LOG

## Summary
- CI: pnpm/action-setup の version 指定を削除し、package.json#packageManager を single source にした（pnpm 二重指定エラーの解消）
- Roadmap: 現状（コミットマップ）と CI/pnpm 標準を追記（他作業者が現在地を把握しやすく）

## Why
- pnpm/action-setup@v4 は `version:` と `packageManager:` が同時に存在するとエラーになる（Multiple versions of pnpm specified）。

## Files
- .github/workflows/ci.yml
- docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md
- docs/99_dev/commit-0081_IMPLEMENTATION_LOG.md
- docs/99_dev/commit-0081_TODO_update.md
