# commit-0075 IMPLEMENTATION LOG

## Summary
- **P2-2-1（DONE）**: 視聴者提案フォーマット（`#triad ...`）の **spec + parser/normalizer（ライブラリ）** を追加
- 配信運用（/stream）・HUD・将来の bot で同じ仕様を共有できる土台を作った

---

## Why
- 票集計が「表記揺れ」「余計な文字」「矢印表現」などで割れると、運用が一気に難しくなります。
- 先に **spec + parser/normalizer** を一点に置き、/stream と UI はそれを参照する形に寄せるのが、
  手戻りが最も少ない進め方です。

---

## What
- `apps/web/src/lib/triad_viewer_command.ts`
  - spec（canonical format）をコメントで明文化
  - `parseViewerMoveText()`（strict） / `parseViewerMoveTextLoose()`（chat向け）
  - `normalizeViewerMoveText()`（canonical 化）
  - `cellIndexToCoord()` / `cellCoordToIndex()`（座標変換）
  - `formatViewerMoveText()`（表示/提案用）

---

## Verify
- `normalizeViewerMoveText("#triad A2->B2")` → `#triad A2->B2`
- `normalizeViewerMoveText("gg #triad a2->b2")` → `#triad A2->B2`
- `normalizeViewerMoveText("#triad A2→B2 wm=c1")` → `#triad A2->B2 wm=C1`
