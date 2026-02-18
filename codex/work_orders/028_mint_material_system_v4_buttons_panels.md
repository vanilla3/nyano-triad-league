# WO-028: Mint Material System v4（Buttons / Pills / Chips / Panels）

## Goal

Mint UI の「押せる感」「ぷっくり感」を **一段階上げる**。
参考画像のような、

- 太めの縁（rim）
- 内側の白い反射
- 上面の艶（specular）
- 押下時の沈み込み（shadow が潰れる）

を `MintPressable` / `MintBigButton` / `GlassPanel` に横展開できる状態を作る。

---

## Non-goals

- 画面レイアウトの大改造（WO-029/030/027 でやる）
- 画像9-slice主体の UI 作り（保守性が落ちるため）

---

## Context / Current

- `apps/web/src/mint-theme/mint-theme.css` の `.mint-ui-pressable` は基礎はあるが、層が少なく“平面”に見えやすい。
- `.mint-pressable` には hover/active の transform があるが、影の潰れが弱い。

---

## Tasks

### 1) Spec を読む

- `docs/01_design/NYTL_MINT_MATERIAL_SPEC_v1_ja.md`
- `docs/01_design/NYTL_GAME_UI_QUALITY_PRINCIPLES_SAKURAI_LENS_v1_ja.md`

### 2) CSS 変数を導入（表現の統一）

対象: `apps/web/src/mint-theme/mint-theme.css`

#### 追加する（例）

- `--mint-surface-radius`
- `--mint-surface-border`
- `--mint-surface-border-2`
- `--mint-surface-face-a / b`
- `--mint-surface-shadow / shadow-press`
- `--mint-surface-specular-opacity`

「primary/soft/ghost」など variant で上書きできる形にする。

### 3) `.mint-ui-pressable` を v4 へ

要件:

- border は 2層（外縁 + 内縁）
- `::after` で specular（上部の艶 + 斜めの光）
- hover/active で **shadow を変える**（transform だけに頼らない）
- `:focus-visible` の見え方を Mint に統一
- `disabled` は opacity だけではなく、コントラストも落とす

### 4) `MintBigButton` / `MintTabNav` の見た目を追従

- `MintBigButton` は “でかいボタン” なので、rim/specular を強める（ただし眩しすぎない）
- `mint-big-button__icon-wrap` も同じ material spec を適用できるようにする
- `MintTabNav` の active 状態が “押し込まれた” ではなく “選択中” に見えるように（rim + glow + face）

### 5) 主要ボタンの一貫性チェック

チェックする画面:

- `/`（Home Mint）
- `/arena`（Mint）
- `/decks`（Mint）
- `/match?ui=mint`（Mint board UI）

---

## Acceptance Criteria

- Mint ボタンが “Webの角丸カード” ではなく “ゲームのボタン” に見える
- hover/active/selected の差が **影と面**で分かる
- 390px 幅で押しやすい（44px 以上の hit area）
- `prefers-reduced-motion` / `data-vfx=off` で無駄なアニメが消える（必要なら）

---

## Verification

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e:mint`

---

## Notes

型破りな提案:

> blur を濫用せず、**縁と艶**で “ガラス” を作る方が、
> 結果的に “モバイルゲームっぽい” ことが多い。
> 透明度のある面は “綺麗” だが “重い”。