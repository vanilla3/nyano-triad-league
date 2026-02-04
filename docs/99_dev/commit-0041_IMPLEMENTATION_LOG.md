# commit-0041 IMPLEMENTATION LOG

## What
配信の「解説・採点」を回しやすくするために、Replay を OBS overlay に流し込めるようにしました。
同時に overlay 側の表示品質を上げ、**“いま何が起きたか” を一瞬で理解できる見た目**へ寄せました。

## Why
- Twitch/配信では「状況が即座に読める」ことが最重要（認知負荷を下げるほど実況が成立する）
- Replay はコミュニティ運営の核だが、配信の“絵”に落ちないと盛り上がりが伝播しにくい
- 「運営がいなくても勝手に回る」には、視聴→参加→共有→解説 が自然に繋がる導線が必要

## Changes
### Web
- Replay:
  - Streamer tools を追加（Overlay へ送信 / step 同期）
  - `?broadcast=1` で overlay 同期が初期ON（配信者の作業を減らす）
  - 既存の `toast("saved")` 呼び出しを `toast.success(...)` に修正（Toast API 整合）
- Overlay:
  - LIVE/REPLAY バッジの表示
  - 直前手セル（✨）と warning mark セル（!）のハイライト
  - Last move パネル（誰がどこに置いたか）を追加
  - matchId/tiles など “状況” の補助情報を追加
- Stream Studio:
  - Step 3 として Replay 解説フロー（broadcast）導線を追加
- Match:
  - overlay へ送る status の tiles/winner を正しいフィールドから生成するよう修正

### Docs
- Twitch Streaming Spec / Roadmap を更新（Replay→Overlay の実装反映）

## Notes
- overlay は「ブラウザだけ」で成立する構成を維持（運営不在でも回すため）
- 次は overlay の「flip 理由の一言」や、Match 側の “手番強調” を入れると、実況がさらに楽になります。
