# commit-0032 — Implementation Log（差分）

## Why
- “参照ツール”から“遊べるゲーム”へ移行するために、**Decks → Match → Replay** の導線をまず通す必要がある。
- オンチェーン提出/署名の前に、**ローカルで transcript を作り、誰でも Replay できる**ところまでを UI で成立させたい。
- 9手固定の transcript を前提にしつつ、UI では“途中経過”を見られるようにして、プレイフィールを上げる。

## What
### UI
- `/match` を追加（ローカル対戦ドラフト）
  - Deck A/B を選び、Nyano を mainnet から読み取り
  - 9手分の move を作成（board/cell 選択 + cardIndex 選択 + optional warning mark）
  - transcript を生成し、Replay へ共有（gzip圧縮 URL）
  - 途中経過も盤面/ログとして確認可能（残り手は placeholder で補完して preview）
- ナビ（Play）に Match を追加
- `/arena` から Match を開始できる CTA を追加
- `/decks` から Match へ “Use as A / Use as B” リンクを追加

### Dev
- `deck_store` に `getDeck(id)` を追加（deep link /match?a=... の解決用）

## Verify
- `pnpm -C apps/web dev`
- `/decks` でデッキを作成 → “Use as A/B” で `/match` が開ける
- `/match` で Load Cards → 盤面クリック + カード選択で Commit Move ができる
- 9手確定後に “Copy share URL / Open Replay” が有効になり、Replay で同じ結果が再現できる
