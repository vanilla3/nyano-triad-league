# Work Order: 028 — Battle Board Material v5（トレイ/セル/厚みの統一）

## Goal

Match（Mint UI）のバトル盤面を、参照画像に寄せて **“置き台感・ボタン感・ガラス感”** を強化する。

ただし「かわいい」より先に **迷わない / 読める / 押した感がある** を優先し、演出過多で情報が埋もれないようにする。

---

## Scope (in)

- `apps/web/src/mint-theme/mint-theme.css`
- バトル盤面: `BoardViewMint.tsx` / `DuelStageMint.tsx` まわりの class に対応する見た目
- 盤面に使う “薄素材” の導入（あれば使う、なければ CSS fallback）

## Out of scope (not now)

- 全ページのボタン統一（MintPressable 全体の刷新）はやらない
- Pixi/WebGL 側の描画変更はやらない
- ルール表示（それは WO-029）

---

## Design targets (what should change)

### 1) ボードトレイが “一段上の板” に見える

- 外枠（frame）: 厚みと柔らかい影
- 内枠（inner）: もう 1 段の凹み + 内側ハイライト
- 光の方向は固定（例: 左上がハイライト、右下が影）

### 2) 空セルが “凹んだスロット” に見える

- セルは **凹み**（inset shadow）と **縁**（rim）と **斜めシーン**（specular）で構成
- selectable 状態は “光る” だけではなく、縁/シーン/影が変わって **触れそう** になる

### 3) 状態の共通言語

- hover / focus: 少し浮く（影が少し増える）
- press: 少し沈む（影が短くなる + 中心が少し暗い）
- selected: 縁が明るく太い + ほんの少しスケール

---

## Implementation plan

### Step 0: 現状確認

- `BoardViewMint.tsx` の class 構造を確認し、CSS の対象を洗い出す
  - `.mint-board-frame`, `.mint-board-inner`, `.mint-cell`, `.mint-cell--flat`, `.mint-cell--selectable`, `.mint-cell--placed` など

### Step 1: Material tokens を追加

`mint-theme.css` の `:root` または Mint theme section に、盤面向けトークンを追加する:

- `--mint-material-noise-url`（任意）
- `--mint-material-sheen-url`（任意）
- `--mint-material-rim`（縁のグラデ）
- `--mint-material-well`（凹みのグラデ）
- `--mint-material-shadow-soft`（大きい影）

画像が無い場合でも破綻しないように、
`url(...)` が使えないときは `linear-gradient(...)` で代替できる形にする。

推奨: `apps/web/public/assets/gen/` の生成物を利用できるようにする

- `assets/gen/ui_noise_tile_512_v1.png`
- `assets/gen/ui_specular_sheen_tile_1024_v1.png`
- `assets/gen/match_cell_well_frame_v1.png`（セル縁の画像、あれば）

※アセットが存在しない場合は CSS fallback で成立させる（必須にしない）。

### Step 2: ボードトレイ（frame/inner）の厚み強化

- `.mint-board-frame`
  - 外側のリムを太く（border/outline ではなく多層 shadow/gradient で）
  - `::before` に斜めシーン（sheen）を入れても良い（`data-vfx=off` で無効化）
- `.mint-board-inner`
  - inset shadow を追加し “内側の凹み” を表現
  - 盤面全体の背景は「薄い」こと（カードより目立たない）

### Step 3: セル（空/選択/配置）の見た目を作り直す

- 空セル（flat）
  - 1) 底（暗い） 2) 縁（明るい） 3) 斜めシーン（薄い） の 3 層にする
  - `box-shadow: inset ...` を中心に凹みを作る

- selectable
  - glow は “やりすぎない”
  - 代わりに縁/シーン/影を変化させて「触れそう」を表現
  - 既存の breathe アニメは **強さを下げ**、情報を邪魔しない形に調整

- placed
  - セルの背景は控えめ（カードが主役）
  - ただし “置けた” 瞬間の反応（ripple/flash）は残す

### Step 4: reduced motion / vfx gating

- `prefers-reduced-motion: reduce` では shimmer/breathe を抑制
- `data-vfx=off/low` では sheen/noise/sparkle を抑制

---

## Optional: Gemini で薄素材を生成

環境変数 `GEMINI_API_KEY` がある場合のみ:

```bash
GEMINI_API_KEY=... node scripts/gemini_image_gen.mjs --batch scripts/asset_prompts/nytl_ui_assets.v3.json
```

生成した画像は `apps/web/public/assets/gen/` に出力される。
この Work Order では **生成に失敗しても OK**（CSS fallback で成立させる）。

---

## Acceptance criteria

1) Match（Mint UI）で盤面を見ると、
   - 盤面の外枠/内枠が “トレイ” として見える
   - 空セルが “凹みスロット” に見える
2) selectable / press / selected の状態が一目で分かる
3) 演出が `prefers-reduced-motion` / `data-vfx` により抑制される
4) `pnpm -C apps/web test && pnpm -C apps/web typecheck && pnpm -C apps/web build` が通る

---

## Notes

- “豪華に見せたい” ほど blur を増やしがちだが、
  低スペック端末で破綻しやすいので **画像（薄素材）+ 影の設計** を優先する。
- 光の方向は統一する（全部がバラバラだと手作り感が出る）。