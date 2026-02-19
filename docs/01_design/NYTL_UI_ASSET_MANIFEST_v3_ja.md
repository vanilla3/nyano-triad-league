# NYTL UI Asset Manifest v3（Motion / Background / VFX 強化向け）

この manifest は「参照UIの質感（ガラス/パステル/立体）を再現する」ために、
**あると効く**アセットを整理したもの。

- v2: `docs/01_design/NYTL_UI_ASSET_MANIFEST_v2_ja.md`
- v3: v2 に加えて **Alive Background** と **Particles** を想定した追加分を定義する

> 方針: まずは CSS だけで成立させ、
> 物足りないところだけ “少量のテクスチャ” で底上げする（依存を増やしすぎない）

---

## 0) 命名規則

- 例: `ui_noise_tile_512_v1.png`
  - `purpose`（ui_noise_tile）
  - `size`（512）
  - `version`（v1）

---

## 1) 必須（見た目が伸びやすい最小セット）

※ ここは v2 と同じ。すでにある場合は差し替え品質だけ上げる。

- MAT-001: `ui_noise_tile_512_v1.png`
  - 用途: grain/noise overlay
  - 要件: シームレス、モノクロ、コントラスト弱め

- MAT-002: `ui_sheen_tile_1024_v1.png`
  - 用途: ガラスの “つや”

- MAT-003: `ui_soft_shadow_1024_v1.png`
  - 用途: 影を“絵作り”に寄せる（CSS box-shadow より柔らかく）

---

## 2) Alive Background 追加（あると “死んでない” が作りやすい）

CSS グリッドだけでも成立するが、
「微細ノイズ」や「柔らかい雲/光の溜まり」は画像で作ると綺麗に出る。

- BG-001: `bg_bokeh_soft_1024_v1.png`
  - 用途: 背景の “ふわっ” とした光溜まり（低周波）
  - 要件: 文字を読みにくくしない、輪郭弱め

- BG-002: `bg_sparkle_tile_512_v1.png`
  - 用途: ごく薄いキラ粒（tile）
  - 要件: 透過PNG、白〜淡色、密度低め

---

## 3) Particles 追加（カタルシス用）

粒子は CSS だけでも作れるが、
“かわいい” を保ったまま品質を上げるなら **小さな透過スプライト**が効く。

- FX-001: `fx_particle_star_512_v1.png`
  - 用途: 星粒（回転させて使う）
  - 要件: 太めアウトライン / パステル / 透過PNG

- FX-002: `fx_particle_heart_512_v1.png`
  - 用途: ハート粒（勝利やレア演出寄り）

- FX-003: `fx_confetti_strip_512_v1.png`
  - 用途: 紙吹雪（細長いカケラを複数並べたstrip）

---

## 4) 生成（Gemini）で作る場合

- ガイド: `docs/01_design/NYTL_ASSET_GEN_GEMINI_NANO_BANANA_PRO_v1_ja.md`
- バッチ生成: `scripts/gemini_image_gen.mjs --batch <json>`

v3/v4 の batch JSON を作る場合は `defaults/jobs` 形式に揃えること。

---

## 5) 置き場所

- 暫定: `apps/web/public/assets/gen/`
- 採用: `apps/web/public/assets/ui/`（新設可）

> “採用” したら `mint-theme.css` 側は URL を固定し、
> 旧名の互換（alias）を残すか、段階的に差し替える。
