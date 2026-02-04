# commit-0034 — Implementation Log（差分）

## Why
- “機能”から“ゲーム”に寄せるには、イベント運用を前提にした導線が必要。
- AIキャラ Nyano 対戦は「いつでも挑める固定の熱源」になり、コミュニティが自走しやすい。
- そのために、イベント条件を固定しつつ、参加者が迷わず挑戦できる UI と URL を整備する。

## What
### UI
- `/events` を追加：公式イベント一覧（v1）
- Nav に Events を追加
- Arena から Events / Nyano Open Challenge へ導線追加
- Match に event パラメータ対応（`/match?event=<id>`）
  - Event 中は対戦条件を固定（ruleset/season/firstPlayer/ai difficulty）
  - Deck B はイベントの Nyano deck を使用（固定表示）

### URL
- Match 設定を query に載せる準備（opp/ai/auto/rk/season/fp）
  - Event では固定のため disabled

### Docs
- Game UI Spec に Events の位置付けを追記
- Events Spec v1（Draft）を追加
- Implementation Plan に Phase 2b（Events）を追記

## Verify
- `pnpm -C apps/web dev`
- `/events` が表示される
- Nyano Open Challenge → `/match?event=nyano-open-challenge`
- Event 条件が固定され、Deck B がイベントデッキになる
- 9手確定で share URL を生成し `/replay` で再現できる
