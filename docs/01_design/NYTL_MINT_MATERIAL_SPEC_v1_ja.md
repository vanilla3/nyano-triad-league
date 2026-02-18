# NYTL Mint Material Spec v1（Buttons / Panels / Chips）

目的: 参考画像のような「ぷっくり・ガラス・やわらかい樹脂」質感を、
**CSS主体**で再現できるようにする。

この spec は「見た目の好み」ではなく、
**再現性のある構造（レイヤー）**として定義します。

---

## 1. Material を作る最小構成

### 1.1 必要なレイヤー（最低5層）

1) **Base shadow**（外側影）
2) **Rim**（外縁の輪郭）
3) **Face**（面: グラデーション）
4) **Inner highlight**（内側の白縁/反射）
5) **Specular**（艶: 上部ハイライト）

加点:

6) **Grain / Noise**（粒状: バンディング防止 + 質感）
7) **Tint glow**（淡い色光: アクションの “かわいさ”）

---

## 2. `MintPressable` の構造（推奨）

### 2.1 HTML（変えなくて良い）

`MintPressable` は 1要素で良い。
レイヤーは `::before` / `::after` と `box-shadow` で作る。

### 2.2 CSS変数（例）

```
--mint-surface-radius: 16px;
--mint-surface-border: rgba(255,255,255,0.75);
--mint-surface-border-2: rgba(148,163,184,0.18);
--mint-surface-face-a: rgba(255,255,255,0.82);
--mint-surface-face-b: rgba(229,244,255,0.62);
--mint-surface-shadow: 0 18px 30px -24px rgba(15,23,42,0.75);
--mint-surface-shadow-press: 0 10px 18px -18px rgba(15,23,42,0.65);
--mint-surface-glow: rgba(56,189,248,0.18);
```

ポイント:

- border は **1本ではなく2本**（外縁 + 内縁）
- face は **上/下で色相差**を付ける（白→薄青など）
- shadow は hover/active で潰す（沈む感）

### 2.3 推奨レシピ（擬似コード）

```
.mint-ui-pressable {
  border-radius: var(--mint-surface-radius);
  border: 2px solid var(--mint-surface-border);
  background: linear-gradient(180deg, var(--mint-surface-face-a), var(--mint-surface-face-b));
  box-shadow:
    var(--mint-surface-shadow),
    inset 0 1px 0 rgba(255,255,255,0.9),
    inset 0 -8px 16px rgba(2,132,199,0.06);
  position: relative;
  isolation: isolate;
}

.mint-ui-pressable::before {
  content: "";
  position: absolute;
  inset: 2px;
  border-radius: calc(var(--mint-surface-radius) - 2px);
  border: 1px solid var(--mint-surface-border-2);
  background: linear-gradient(180deg, rgba(255,255,255,0.35), transparent 45%);
  pointer-events: none;
}

.mint-ui-pressable::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle at 22% 18%, rgba(255,255,255,0.45), transparent 42%),
    linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.18) 45%, transparent 62%);
  mix-blend-mode: screen;
  opacity: 0.8;
  pointer-events: none;
}
```

### 2.4 状態のルール

- hover: `transform: translateY(-1px)` + shadow を少し強く
- active: `transform: translateY(0)` に戻し、shadow を潰す + face を少し暗く
- selected: rim 色 + glow の追加（影で “選択中” を見せる）
- disabled: 不透明度を落とすだけでなく、face のコントラストも落とす

---

## 3. `GlassPanel` のルール

`backdrop-filter` は “大きい面” だけ。
小さなボタン・チップに多用しない（モバイル負荷が高い）。

- Panel: blur OK
- Button: blur NG（艶と縁でガラス感を作る）

---

## 4. チップ/ピル/タブ

### 4.1 チップ（選択 UI）

- shape: pill（999px）
- selected: rim + glow + text-shadow
- unselected: ghost（透け）

### 4.2 タブ（現在地 UI）

- selected の面積を増やし、非選択は “押せるが薄い” にする
- アイコン + ラベルで迷いを減らす

---

## 5. テキスト（白抜き/薄背景の読みやすさ）

Mint UI は淡色背景が多い。
そのままだと文字が “沈む”。

- 白文字: 1〜2px の暗い影 + 輪郭（stroke的な shadow）
- 黒文字: 1px の白影（浮かせる）

---

## 6. 盤面スロット（凹み表現のコツ）

空セルは「透明な箱」ではなく「凹んだ置き場」。

- 内側影（inset）を強める
- 上辺は明るく、下辺は暗い（面が斜めに見える）
- diagonal gloss は 1本だけ（やり過ぎると安っぽい）

---

## 7. 受け入れ基準（見た目を客観化）

- 390px 幅で、主要ボタンの主従が崩れない
- 押下時に “沈んだ感” が **影の変化**として見える
- selected/disabled が色覚差に依存せず分かる（形/影でも分かる）
