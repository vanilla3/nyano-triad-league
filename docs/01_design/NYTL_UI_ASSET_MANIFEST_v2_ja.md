# NYTL UI Asset Manifest v2（Mint / Gamefeel）

このマニフェストは、UI を参考画像レベルへ寄せるために
**あると効くアセット**を一覧化したものです。

原則:

- “必須” と “加点” を分ける（まず動く、次に盛る）
- 9-slice（UI を画像で切り抜く）に寄せすぎない（解像度・テーマ変更に弱い）
- ただし **背景の柄** と **粒状ノイズ** は画像が強い（CSSだけだと限界がある）

格納先の提案:

- `apps/web/public/assets/ui/...`（手作り/デザイナー入稿系）
- `apps/web/public/assets/gen/...`（Gemini 生成・量産系）

運用メモ（現在のMint CSS実装）:

- `apps/web/src/mint-theme/mint-theme.css` は `assets/gen` を直接参照する。
- 既定ファイル名:
  - `bg_cloud_corners_16x9_v3.png`
  - `bg_paw_tile_512_v1.png`
  - `fx_sparkle_tile_512_v1.png`
  - `tx_noise_256_v1.png`
  - `slot_inner_shadow_256_v1.png`（任意）
  - `board_tray_tex_1024_v1.png`（任意）

---

## 1) 必須（これがないと“のっぺり”に見える）

### BG-001: Paw pattern tile

- 目的: 背景に “Nyano らしさ” を足す（密度は低め）
- 形式: PNG（透過）
- サイズ: 512x512（tile）
- パス: `apps/web/public/assets/ui/bg_paw_tile_512.png`
- 運用: CSS の `background-repeat: repeat` で敷く（opacity 0.06〜0.12）

### BG-002: Cloud corners / sky layer

- 目的: 画面上部/下部の “ゲームっぽいフレーム感”
- 形式: PNG（透過）
- サイズ: 1920x1080 or 2048x1152（16:9）
- パス: `apps/web/public/assets/ui/bg_cloud_corners_16x9.png`
- 運用: `background-position: center` / `cover` で 1枚貼り

### TX-001: Subtle noise tile

- 目的: ガラス/グラデのバンディングを消し、質感を上げる
- 形式: PNG（透過）
- サイズ: 256x256（tile）
- パス: `apps/web/public/assets/ui/tx_noise_256.png`
- 運用: panel/button の `::after` に `mix-blend-mode: overlay` / opacity 0.08

---

## 2) 加点（あると一気に“プロ感”が出る）

### FX-001: Sparkle tile / stickers

- 目的: 背景に星/キラを薄く漂わせる（参考画像のニュアンス）
- 形式: PNG（透過）
- サイズ: 512x512（tile）
- パス: `apps/web/public/assets/ui/fx_sparkle_tile_512.png`
- 運用: `mix-blend-mode: screen` / opacity 0.10〜0.22

### UI-001: Glass sheen overlay（任意）

- 目的: ボタンやパネルに “艶の筋” を足す（CSSでも代替可）
- 形式: PNG（透過）
- サイズ: 512x256
- パス: `apps/web/public/assets/ui/ui_glass_sheen_512x256.png`

### BD-001: Board tray texture（任意）

- 目的: 盤面の外周/トレイを「玩具っぽい質感」に寄せる
- 形式: PNG（透過）
- サイズ: 1024x1024
- パス: `apps/web/public/assets/ui/board_tray_tex_1024.png`

### BD-002: Slot inner shadow overlay（任意）

- 目的: 空セルを “凹み” に見せる内側影（CSSでも可）
- 形式: PNG（透過）
- サイズ: 256x256
- パス: `apps/web/public/assets/ui/slot_inner_shadow_256.png`

---

## 3) 画面別おすすめセット

### Home / Arena

- BG-001 / BG-002 / FX-001
- TX-001（背景のバンディング対策）

### Decks（図鑑/デッキ）

- TX-001（パネル/ボタン/カード枠）
- UI-001（艶、必要なら）

### Match（盤面）

- BD-001 / BD-002（盤面の“玩具っぽさ”）
- TX-001

---

## 4) 生成するなら（Gemini）

`scripts/asset_prompts/nytl_ui_assets.v3.json` を参照。

---

## 5) 注意点

- 背景が強すぎるとカードが死ぬ。**opacity 低め + ぼかし気味**が基本
- ノイズは “見える” まで入れると安っぽい。**感じる程度**で止める
- 画像を増やすほどネットワーク/初回ロードが重くなる。小さな tile を再利用する
