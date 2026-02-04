# commit-0042 IMPLEMENTATION LOG

## What
Twitch配信の次段階として、**Nyano vs Chat** の最小プロトタイプを実装しました。

- `/stream` に **投票コンソール（chat simulation）** を追加
- `/match?stream=1` が **stream command bus** を購読し、投票結果の move を適用
- “秘密情報をブラウザに置かない” ため、Twitch API 連携はまだ入れず、まず **ゲーム側インターフェース（コマンド）** を固定しました

## Why
UIの観点では、最も重要なのは「次に何をすれば良いか」が迷わないことです。  
配信では “実況・解説” が発生するため、入力系は **手順が短く、状態が一目で分かる** ことが価値になります。fileciteturn1file0

また、運営が不在でも回る状態を目指すなら、インフラ依存を薄くしつつ、
コミュニティが “自走できる型” をアプリ側で先に作るのが合理的です。

## Notes / Design decisions
- stream command は **opt-in（stream=1）**。通常プレイを壊さない
- turn mismatch / hand mismatch は無視（誤適用防止）
- Nyano AI（vs_nyano_ai）の Nyano側は上書き禁止
- command bus は `BroadcastChannel` 優先、fallback は `localStorage`

## Manual test checklist
- `/stream` を開く（別タブ推奨）
- `Host match (stream)` で `/match?stream=1` を開く
- Matchで Deck A/B を選んで Load Cards
- A turn のとき `/stream` で Start vote → Add vote → End & send
- Match側で手がコミットされ、overlayが更新される
