# WO-045: Assets差し替え + Board/Buttons 質感チューニング v1

目的:
- 参照UIの “ガラス/ぷに/厚み” を出すために必要な **微細テクスチャ**を本物に差し替え、
  ボード/ボタンの質感を 1 段引き上げる。
- ただし「重い動画貼り」には逃げず、現行の軽量方針（CSS + タイル素材 + 擬似シェーダー）を維持する。

---

## 1) 現状

- `apps/web/public/assets/gen/*.png` が placeholder（68 bytes）で、実質的に質感が出ない。
- Mint UI はすでに CSS 変数でテクスチャ参照しているため、**差し替えだけで見た目が上がる構造**になっている。

---

## 2) 対象アセット（最低限 / まずここだけ）

以下は現行コードで参照されている（または参照候補）なので、差し替えると効きます。

### P0（必須）
- `apps/web/public/assets/gen/tx_noise_256_v1.png`
  - 256x256 / seamless / モノクロ微細ノイズ（強すぎない）
- `apps/web/public/assets/gen/slot_inner_shadow_256_v1.png`
  - 256x256 / seamless / 内側に溜まる柔らかい影（角丸に馴染む）
- `apps/web/public/assets/gen/fx_sparkle_tile_512_v1.png`
  - 512x512 / seamless / 透明背景 / きらめき粒（控えめ）
- `apps/web/public/assets/gen/board_tray_tex_1024_v1.png`
  - 1024x1024 / seamless / 盤面トレイ用（ガラス+微細粒子+淡い色ムラ）
- `apps/web/public/assets/gen/bg_paw_tile_512_v1.png`
  - 512x512 / seamless / 透明背景 / 肉球パターン（密度低め）
- `apps/web/public/assets/gen/bg_cloud_corners_16x9_v3.png`
  - 1920x1080 相当（16:9）/ 透明背景 / 角の雲フレーム（薄め）

### P1（任意・次に効く）
- `apps/web/public/assets/gen/ui_sheen_soft_512_v1.png`（未使用なら追加してOK）
  - 512x512 / 透明背景 / 柔らかい光スイープ
- `apps/web/public/assets/gen/ui_rim_highlight_512_v1.png`（未使用なら追加してOK）
  - 512x512 / 透明背景 / リムライト（ガラス縁の反射）

---

## 3) 生成/差し替え手順（Gemini）

- 既存: `scripts/gemini_image_gen.mjs`
- 既存/追加のプロンプト雛形:
  - `scripts/asset_prompts/nytl_ui_assets.v5_board_buttons.json`
  - `scripts/asset_prompts/nytl_ui_assets.v4_particles.json`

  - `scripts/asset_prompts/nytl_ui_assets.v4_particles.json`
  - `docs/01_design/NYTL_ASSET_GEN_GEMINI_NANO_BANANA_PRO_v1_ja.md`

手順案:
1. 上記ファイル名で出力し、`apps/web/public/assets/gen/` を上書き
2. 見た目が強すぎる場合は “コントラスト/密度/彩度” を下げる（UIは薄味が強い）
3. `prefers-reduced-motion` でも成立するよう、素材だけで品が出る方向へ

---

## 4) CSSチューニング（素材が入った後に微調整）

対象:
- `apps/web/src/mint-theme/mint-theme.css`
- `apps/web/src/components/mint/MintGameShell.tsx`（背景レイヤー）

調整ポイント:
- ノイズは「**見えるか見えないか**」の境界へ（opacity 0.03〜0.08 程度の感覚）
- 影は “黒” ではなく “冷たい影”（青〜紫寄り）に寄せる（ただしやりすぎない）
- ボタンの光スイープは頻度を下げ、押下時だけ少し強くして “触ってる感” を作る

---

## 5) 受け入れ条件（Acceptance）

- placeholder 画像が実素材に置き換わり、ボード/ボタンの質感が目視で改善
- 素材が無い/失敗しても UI が破綻しない（CSS fallback が機能）
- パフォーマンスが悪化しない（タイル素材 + CSS のまま）

---

## 6) 追加（任意）

- `docs/01_design/NYTL_UI_ASSET_MANIFEST_v4_board_buttons_v1_ja.md` を作り、
  「必要素材と目的」を 1ページにまとめる（今後の更新が楽になる）

---

## Execution Status (2026-02-20)

- Status: `Completed`
- Completed in this step:
  - Implemented code-side material channels in Mint shell (`cloud corners` + `paw tile`) with fallback-friendly layering and VFX/reduced-motion guardrails.
  - Replaced placeholder textures with production-sized assets in `apps/web/public/assets/gen/`:
    - `tx_noise_256_v1.png` (256x256)
    - `slot_inner_shadow_256_v1.png` (256x256)
    - `fx_sparkle_tile_512_v1.png` (512x512)
    - `board_tray_tex_1024_v1.png` (1024x1024)
    - `bg_paw_tile_512_v1.png` (512x512)
    - `bg_cloud_corners_16x9_v3.png` (1920x1080)
  - Added optional P1 assets and wired usage for button-material polish:
    - `ui_sheen_soft_512_v1.png` (512x512)
    - `ui_rim_highlight_512_v1.png` (512x512)
    - `apps/web/src/mint-theme/mint-theme.css`: `--mint-material-ui-sheen-url` / `--mint-material-ui-rim-url` and fallback-backed application on `.mint-share-action__btn`.
  - Verified with `pnpm.cmd lint:text` / `pnpm.cmd -C apps/web lint` / `pnpm.cmd -C apps/web typecheck` / `pnpm.cmd -C apps/web test --` / `pnpm.cmd -C apps/web build`.
- Remaining:
  - None for WO-045 v1.
