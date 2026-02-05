# Nyano Triad League · Twitch Roadmap (v1 / ja)

## ゴール像
AI Nyano が Twitch で配信しつつ、視聴者が “その場で参加できる” 対戦イベントを開催できる。

- 運営が不在でも「イベントの開催」「ルール更新」「ランキング」が継続できる
- コミュニティが勝手に盛り上がる（参加導線が軽い）
- Bot/AIは “主役” だが “支配者” ではない（透明性がある）

---

## いまの到達点
- Off-chain replay を共有して盛り上がれる
- `/overlay` で OBS 表示が可能（ブラウザのみ、バックエンド不要）
- `/stream` で配信者向け導線（チャレンジリンク/overlay URL）

---

## 次に実装する順番（現実的な最短）
### 1) Replay → Overlay 出力（実装済み）
- Replayページで開いた replay を overlay に投げられる
- step 移動で overlay が追随（解説/採点がやりやすい）

### 2) Overlay 表示品質（第一段階）
- 直前手のセル（✨）と warning mark（!）をハイライト
- LIVE/REPLAY バッジ、matchId/tiles 表示など “状況が一目で分かる” 情報を追加
- 透明背景/サイズ指定など OBS 向けパラメータは維持

### 3) Chat Command Parser（Twitch未接続）
- Web側に “チャット風入力” を用意し、コマンド処理の仕様を先に固める
- 失敗時のUX（エラーを荒れさせない）を検証

### 4) Twitch Bridge（接続）
- Twitch Chat（IRC / EventSub）からメッセージを受信
- 投票・集計・レート制限
- Coordinator に送る（HTTP/WebSocket）

### 5) 参加者アイデンティティ（必要なら）
- Twitchアカウント ↔ Wallet 連携（署名）
- 保有Nyano NFTをdeckとして使えるようにする（検証可能）

---

## “運営がいなくても回る” ための設計観点
- ルールセットは config として hash 化され、あとから検証できる
- Event は “誰でも提案” できる（ただし spam 対策が必要）
- “公式” は権力ではなく、単に “推奨セット” を配る存在にする

---

## リスクと対策（抜粋）
- チャット荒れ → 投票方式 + rate limit + 失敗の静かな処理
- 攻撃/不正 → transcript hash / 再現性 / 記録の透明性
- RPC不安定 → RPC切替UI + fallback + 失敗時ガイド

---

## 参考（Twitch側の概念）
- Chat: IRC / EventSub
- Auth: OAuth（Bot/配信者トークン）
- Event: Channel Points / Subscription など（後回しでも成立）

### 2) Chat voting プロトタイプ（/stream → /match）
- [x] `/stream` で投票集計（ローカル chat simulation）
- [x] `/match?stream=1` が command bus を購読して move を適用
- [ ] Twitch Bridge（EventSub/IRC）を別プロセスで実装（秘密情報をブラウザに置かない）
- [ ] 視聴者の荒らし耐性：投票窓・クールダウン・BANリストなど

- [x] Overlay: vote countdown + top votes（/stream → /overlay）


### UI polish (stream ops)
- [x] overlay: vote countdown + top votes
- [x] overlay: flip summary (flip×N / mark)
- [x] stream: legal move helper (cells/cards/wm)


### UI polish (stream ops)
- [x] overlay: vote card (OPEN/countdown/top)
- [x] overlay: flip summary (flip×N, flipped cells)
- [x] stream: suggested moves presets (center→corner→edge)


### Reason badges
- [x] overlay: engine turn summary badges (combo/plus/mark)
- [ ] engine trace: EDGE/BONUS/COMBO/FORMATION per flip
- [ ] overlay: show per-flip reason (with trace)


### Trace (why a flip happened)
- [x] triad-engine: TurnSummary.flipTraces (per-flip)
- [x] overlay: show per-flip trace list (controls only)
- [ ] triad-engine: richer reason tags (EDGE/BONUS/COMBO/FORMATION/MARK)
- [ ] overlay: show reason tags per flip (iconized)
