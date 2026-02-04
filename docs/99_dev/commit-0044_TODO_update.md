# commit-0044 TODO update

## Done
- [x] /stream → /overlay vote state broadcast（countdown + top votes）
- [x] overlay: vote UI（vote=0 toggle）
- [x] overlay: last flip count 推定 + ハイライト（配信の絵）

## Next
### 配信価値の強化（実況が自然に出る）
- [ ] overlay: flip理由ラベル（mark/edge/bonus/formation/combo）
- [ ] overlay: “今の手番” を強調（A/Bのターン表示）

### 視聴者参加のしやすさ（荒れにくさ）
- [ ] /stream: 合法手サジェスト（空きcell/未使用cardIndex）
- [ ] vote window のクールダウン/最低投票数など

### Twitch Bridge（外部プロセス）
- [ ] EventSub WebSocket の Bridge PoC（tokenはブラウザ外）
- [ ] Bridge → publishStreamCommand（同一契約）
