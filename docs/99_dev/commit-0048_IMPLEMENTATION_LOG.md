# commit-0048 IMPLEMENTATION LOG

## What
- triad-engine:
  - `TurnSummary.flipTraces` を追加（per-flip）
  - flipが起きた瞬間に (from/to, DIRECT/CHAIN, DIAG, JANKEN, aVal/dVal) を記録
- web:
  - /match, /replay から overlay bus へ flip traces を転送
  - /overlay で flip traces を表示（controls=1 のときのみ）
  - 盤面ハイライトは trace を優先（diff推定はfallback）

## Why
配信（Twitch/OBS）は「理解できる＝盛り上がる」が直結します。  
flip×N だけでは説明が難しい場面があるため、まずは **最小の“根拠”** を出せるようにしました。  
詳細は配信者だけが見えるように **段階的開示**（controls=1）にしています。fileciteturn1file0

## Manual test checklist
- pnpm -C packages/triad-engine test
- /match で 2手以上進める → /overlay?controls=1
  - Flip traces が出る
  - DIRECT/CHAIN/DIAG/JANKEN と aVal/dVal が確認できる
