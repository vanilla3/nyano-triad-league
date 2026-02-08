# commit-0076 IMPLEMENTATION LOG

## Summary
- **P2-2-2（DONE）**: /stream の投票集計キーを **canonical viewer command（#triad ...）** に統一
- `triad_viewer_command.ts` の `formatViewerMoveText()` を **単一ソース**として利用し、表示と集計の仕様ズレを抑制

---

## Why
- 票集計のキーが `JSON.stringify(move)` だと、将来の拡張（bot/外部投票/型の揺れ）で
  `null/undefined` やフィールド順などの差異が混ざり、同一手が別票として割れるリスクが残ります。
- 先に「人間が読む形式（#triad）」を canonical にしておくと、配信画面・運営・ログの整合が取りやすい。

---

## What
- `apps/web/src/pages/Stream.tsx`
  - `toViewerMoveText()` を `formatViewerMoveText()` ベースへ移行（canonical を一点化）
  - 投票集計（`counts` / `pickWinner`）の Map キーを `toViewerMoveText(mv)` に変更
  - UI の上位票（Top votes）も、同じ tie-break（cell/card/wm）で安定ソート
  - `state_json.viewerCommandFormat` を `VIEWER_CMD_EXAMPLE` に統一
  - `ai_prompt` の例・合法手リストも `formatViewerMoveText()` へ統一

---

## Verify
- 同一の手が、入力表記の揺れ（例：wm の有無や null/undefined）で票割れしない
- `/stream` の Top votes と `finalizeVote()` の tie-break が一致（見た目と実際の確定がズレない）
- `state_json.viewerCommandFormat` と `ai_prompt` の例が一致
