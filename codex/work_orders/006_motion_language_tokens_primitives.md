# Work Order: 006 — Motion Language Tokens & Primitives

## Goal
Nyano Motion Language v0.1 の **基礎（トークン + プリミティブ）**を実装し、全UIで再利用できる状態にする。

## Non-goals
- 大規模なデザイン刷新（色やレイアウトの全面変更）はしない
- Pixi側の大改修はこのWOでは扱わない（必要なら別WO）

## Spec
- `docs/01_design/NYTL_MOTION_LANGUAGE_SPEC_TABLE_v0_1_ja.md`

## Tasks
1) Motion tokens を追加
- 追加先候補：
  - `apps/web/src/styles.css` の `:root`（もしくは mint-theme の tokens領域）
- tokens:
  - `--m-dur-*`, `--m-ease-*`, `--m-scale-*`, `--m-ty-*`

2) Reduced motion / VFX tiers の落とし込み
- `prefers-reduced-motion: reduce` で以下を停止/短縮
  - オーバーシュート、シェイク、連続バウンス、Ambientループ
- `data-vfx="off"` で particle/shine を無効化（光は輪郭に置換）

3) Motion primitives（CSS classes）を追加
- 例：
  - `.motion-press-munyu`
  - `.motion-confirm-kachi`
  - `.motion-pop-nyoki`
  - `.motion-swap`
  - `.motion-fold`
  - `.motion-magnet`
  - `.motion-spotlight`
  - `.motion-indicator`

4) 利用例を1箇所だけ適用して動作確認
- 例：
  - `src/components/CopyField.tsx` のコピーボタン
  - `src/components/Toast.tsx` の表示

## Acceptance Criteria
- tokens と classes が追加され、既存UIが壊れていない
- `prefers-reduced-motion` と `data-vfx=off` で動きが抑制される
- 代表2箇所（ボタン/トースト）に適用し、視覚的に改善される

## Verification
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test`
- 手動: モバイル幅で押下→表示が自然、reduceで過剰モーションが消える
