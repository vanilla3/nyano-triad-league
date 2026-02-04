# commit-0047 TODO update

## Done
- [x] overlay: engine turn summary badges（combo/plus/mark）
- [x] match/replay: lastTurnSummary を overlay bus に送信

## Next
### Trace（“なぜflipしたか”を確定表示）
- [ ] triad-engine: simulateMatchV1WithHistory に trace オプション（per edge compare / per flip reason）
- [ ] overlay: EDGE/BONUS/COMBO/FORMATION を flip ごとに表示
- [ ] stream: suggested moves を trace ベース（強さ/面白さ）に進化

### Twitch Bridge
- [ ] 外部プロセスから command bus へ接続する経路（ws or http relay）の設計
- [ ] allowlist/cooldown/banlist
