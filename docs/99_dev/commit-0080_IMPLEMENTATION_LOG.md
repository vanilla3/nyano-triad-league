# commit-0080 IMPLEMENTATION LOG

## Summary
- **P2-2-3（DONE / part）**: `triad_vote_utils.toViewerMoveText()` を `triad_viewer_command.formatViewerMoveText()` に委譲し、`#triad` の文字列生成を単一ソース化した。

---

## Why
- /stream / HUD / overlay で `#triad` の表記がズレると、票割れ・運用ミス・strictAllowed hash の不一致に直結します。
- 先に「出力フォーマット」を一点に固定しておくと、後続の parser 統一・strictAllowed 固定が安全に進められます。

---

## What
- `apps/web/src/lib/triad_vote_utils.ts`
  - `formatViewerMoveText()` を利用して canonical を生成するように変更（既存 I/F は維持）

---

## Verify
- allowlist / HUD の提案文言が `#triad A2->B2 wm=C1` 形式で安定していること
- 既存の動作（A1..C3 表記、wm 省略時の文字列）が変わっていないこと
