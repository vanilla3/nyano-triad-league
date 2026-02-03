# commit-0028 TODO update（差分）

## Done（commit-0028）
- Replay share link を gzip 圧縮（`z`）対応し、長いURL問題を軽減
- 旧 `t` 形式も維持して後方互換を確保
- Playground から Replay へ “議論の入口” を繋ぐボタンを追加（on-chain replay）

## Next（commit-0029）
- `z` をさらに短く：JSONの冗長部分を落とす compact schema（header/turns の最小表現）を検討
- Replay の失敗時UX改善：どの tokenId が読み取り失敗したか等の詳細表示
- “実況”強化：TurnLog に flip 理由（edge/janken/triadPlus/mark の内訳）を1行要約で出す
