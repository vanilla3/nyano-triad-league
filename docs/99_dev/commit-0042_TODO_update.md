# commit-0042 TODO update

## Done
- [x] stream command bus を追加（/stream → /match）
- [x] /stream に投票コンソール（chat simulation）を実装
- [x] /match?stream=1 が move を適用（turn mismatch は無視）
- [x] Host link を /stream に追加（stream=1）

## Next
### 配信価値の強化（見せ方）
- [ ] overlay: 投票中のタイマー/トップ投票を表示（Phase 3）
- [ ] overlay: flip理由（mark/edge/bonus）を短文で表示
- [ ] replay: “決定的ターン” 自動抽出（逆転/fever/momentum）

### Twitch Bridge（外部プロセス）
- [ ] EventSub WebSocket を使った Bridge PoC
- [ ] OAuth token をブラウザに置かない構成（ローカルCLI/小サーバ）
- [ ] レート制限/荒らし対策（投票窓、cooldown、BAN/allowlist）

### Game as a Game
- [ ] “Nyano人格” の演出（煽りではなく、世界観として可愛い語り）
- [ ] Eventの表彰（称号/スタンプ/称賛UI）を replay 共有に載せる
