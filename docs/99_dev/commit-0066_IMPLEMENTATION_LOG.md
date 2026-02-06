# commit-0066 IMPLEMENTATION LOG

## Summary
- 外部プロトタイプ（RPGテーマ）をコードベースへ追加
- /match /replay に `ui=rpg` のスイッチを追加し、既存UIを壊さずにRPGボードを表示可能に
- Tailwind拡張トークンを追加（任意だが後続の調整が楽）
- ドキュメント（マージノート、タスクボードv2）を追加

## Files
- apps/web/src/components/BoardViewRPG.tsx (new)
- apps/web/src/rpg-theme/rpg-theme.css (new)
- apps/web/rpg-theme/rpg-tailwind-extend.ts (new)
- apps/web/src/pages/Match.tsx (ui=rpg board switch)
- apps/web/src/pages/Replay.tsx (ui=rpg board switch + autoplay維持)
- apps/web/src/index.css (Cinzel font追加)
- apps/web/tailwind.config.ts (RPGトークンをextendへ)
- docs/03_frontend/* (notes)
- docs/99_dev/* (log)
