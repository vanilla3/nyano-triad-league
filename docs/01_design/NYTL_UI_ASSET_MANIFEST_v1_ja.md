# NYTL UI Asset Manifest v1（作ると“ゲームっぽさ”が一段上がる画像/素材一覧）

> 目的: Mint UI を参照画像の「かわいさ・ゲーム感」に寄せるため、
> **必要になりやすいアセットを先に棚卸し**しておく。
>
> 注意:
> - ここでのアセットは “必須” ではない。多くは CSS/SVG で代替可能。
> - ただし「雲」「肉球パターン」「装飾ステッカー」などは **画像があると一気に良くなる**。
> - 画像生成（Gemini）を使う場合は `docs/01_design/NYTL_ASSET_GEN_GEMINI_NANO_BANANA_PRO_v1_ja.md` を参照。

---

## 0) 共有ルール（推奨仕様）

### 形式
- 可能なら **SVG**（アイコン・線画・バッジ）
- 背景/テクスチャは **PNG**（透過あり）または **WEBP**（透過あり）

### サイジングの基準
- アイコン: 256×256（正方形、透過）
- バッジ/ピル: 512×256（横長、透過）
- 背景: 1920×1080（16:9）/ 1536×1024（3:2）
- パターン: 512×512（シームレス）

### 命名規則（例）
- `apps/web/public/assets/ui/<category>/<name>_<size>_v1.png`
  - 例: `assets/ui/bg/paw_pattern_512_v1.png`

---

## 1) 背景（BG）系

### BG-001: Pastel sky gradient base
- 用途: 画面全体の下地（空グラデ）
- 推奨: CSS で十分（画像は任意）
- 形式: PNG/WEBP（任意）
- サイズ: 1920×1080

### BG-002: Cloud corners overlay（雲の角飾り）
- 用途: Home/Arena/Match の “ゲーム画面感” を上げる
- 形式: PNG（透過）
- サイズ: 1920×1080
- 備考: 四隅に薄い雲、中央は空ける

### BG-003: Paw pattern tile（肉球パターン・タイル）
- 用途: 背景にうっすら敷く（opacity 3〜8%）
- 形式: PNG（透過）
- サイズ: 512×512（シームレス）

### BG-004: Sparkle/bokeh texture（きらめき粒子）
- 用途: 背景の“密度”を上げる
- 形式: PNG（透過）
- サイズ: 1024×1024

---

## 2) ロゴ/見出し装飾

### LOGO-001: Crown sticker（王冠）
- 用途: Nyano Triad League ロゴの上に乗せる
- 形式: SVG 推奨 / PNG 透過
- サイズ: 256×256

### LOGO-002: Paw sticker（肉球）
- 用途: ロゴ周辺のアクセント
- 形式: SVG/PNG
- サイズ: 256×256

---

## 3) ナビ/ボタン用アイコン（MintIcon 拡張候補）

> 既存の `MintIcon` は SVG 実装なので、基本は画像ではなく **SVG を追加**するのが推奨。
> ただし “線画パステル統一” を崩さないこと。

### ICON-001: Decks
### ICON-002: Arena
### ICON-003: Match
### ICON-004: Replay
### ICON-005: Stream
### ICON-006: Events
### ICON-007: Settings
### ICON-008: Rules / Rulebook

- 形式: SVG
- 目標: 24px/32px/48px で綺麗に見える

---

## 4) Match 画面（盤面/HUD）

### MATCH-001: Board tray background（盤面トレイ）
- 用途: 盤面の “置き台” 感
- 形式: PNG（透過）
- サイズ: 1024×768
- 備考: 角丸 + 透明ガラス + 内側ハイライト

### MATCH-002: Cell frame（セル枠）
- 用途: 各セルの “凹み” 表現
- 形式: PNG（透過）
- サイズ: 256×256

### MATCH-003: Prompt bubble（次アクション指示の吹き出し）
- 用途: “次に押すべき” を気持ちよく
- 形式: PNG（透過）または CSS
- サイズ: 1024×256

---

## 5) バッジ/ステッカー

### BADGE-001: DONE
- 用途: Onboarding の完了
- 形式: SVG/PNG
- サイズ: 256×128

### BADGE-002: NEW / BETA
- 用途: Classic Rules などの新要素
- 形式: SVG/PNG
- サイズ: 256×128

---

## 6) 生成に使うプロンプトの叩き台（Gemini向け）

> 文字は入れない（ローカライズ破綻を防ぐ）。

- 雲角飾り:
  - `soft pastel cloud corner overlay, kawaii mobile game UI background, translucent, subtle sparkles, no text, transparent background, high resolution`
- 肉球パターン:
  - `seamless paw print pattern, cute pastel outline, very subtle, transparent background, tileable, no text`
- きらめき:
  - `sparkle bokeh overlay texture, pastel, subtle, transparent background, no text`

---

## 7) 実装メモ（画像が無くても破綻しない）

- 画像が存在しない場合は CSS fallback を使う（gradients / pseudo-elements）
- 画像を使う場合も `prefers-reduced-motion` / `data-vfx=off` で
  - 粒子/きらめきレイヤーを消せる

