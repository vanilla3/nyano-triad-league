# commit-0043 TODO update

## Done
- [x] vote state bus（StreamVoteStateV1）を追加
- [x] /stream が投票状態を overlay に broadcast
- [x] /overlay に投票タイマー + Top votes を表示（OPENの時のみ）
- [x] overlay: `vote=0` で非表示オプション

## Next
### 配信の“絵”をさらに良くする
- [ ] overlay: flip理由（mark/edge/bonus/formation/combo）を短いラベルで表示
- [ ] overlay: 重要な盤面変化（大量flip / fever / domination）をマイクロアニメーションで示す
- [ ] stream: 投票開始時に “おすすめ候補（合法手）” を自動生成（荒らし耐性）

### Twitch Bridge
- [ ] EventSub WebSocket / IRC のどちらで行くかを確定
- [ ] Bridge PoC: chat -> vote -> publishStreamCommand()
- [ ] 参加制御（cooldown / allowlist / banlist）
