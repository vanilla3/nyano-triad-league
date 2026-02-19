# WO-032: Battle Board Material v6 (Buttons / Panels)

## ゴール

Match画面を中心に、Mintテーマの「ボタン・パネル・カプセル」類を **モバイルゲーム品質（ぷにっと立体・ガラス感・陰影の説得力）**へ引き上げる。

- 参考: `docs/01_design/reference_ui/*.png`
- ただし **視認性・誤タップ耐性** を最優先（見た目を盛って壊すのは禁止）。

## 現状の前提（確認してから着手）

- `MintPressable`:
  - `apps/web/src/components/mint/MintPressable.tsx`
  - CSSは `.mint-ui-pressable`（`apps/web/src/mint-theme/mint-theme.css`）
- `GlassPanel`:
  - `apps/web/src/components/mint/GlassPanel.tsx`
- Matchの主要UI:
  - `apps/web/src/components/BattleTopHudMint.tsx`
  - `apps/web/src/components/BattleHudMint.tsx`
  - `apps/web/src/components/PlayerSidePanelMint.tsx`

## 変更方針（Sakurai lens）

1. **押せるものは押せると分かる**（縁・厚み・ハイライト）
2. **押した瞬間に必ず反応する**（100ms以内の視覚反応が理想）
3. **誤タップしにくい**（ターゲットサイズ & 間隔）
4. **状態が分かる**（hover / active / disabled / focus）
5. **派手さよりも可読性**（テキストが読めないボタンは破綻）

## 実装タスク

### 1) “立体の3層”を標準化する

`.mint-ui-pressable` を以下の3層で設計し直す（CSSのみでOK）:

- **Base**: 本体のグラデ + ノイズ（薄め）
- **Rim**: 外周の縁取り（上は明るく、下は僅かに暗く）
- **Specular**: 上部に薄いハイライト（ガラスの反射）

要件:
- `::before` / `::after` を使って層を分離
- `border-radius` と `outline` は統一（ボタンごとにバラけない）
- `data-vfx=low/off` では blur / 影 / 光彩を軽量化

### 2) 押下の物理感（沈み込み）を作る

- `:active`（または `[data-pressed=true]`）で
  - `translateY(1px)` + `scale(0.99)`
  - drop shadowを短く（沈む）
  - specular を少し弱める

- hover（マウス時のみ）で
  - `translateY(-1px)`
  - specular を少し強める

※タッチ環境では hover を強くし過ぎない。

### 3) トーン設計を整理する

`MintPressable` の `tone`:
- `primary`
- `soft`
- `danger`（今後）
- `ghost`（今後）

要件:
- toneごとに「ベース色」「縁の色」「テキストコントラスト」を定義
- `primary` は“迷ったら押すべきボタン”として最も目立つ
- `soft` は背景に溶けるが、押せることは分かる

### 4) タップ領域と可読性の規約化

- 最低タップ領域の目安
  - iOS: 44pt × 44pt
  - Android: 48dp × 48dp

上を満たすように **最低高さ**を確保し、近接ボタンの間隔も確保する。

- 背景に対してテキストが沈まないよう、
  - `text-shadow`（弱め）
  - `font-weight` と `letter-spacing` を調整

### 5) Match固有UIの“質感”を揃える

- `.mint-top-hud__capsule`
- `.mint-hud` / `.mint-hud__primary` / `.mint-hud__secondary`
- サイドパネル

上記がボタンと“同じマテリアル哲学”に見えるよう、
影の方向・縁の明暗・ノイズ密度を合わせる。

## 追加アセット（必要なら）

CSSだけで足りない場合のみ。足りていれば作らない。

- `apps/web/public/assets/gen/ui_sheen_soft_512_v1.png`
  - 用途: 上面の反射（アルファ）
- `apps/web/public/assets/gen/ui_rim_highlight_512_v1.png`
  - 用途: 縁の立体（アルファ）

生成する場合は `scripts/gemini_image_gen.mjs` を利用し、
プロンプトは `scripts/asset_prompts/nytl_ui_assets.v2.json`（WO-032で新規作成してよい）に追記。

## 受け入れ基準

- 参考UIと同系統の「ぷにっとした立体感」になっている
- 押下状態が明確（沈む / 影が変わる）
- `data-vfx=off` で重い表現がほぼ消える
- 小さい端末でも誤タップしにくい（最小タップ領域）
- `pnpm -C apps/web lint && pnpm -C apps/web build` が通る

## チェックリスト（手動）

- Homeの「すぐ遊ぶ」ボタン：最重要ボタンに見える
- Matchの各ボタン：押すと沈む、離すと戻る
- disabled/aria-disabled：見た目が破綻しない
- focus-visible：キーボード操作で輪郭が追える
