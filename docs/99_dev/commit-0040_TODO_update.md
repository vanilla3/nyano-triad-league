# commit-0040 TODO update

## Done
- [x] OBS overlay（/overlay）を追加（Match進行を表示）
- [x] Stream Studio（/stream）を追加（配信導線の整理）
- [x] Match → Overlay のブロードキャスト（best-effort）
- [x] イベント仮デッキ（1..5）を mint済み tokenId に自動置換（保険）

## Next
### UI/UX（ゲームとしての磨き）
- [ ] Overlay: 直前手のセルをハイライト / flip の理由を一言で表示
- [ ] Match: “今どっちのターンか” を視覚的に強調（ヘッダ/盤面）
- [ ] Replay: overlay に投げて “解説モード” を作る

### Twitch連携（段階導入）
- [ ] Chatコマンド仕様の確定（投票方式を標準に）
- [ ] Web側に「チャット風入力」パネル（Twitch未接続）を作る
- [ ] Twitch Bridge（IRC/EventSub）を別プロセスで実装（OAuth/Tokenはブラウザに入れない）

### 自律運営（Autonomy）
- [ ] Event/Ruleset を “提案→採用” できる仕組み（最初は手動でよい）
- [ ] Nyano AI の人格/短文リアクションの設計（長文禁止、テンポ優先）
