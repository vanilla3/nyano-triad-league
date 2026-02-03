# commit-0027 — Implementation Log（差分）

## Why
- 運営がいなくても盛り上がるためには「再現できるリンク」が必要。
  - transcript を貼り付けるだけでも十分だが、議論の速度は “クリック1回” のほうが上がる。
- TurnLog は数値（flipCount 等）は見えるが、実際に “どのマスが反転したか” が文章だけだと追いづらい。
  - boardHistory を使って UI 側で差分を導出し、可視化する。

## What
### Replay share links
- `/replay?t=...&mode=...&step=...` を実装
  - `t` は transcript JSON を base64url(UTF-8) で埋め込む
  - share link を開いたら自動でロードする（read-only RPC）
  - mode/step は URL と同期（t がある場合のみ）

### TurnLog explainability
- `TurnLog` に `boardHistory` を渡せるように拡張
  - 各 turn の `placed` と `flipped cells` を boardHistory の差分から算出して表示
- Playground / Replay で `boardHistory` を渡すように更新

### Tooling
- `apps/web/src/lib/base64url.ts` を追加（URL 埋め込み用）

## Verify
- `pnpm -C apps/web dev`
- `/replay` で share link を作成 → 別タブで開く → 自動ロードされ同じ step が復元される
- TurnLog に flipped cells が表示される
