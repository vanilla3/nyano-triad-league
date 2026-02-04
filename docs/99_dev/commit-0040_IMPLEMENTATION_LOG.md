# commit-0040 IMPLEMENTATION LOG

## What
Twitch配信（AI Nyano 対戦）に向けて、まずは **OBS Overlay** を導入し、
「Matchの進行を視聴者に見せる」土台を作りました。

また、イベントの既定Nyanoデッキ（仮）で tokenId が存在しない場合に備えて、
**mint済み tokenId を自動選択する保険**を追加しました。

## Why
- 配信は “視覚” が生命線。UIが整うと議論もイベントも加速する
- Twitch連携（Bot/Chat）は後からでも足せるが、overlay は早く必要
- Nyanoの tokenId は連番で存在するとは限らないため、サンプルデッキが壊れやすい

## Changes
### Web
- `/overlay` を追加（OBS Browser Source向け）
  - Matchの状態を表示（盤面/ターン/勝敗/AIメモ）
  - BroadcastChannel が無い環境でも localStorage で fallback
- `/stream` を追加（配信者向け導線）
  - challenge link / overlay URL をコピーできる
  - 暫定の運用フローも説明
- Match:
  - overlay へのブロードキャストを追加（best-effort）
  - ボタンから `/overlay` を開ける
  - イベントの仮デッキ（1..5）を検知したら、mint済み tokenId を自動選択

### Docs
- Twitch配信仕様（v1）を追加
- Twitchロードマップ（v1）を追加

## Notes
- Twitch API/Bot は “接続” よりも、まず “コマンド仕様と投票方式” が重要。
  次は Web 側でチャット風入力→試合進行の土台を作る。
