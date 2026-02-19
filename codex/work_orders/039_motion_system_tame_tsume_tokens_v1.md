# WO-039: Motion System（タメとツメ）— Tokens / Easing / Timing 統一

目的: サイト全体の「動きの品質」を、参照UIのような“ゲーム品質”へ近づける。

- 画面ごとにバラついている **速度・緩急・オーバーシュート** を統一する
- 既存の Mint テーマ資産（`mint-theme.css`）を壊さず、**再利用できる規格**にする
- `prefers-reduced-motion` と `data-vfx` を尊重し、演出が段階的に抑制できる状態を維持する

参照:
- `docs/01_design/NYTL_UI_MOTION_SYSTEM_TAME_TSUME_v1_ja.md`
- `docs/01_design/NYTL_GAME_UI_QUALITY_PRINCIPLES_SAKURAI_LENS_v1_ja.md`

---

## Scope

- ✅ UI のトークン（duration/easing/amplitude）の導入
- ✅ 主要コンポーネント（ボタン/パネル/カード/ページ遷移）の timing 統一
- ✅ Match 盤面の「カード出現」を *Linear → EaseOutBack* の思想へ寄せる（※ロジックは変更しない）
- ✅ `reduce motion` / `vfx=off/low` でも破綻しない

- ❌ 大規模ライブラリ導入（Framer Motion など）はしない
- ❌ 演出を増やすだけの作業（粒子・shake は WO-041 で行う）

---

## 変更する場所（中心）

- Motion Tokens / keyframes:
  - `apps/web/src/mint-theme/mint-theme.css`

- ページ遷移:
  - `apps/web/src/components/AnimatedOutlet.tsx`

- Pressable:
  - `apps/web/src/components/mint/MintPressable.tsx`
  - `apps/web/src/mint-theme/mint-theme.css`（`.mint-ui-pressable`）

- Match（カード出現/セル反応）:
  - `apps/web/src/components/BoardViewMint.tsx`
  - `apps/web/src/components/HandDisplayMint.tsx`

---

## 実装方針

### 1) Motion Tokens を CSS 変数として定義

`mint-theme.css` の最上段（テーマトークン群の近く）に以下を追加:

- duration（60fps基準の “frames” を ms に落としたもの）
  - 4f/6f/8f/10f/12f/15f/18f/24f
- easing（標準4種）
  - ease-out / ease-in / ease-in-out / ease-out-back
- amplitude（変化量）
  - 例: `--mint-motion-pop-scale`, `--mint-motion-press-y`, `--mint-motion-hover-y`

**重要**: 実装側の「値」を散らさず、可能な限り token 経由に寄せる。

### 2) “型”をユーティリティクラスで提供

例（命名は自由だが、既存 mint 命名に寄せる）:

- `mint-motion-enter`（opacity + translate + ease-out）
- `mint-motion-exit`（opacity + translate + ease-in）
- `mint-motion-pop`（scale + ease-out-back）

これらを使って、ページ/モーダル/カード出現のクオリティを底上げする。

### 3) 既存アニメの置換（要点だけ）

- “カード出現” が線形・硬い場合:
  - `mint-pop-in` を `ease-out-back` に寄せる
  - `prefers-reduced-motion` / `data-vfx=off` では overshoot を外す

- ボタン押下:
  - onPointerDown は **4〜6f**（即時の返事）
  - 復帰は **6〜10f**（軽い戻り。過剰なバウンド禁止）

- ページ遷移:
  - 現状の fade を「薄い translate + ease-out」へ（主張しすぎない）

---

## Acceptance Criteria

- [x] 同じ種類の操作（押下/出現/閉じる）のテンポが **画面ごとにズレない**
- [x] 入場は `ease-out`、退出は `ease-in` が基本になっている
- [x] カード出現が “ぷにっ” と見える（**1回だけ**オーバーシュート）
- [x] `prefers-reduced-motion: reduce` で overshoot / loop が止まり、静的差で状態が分かる
- [x] `data-vfx=off` / `low` で “うるささ” が抑制される
- [x] Match のゲームロジック・勝敗・turn 進行に影響しない（UIのみ）

---

## 手動チェック

- Home: 主役ボタンを連打しても気持ちよく、ガタつかない
- Decks: フィルタ切替が軽く、状態が分かる
- Match: カード選択→配置→反転のテンポが統一される

---

## 実行コマンド

```bash
pnpm -C apps/web typecheck
pnpm -C apps/web test
pnpm -C apps/web lint
pnpm -C apps/web build
```
