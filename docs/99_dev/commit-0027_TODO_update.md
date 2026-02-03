# commit-0027 TODO update（差分）

## Done（commit-0027）
- Replay を shareable URL 化（t=base64url(json), mode, step）
- TurnLog に boardHistory 差分（placed / flipped cells）を追加し “読み物” を強化
- Playground / Replay で boardHistory を渡す

## Next（commit-0028）
- share link をさらに短縮（LZ 圧縮 or compact schema）
- flip の “理由” を TurnLog に出す（edge/janken/triadPlus/warning の内訳）
- Replay で `t` が巨大な場合の警告と、無効 JSON の UX を改善（例：エラー箇所のヒント）
- “Community remix” 用に、rulesetId 不一致でも off-chain-only で再現できるモードを検討（cards を埋め込む / vector互換）
