# commit-0082 IMPLEMENTATION LOG

## Summary
- strictAllowed の viewer command 文字列フォーマットを `triad_viewer_command` に一本化（`triad_vote_utils` が `formatViewerMoveText` を使用）
- StreamOperationsHUD の strictAllowed 表示を `computeStrictAllowed(toPlay)` 基準に統一（以前は controlledSide 基準で hash/count がズレ得た）
- ロードマップの現在地を更新（commit-0082 を反映済みに）

## Notes
- HUD の allowlist/hash は overlay / stream(state_json) と一致する想定（allowlist を sort → join("\n") → FNV-1a 32bit）。
- 次は /stream の入力受理（parse/normalize）を単一ソースへ寄せ、票割れと曖昧さを根絶する。

## Files
- apps/web/src/lib/triad_vote_utils.ts
- apps/web/src/components/StreamOperationsHUD.tsx
- docs/00_handoff/Nyano_Triad_League_LONG_TERM_ROADMAP_v1_ja.md
- docs/99_dev/commit-0082_IMPLEMENTATION_LOG.md
- docs/99_dev/commit-0082_TODO_update.md
