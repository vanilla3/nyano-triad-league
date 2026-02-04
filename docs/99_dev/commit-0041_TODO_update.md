# commit-0041 TODO update

## Done
- [x] Replay → Overlay 出力（snapshot送信）
- [x] Replay step 同期（broadcast=1 / toggle）
- [x] Overlay: 直前手セル/mark のハイライト
- [x] Overlay: LIVE/REPLAY バッジ、Last move パネル
- [x] Match → Overlay の tiles/winner を正しく送る

## Next
### UI/UX（ゲームとしての磨き）
- [ ] Overlay: flip の理由（edge比較/mark/bonus）を「一言」で表示（表示過多にならない範囲で）
- [ ] Match: “今どっちのターンか” を盤面/ヘッダで強調（配信でもローカルでも効く）
- [ ] Replay: “注目ポイント” 自動生成（例: 逆転ターン/連鎖flip/fever発動）とハイライト
- [ ] Stream: “視聴者リプレイ採点” の簡易テンプレ（固定の採点軸をUIで出す）

### Twitch連携（段階導入）
- [ ] Chatコマンド仕様の確定（投票方式を標準に）
- [ ] Web側に「チャット風入力」パネル（Twitch未接続）を作る
- [ ] Twitch Bridge（IRC/EventSub）を別プロセスで実装（OAuth/Tokenはブラウザに入れない）

### 自律運営（Autonomy）
- [ ] Event/Ruleset を “提案→採用” できる仕組み（最初は手動でよい）
- [ ] Nyano AI の人格/短文リアクションの設計（長文禁止、テンポ優先）
