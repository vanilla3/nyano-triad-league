# WO-029: Board Tray & Slots Material v3（盤面を“玩具の置き場”に）

## Goal

Mint の盤面を、参考画像のように

- **トレイ（外周）**
- **スロット（空セル）**

がはっきり感じられる“ゲーム盤面”にする。

---

## Context

現状の `mint-board-frame` / `mint-board-inner` / `mint-cell` は基礎があるが、

- 空セルが“透明な箱”に見えて、置き場の凹みが弱い
- 外周とセルが同じ材質に見えて、情報の階層が薄い

という問題が残る。

---

## Tasks

### 1) スロットの凹みを作る（Empty cell）

対象: `apps/web/src/mint-theme/mint-theme.css`

- `.mint-cell--flat` を “sunken slot” に寄せる
  - inset shadow を増やす
  - 上辺は明るく、下辺は暗い（面の傾きを感じさせる）
  - diagonal gloss は薄く 1本だけ

追加案（任意）:

- `docs/01_design/NYTL_UI_ASSET_MANIFEST_v2_ja.md` の `BD-002 slot_inner_shadow_256.png` がある場合、
  `background-image` に重ねて “凹み” を強化する

### 2) トレイ（外周）と内側（盤面背景）を分離

- `mint-board-frame` は “硬い外枠”
- `mint-board-inner` は “柔らかい盤面布/ガラス”

として材質差を出す。

具体:

- 外枠: rim を太く、影を強く（持てそう感）
- 内側: 模様 + 低彩度 + 薄い sheen（主役はカード）

### 3) 置ける場所のハイライトを “ゲーム的” に

対象:

- `.mint-cell--selectable`
- `.mint-cell--drop-ready`

要件:

- 光の色は “ミント系” で統一
- 眩しすぎない（opacity を抑え、リム + 内側で光らせる）
- `data-vfx=low/off` で呼吸アニメ等を抑制できる

### 4) 盤面の “微” パース（任意）

参考画像は、盤面がほんの少しだけ立体に見える。

提案:

- `mint-board-frame` または `mint-board-inner` に
  `transform: perspective(...) rotateX(...) rotateZ(...)` の **ごく小さい値**を付与
- ただしクリック座標がズレないように、
  transform は極小 + 必要なら child を `transform: translateZ(0)` で補正
- `prefers-reduced-motion` / `data-vfx=off` では無効化

---

## Acceptance Criteria

- 空セルが “置き場” に見える（凹みがある）
- 置ける場所が “自然に分かる”
- カードが盤面より主役（背景を強くしすぎない）

---

## Verification

- `pnpm -C apps/web e2e:ux`
- `pnpm -C apps/web e2e:mint`
- `/match?ui=mint` を 390px / 768px / 1200px で目視
