# WO-030: 図鑑（CardBrowser）を Mint UI に統一する

## Goal

`/decks` 内のカードブラウザ（図鑑）を、
参考画像の Deck Builder の雰囲気に近づける。

狙い:

- フィルタ/検索が “触って分かる”
- カードが主役で、UI が邪魔しない
- Mint テーマと一体化し、画面の質感が揃う

---

## Context

`apps/web/src/components/CardBrowser.tsx` は Tailwind 直書きで、
Mint UI（`GlassPanel` / `MintPressable`）から浮いて見える。

---

## Tasks

### 1) デザイン spec を読む

- `docs/01_design/NYTL_GAME_UI_QUALITY_PRINCIPLES_SAKURAI_LENS_v1_ja.md`
- `docs/01_design/NYTL_MINT_MATERIAL_SPEC_v1_ja.md`

### 2) “Mint 版 CardBrowser” を作る方針を選ぶ

推奨: 段階的移行

- `CardBrowser.tsx` のロジックは温存
- UI 部分だけ `CardBrowserMint.tsx` に分離
- `Decks.tsx` からは `CardBrowserMint` を呼ぶ

理由:

- ロジック改変を最小化できる
- UI を差し替えても、カード選択や deck 更新が壊れにくい

### 3) Mint UI コンポーネントを適用

最低限:

- フィルタボタン群 → `MintPressable`（pill variant）
- `<select>` → Mint 風にスタイル（ネイティブでも良い）
- “Load More” → `MintPressable` primary/soft

追加（加点）:

- 検索 input（カード名/ID/属性）
- 現在フィルタ状態の “chips summary”

### 4) レイアウトを参考画像寄りに

Decks 画面は既に 3カラム構成があるので、

- 左: Stats / Filter
- 中: カードグリッド
- 右: Deck Summary

の階層を “材質” で分ける。

### 5) レスポンシブ

- 390px: 1カラム（Stats → Filter → Grid → Summary の順）
- 768px: 2カラム（Stats/Filter + Grid、Summary は下 or 右）
- 1200px: 3カラム

---

## Acceptance Criteria

- 図鑑 UI のボタン/チップが Mint で統一される
- フィルタ状態が一目で分かる
- 390px 幅で破綻しない（横スクロールなし）

---

## Verification

- `pnpm -C apps/web e2e:mint`
- `/decks?ui=mint` を 390px / 768px / 1200px で目視
