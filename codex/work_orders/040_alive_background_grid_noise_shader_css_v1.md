# WO-040: Alive Background（微速グリッドスクロール + 薄ノイズ）

目的: Idle状態でも UI が「死んでいない」印象を作りつつ、
参照UIのような **パステル×ガラス** の世界観を強める。

今回の狙いは “賑やかにする” ではなく、
**視線誘導の下敷きとしての生体反応**（breath / drift / shimmer）を入れること。

---

## Scope

- ✅ 背景に「微速スクロールするグリッド」層を追加（CSSで実装、軽量）
- ✅ 薄いノイズ/粒状感のオーバーレイを追加（`data-vfx` と `reduce motion` で段階制御）
- ✅ 既存の Mint 背景（sparkles/paws）と競合しないよう整理
- ✅ ページ単位で強度を調整できる（CSS変数）

- ❌ Three.js の導入はしない（必要なら後続で別WO）
- ❌ 常時グリッチ/点滅など “うるさい” 演出は入れない

---

## 対象コンポーネント

- App Shell:
  - `apps/web/src/components/mint/MintGameShell.tsx`
  - `apps/web/src/mint-theme/mint-theme.css`（`.mint-app-shell__bg` 周辺）

- Match Stage:
  - `apps/web/src/components/DuelStageMint.tsx`
  - `apps/web/src/mint-theme/mint-theme.css`（`.mint-stage__bg` / `.mint-stage__holo` 周辺）

---

## 実装方針

### 1) グリッド層（常時微速スクロール）

- 既存の `.mint-stage__holo`（holo grid）を活用し、
  `background-position` を **非常に遅く** 動かす。

推奨:
- 速度は 30〜90s で 1周（“動いてるか分からない” くらい）
- `data-vfx=off` では停止、`low` ではさらに遅く

### 2) ノイズ層（grain）

- 既存 `--mint-material-noise-url`（`/assets/gen/tx_noise_...`）を再利用する。
- `mix-blend-mode: overlay/soft-light` を試すが、
  モバイル性能が落ちる場合は **opacityのみ** で調整。

### 3) ページごとの強度調整（CSS変数）

例:
- `--mint-bg-grid-opacity`
- `--mint-bg-noise-opacity`
- `--mint-bg-scroll-speed`

AppShell と Match で値を変えられるようにして、
Matchは少し強め、Homeは控えめ、などの調律を可能にする。

### 4) `prefers-reduced-motion` と `data-vfx`

- `reduce motion` → スクロール停止、sparkle drift を最小化
- `vfx=off` → ループ停止、静的背景
- `vfx=low` → ループは残すが遅く、ノイズは薄く

---

## Acceptance Criteria

- [ ] 背景が “生きている” と感じるが、主役（カード/盤面/HUD/ボタン）が負けない
- [ ] 既存背景のアニメーションと競合して破綻しない（ちらつき、モアレ、読みにくさが増えない）
- [ ] `prefers-reduced-motion` と `data-vfx=off` で停止し、静的でも成立する
- [ ] パフォーマンスが落ちない（特にモバイル幅 390px）

---

## 手動チェック

- Home / Decks / Arena / Match で背景のテンポが極端に変わらない
- 390px 幅でスクロールがカクつかない
- 文字の可読性が落ちていない

---

## 実行コマンド

```bash
pnpm -C apps/web typecheck
pnpm -C apps/web test
pnpm -C apps/web lint
pnpm -C apps/web build
```
