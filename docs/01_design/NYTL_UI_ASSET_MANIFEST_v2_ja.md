# NYTL UI Asset Manifest v2（Battle Board / Material 強化版）

> v1: `docs/01_design/NYTL_UI_ASSET_MANIFEST_v1_ja.md`
>
> v2 は「盤面の質感（ガラス/ボタン感）」を一段上げるための追加リストです。
> **画像がなくても CSS fallback で成立**する設計を前提にしています。

---

## 0) 共有ルール（推奨）

- 形式: PNG（透過）または WEBP（透過）
- 文字は入れない（多言語対応と差し替えを楽にする）
- コントラストは低め（UI の“主役”にならない）

---

## 1) Material（質感）を作るための“薄素材”

### MAT-001: UI Noise Tile（極薄ノイズ・タイル）

- 用途: ベタ塗り回避。パネル/セル/ボタンの表面に 2〜6% で重ねる
- サイズ: 512×512（シームレス）
- 形式: PNG（透過）
- 実装: `background-image` の最上段に `url(...)` を追加

### MAT-002: Specular Sheen Tile（斜めの光・タイル）

- 用途: “ガラスっぽさ” の決め手。斜めシーンを薄く重ねる
- サイズ: 1024×1024（できればシームレス）
- 形式: PNG（透過）
- 実装: `::before` で `mix-blend-mode: screen` + opacity 0.08〜0.16

### MAT-003: Soft Shadow Blob（淡い影のにじみ）

- 用途: 盤面トレイや大きなパネルを “置いた感” にする
- サイズ: 1024×1024（単体で OK）
- 形式: PNG（透過）
- 実装: `::after` で敷く（filter/blur は避け、画像で持つ）

---

## 2) Match 盤面（トレイ/セル）

### MATCH-004: Board Tray Overlay（盤面トレイの表面）

- 用途: 盤面全体の “厚み + 透明感” を固定で担保
- サイズ: 1024×768（4:3）
- 形式: PNG（透過）
- 備考: 中央は空ける。縁のハイライトだけ描く

### MATCH-005: Cell Well Frame（セルの凹みフレーム）

- 用途: 空セルを「置き台」に見せる（凹み + 内側ハイライト）
- サイズ: 256×256
- 形式: PNG（透過）

### MATCH-006: Cell Corner Sparkle（セルの角きらめき）

- 用途: selectable 状態の “かわいい反応” を作る（過剰に点滅させない）
- サイズ: 128×128
- 形式: PNG（透過）
- 実装: `data-vfx=high` の時だけ

---

## 3) 生成プロンプト叩き台（Gemini 向け）

> 生成は `scripts/gemini_image_gen.mjs` と batch JSON を使用。

- MAT-001:
  - `very subtle seamless noise texture, fine film grain, low contrast, transparent background, tileable, no text`
- MAT-002:
  - `soft diagonal specular highlight overlay, subtle, transparent background, no text, tileable`
- MAT-003:
  - `soft shadow blob overlay, very subtle, transparent background, no text`

---

## 4) 実装メモ

- 画像が存在しない場合は CSS だけで成立するように作る（必須アセットにしない）
- `prefers-reduced-motion` と `data-vfx` で粒子/シーン/グローを段階的に抑制する
