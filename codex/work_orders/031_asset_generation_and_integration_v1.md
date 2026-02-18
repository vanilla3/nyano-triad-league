# WO-031: UI アセット生成 & 統合（Gemini Nano Banana Pro）

## Goal

参考画像の “空気感” を出すために、
背景・柄・ノイズ・キラの **薄いレイヤー**を導入する。

この WO は「画像が無いと動かない」状態を作らない。
**あれば跳ねる**、無ければ CSS だけでも成立する、を守る。

---

## Context

- `apps/web/public/assets/...` がほぼ空
- `scripts/gemini_image_gen.mjs` はある
- 参考画像の決め手は「雲/パターン/ノイズ」と「控えめなキラ」

---

## Tasks

### 1) マニフェストを確認

- `docs/01_design/NYTL_UI_ASSET_MANIFEST_v2_ja.md`

### 2) 生成プロンプト v3 を用意

- `scripts/asset_prompts/nytl_ui_assets.v3.json` を作成（or 更新）
- 生成ターゲット（最低限）:
  - `bg_paw_tile_512.png`
  - `bg_cloud_corners_16x9.png`
  - `tx_noise_256.png`
  - `fx_sparkle_tile_512.png`

### 3) 生成手順をドキュメント化

- 既存: `docs/01_design/NYTL_ASSET_GEN_GEMINI_NANO_BANANA_PRO_v1_ja.md`
- 必要なら v2 を追加し、
  - API key の置き方
  - 生成コマンド
  - 出力先
  - 透過 PNG を前提にする
  を明記する

### 4) CSS にレイヤーとして組み込む

対象:

- `apps/web/src/mint-theme/mint-theme.css`

組み込み候補:

- `.mint-app-shell__bg`
  - `bg_cloud_corners_16x9.png` を最上段（cover）
  - `bg_paw_tile_512.png` を低 opacity の repeat
  - `fx_sparkle_tile_512.png` を `mix-blend-mode: screen`
  - `tx_noise_256.png` を overlay

注意:

- 背景は UI と喧嘩しない強さにする（opacity 控えめ）
- `data-vfx=off` では sparkle を弱める/止める

### 5) 盤面/ボタンにもノイズを“薄く”

- `GlassPanel` / `.mint-ui-pressable` / `.mint-board-frame` などで
  `tx_noise_256.png` を `::after` に薄く載せる（0.05〜0.12）

---

## Acceptance Criteria

- アセットがあると “ゲームの空気感” が上がる
- アセットが無くても UI は崩れない
- 390px / 768px / 1200px で背景がうるさくない

---

## Verification

- `pnpm -C apps/web e2e:mint`
- `/` `/arena` `/decks` `/match?ui=mint` を目視
