# commit-0033 — Implementation Log（差分）

## Why
- “機能”から“ゲーム”に寄せるには、対戦の入口が増えても迷子にならないことが重要。
- イベント運用の観点で、PvP だけでなく **AIキャラ（Nyano）** と戦える形を早期に仕込んでおくと強い。

## What
- Match に Opponent Mode を追加：
  - Human vs Human（両方手動）
  - Vs Nyano（AIがBを操作）
- AIはクライアント内で動作（サーバ不要）
- difficulty を2段階（Easy/Normal）
- warning mark の残数を表示し、上限（3回）をUIで抑止
- ドキュメント：Game UI Spec / Implementation Plan に AI・イベント観点を追記
- AI Opponent Spec v1（Draft）を追加

## Verify
- `pnpm -C apps/web dev`
- `/match` で Vs Nyano を選択し、Nyano手番が自動で進む
- 9手確定後に share URL を生成し `/replay` で再現できる
