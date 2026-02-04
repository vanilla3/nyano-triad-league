# commit-0035 — Implementation Log（差分）

## Why
- “イベント”は回り始めたが、参加者の行動が「挑戦→共有→比較」まで自然に繋がっていない。
- サーバレスで運用する前提では、まず **ローカルでも良いので戦績の手触り** が必要。
- 共有リンクに eventId が乗らないと、Replay が “どの条件の戦いか” 見失いやすい。

## What
### 1) Match → Replay の共有URLを改善
- share URL に `step=9` を付与（開いた瞬間に最終盤面）
- Event 中は `event=<id>` も付与（どのイベントの戦いか明確化）

### 2) Replay: Eventコンテキスト表示 + Save（ローカル）
- `event` query があれば Eventカードを表示
- `Save` ボタンで “My Attempts” に保存（localStorage）

### 3) Events: My Attempts を表示
- イベントごとに My Attempts（最大5件表示）を表示
- Remove / Clear local を用意

### 4) Docs
- Events Spec に Local Attempts を追記
- Game UI Spec / Implementation Plan を更新

## Verify
- `/events` → Start → match を 9 手確定 → Copy share URL
- `/replay?...&event=...&step=9` が最終盤面から開く
- Replay の `Save` → `/events` に My Attempts が表示される
