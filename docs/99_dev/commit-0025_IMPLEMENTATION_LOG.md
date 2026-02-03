# commit-0025 — Implementation Log（差分）

## Why
- “運営がいなくても盛り上がる”には、議論のための **共有可能な再現手段**が必要。
- これまでは Playground の状態（vector/case/step）が URL に反映されず、共有が弱かった。
- さらに、v1/v2 の差分が直感的に伝わりづらかったため、比較表示と盤面差分の視覚化が欲しい。

## What
### Playground UX
- URL クエリ（`vec/case/step/cmp`）で状態を復元・共有できるようにした
- “Copy share link” を追加
- キーボード（←/→）でステップ移動

### Visual polish
- 盤面で「置いたマス」「反転したマス」をハイライト（boardHistory の差分から算出）
- compare mode: v1/v2 を同一ステップで並べて表示し、差分（diverged / same）を提示

### Explainability
- Deck inspector を追加（A/B のカード情報を並べて “読み物” を強化）

## Verify
- `pnpm -C apps/web dev`
- Playground で URL 共有→別タブで同じ状態に復元できる
