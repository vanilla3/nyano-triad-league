# commit-0050 IMPLEMENTATION LOG

## What
- Triad League → nyano-warudo の snapshot 送信（POST /v1/snapshots）を追加
  - kind=ai_prompt（盤面/合法手/目的を文章化）
  - kind=state_json（state + protocolV1 + legalMoves を stringified JSON として送る）
- Stream Studio に "Nyano Warudo Bridge" パネルを追加
  - Base URL 設定（localStorage + env）
  - manual send / copy
  - auto: vote start → ai_prompt, vote end → state_json（任意）
- OverlayStateV1 に `protocolV1`（header + committed turns）を追加し、/match /replay から送信
- 視聴者提案の型（canonical）を決定し、parser を拡張
  - `#triad A2->B2 wm=C1` を parse
  - 既存 `!move 4 2 wm=6` も引き続き対応

## Why
nyano-warudo 側で Puzzle Show のトリガーにするには、Triad League 側から “状態を送る” のが最短です。  
運用上は「視聴者が迷わない短い型」と「配信者が事故らないUI」が鍵なので、
- 送信は Stream Studio に集約し
- content は prompt/JSON の両方を用意し
- フォーマットは正規表現で拾いやすい形に寄せました。fileciteturn1file0

## Manual test checklist
- /stream を開く → Nyano Warudo Bridge に baseUrl を設定
- Send ai_prompt / Send state_json が通る（HTTP 200 or nyano-warudo 側ログ確認）
- /match を進めると state.protocolV1.turns が増える
- chatText に `#triad A2->B2 wm=C1` を入れて parse できる
