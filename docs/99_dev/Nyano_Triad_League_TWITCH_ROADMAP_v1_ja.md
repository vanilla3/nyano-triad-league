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
### 1) Replay → Overlay 出力
- Replayページで開いた replay を overlay に投げる
- 「この replay を解説中」の配信用 UI が作れる

### 2) Overlay 表示品質
- 盤面の “どこが変化したか” の強調（直前手のセルをハイライト）
- 勝敗演出（小さくて良いが、気持ちよく）
- 透明背景/サイズ指定など OBS 向けのパラメータ強化

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
