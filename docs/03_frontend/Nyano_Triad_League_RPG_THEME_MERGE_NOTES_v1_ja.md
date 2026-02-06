# RPGテーマ（プロトタイプ）マージノート v1（JA）

このドキュメントは、外部プロトタイプ（`files (21).zip`）を Nyano Triad League に安全に取り込むための要点整理です。

---

## 何を取り込んだか
- `BoardViewRPG.tsx`
  - `.rpg-*` クラスを使った “ファンタジーRPG” 風ボード/UI（ロウソク/木枠/石床/HP風HUD/ログ/結果オーバーレイ）
  - **既存の BoardView と併用できる**（置き換えではなく、`ui=rpg` の時だけ使用する運用にする）
- `rpg-theme.css`
  - `.rpg-*` に限定されたCSS（既存UIへの衝突は基本起きにくい）
- `rpg-tailwind-extend.ts`
  - Tailwind の extend 用トークン（任意だが入れておくと後続の微調整が楽）
- プレビュー（.jsx）と統合ガイド（md）
  - そのまま `docs/` に保管し、デザイン議論のベースにする

---

## 使い方（確認手順）
- `/match?ui=rpg`
- `/replay?ui=rpg`

上記で **RPGボード** が表示されます。通常のURLでは従来UIのままです。

---

## 既知の注意点（これから詰める）
- 現状は「盤面表示の一部」にRPGボードを差し込んでいるだけなので、ページ全体の統一感はまだ出ていません。
- “完全RPG化” するには
  1) `Match.tsx` の入力（配置UI）を BoardViewRPG / HandDisplayRPG 側へ寄せる  
  2) 結果表示・ログ・手札表示を一体化する  
  の2段が必要です（TODOに切り出し済み）。
