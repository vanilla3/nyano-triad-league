# commit-0043 IMPLEMENTATION LOG

## What
配信の参加感を上げるために、**投票状況（残り秒数 / Top votes）を OBS overlay に表示**できるようにしました。

- `StreamVoteStateV1` を追加（/stream → /overlay）
- `/stream` が投票開始・更新・終了に合わせて `publishStreamVoteState()` を送信
- `/overlay` が購読し、投票がOPENの時だけコンパクトに表示（progressive disclosure）

## Why
配信視聴者にとって重要なのは「いま何が起きているか」を **瞬時に理解できる**ことです。  
投票の状態が overlay に出るだけで、参加のタイミングと目的が明確になり、
“見ているだけ”から“参加している”へ移行しやすくなります。fileciteturn1file0

## Manual test checklist
1. `/stream` を開く
2. Host link（`/match?stream=1`）でライブ対戦を開始
3. `/overlay?controls=1` を別タブで開く
4. `/stream` で Start vote → Add vote を複数回
5. overlay に OPEN + countdown + top votes が出る
6. End & send で投票を閉じると overlay から vote UI が消える
