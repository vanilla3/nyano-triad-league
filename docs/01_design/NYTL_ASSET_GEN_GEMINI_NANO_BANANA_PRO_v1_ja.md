# NYTL Asset Generation — Gemini Nano Banana Pro（Preview）導入ガイド v1

> 目的: UI の試作・高速改善のために、背景/アイコン/装飾などの「仮アセット」を生成できるパイプラインを用意する。
>
> 注意: 生成物は “最終アセット確定” ではない。品質/ライセンス/表現の最終確認は別途。

---

## 1) 使うモデル（想定）

- Nano Banana Pro（Preview）: `gemini-3-pro-image-preview`
  - 高解像度（最大 4K）と複雑指示向き
- Nano Banana: `gemini-2.5-flash-image`
  - 速度/コスト優先（1024px中心）

## 2) 必要なもの

- Gemini API キー（環境変数）
  - `GEMINI_API_KEY`

※ キーはリポジトリにコミットしない。

---

## 3) スクリプトの使い方

### 3.1 単発生成（1アセット）

```bash
GEMINI_API_KEY=... node scripts/gemini_image_gen.mjs \
  --model gemini-3-pro-image-preview \
  --prompt "soft pastel line icon of crossed swords, cute mobile game UI style, thick outline, no text" \
  --aspect 1:1 \
  --size 1K \
  --out apps/web/public/assets/gen/icon_swords_v1.png
```

### 3.2 バッチ生成（複数アセット）

```bash
GEMINI_API_KEY=... node scripts/gemini_image_gen.mjs \
  --batch scripts/asset_prompts/nytl_ui_assets.v1.json
```

---

## 4) プロンプトの基本方針（UI向け）

### 4.1 “統一感” を出すキーワード

- soft pastel
- glassmorphism / glossy
- thick outline
- cute mobile game UI icon
- no text / no letters
- simple shapes

### 4.2 NG（崩れやすい）

- 文字入り（ローカライズで破綻しやすい）
- 背景が複雑すぎる（UI と喧嘩する）

---

## 5) 出力の置き場

- 生成物（暫定）: `apps/web/public/assets/gen/`
- 後で採用する場合: `apps/web/public/assets/ui/` など “管理対象” へ移動し、
  命名規則（purpose_size_v）を揃える。

---

## 6) 運用メモ

- 生成はネットワークアクセスが必要。
- `prefers-reduced-motion` / `data-vfx` のように、
  “演出は切れる” ことを前提に UI を作る。


---

## 7) 重要: ウォーターマーク（SynthID）について

Gemini の画像生成は、生成画像に SynthID ウォーターマークが付与される。
（視覚的に目立たない可能性はあるが、生成物であることの識別情報が埋め込まれる）

- プロトタイプ用途: OK
- 商用/最終アセット: 方針を決めてから採用（必要なら手描き/自前アセットへ置換）
