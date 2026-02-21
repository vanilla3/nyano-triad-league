# Work Order: 007 — Apply Motion to Core UI (Buttons / Panels / Toast)

## Goal
Motion Language v0.1 を、サイト全体の主要UIへ適用して「触り心地」を統一する。

## Scope
- ボタン/チップ/ナビ/パネル/トースト/ダイアログ

## Tasks
1) Pressable化（むにゅ）
- 既存のボタン系に `.motion-press-munyu` を適用
- タップ領域 44x44px を担保（見た目が小さくても hitbox を広げる）

2) Confirm（カチッ）
- 主要アクション（確定/保存/コピー成功）で `.motion-confirm-kachi`

3) Pop（ニョキッ）
- `Toast` / `EmptyState` / 小バッジ表示に `.motion-pop-nyoki`

4) Swap/Fold
- `AnimatedOutlet` の遷移を “ただの fade” から “Swap寄り” に改善（過剰にしない）
- `Disclosure` など開閉UIに Fold を適用

## Acceptance Criteria
- サイト全体で「押す」「確定」「出現」「切替」「開閉」の動きが統一される
- `prefers-reduced-motion` で動きが抑制される
- `data-vfx=off` でも見た目がチープにならない（輪郭・影で補う）

## Verification
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test`
- 手動: Home→Arena→Decks→Match を触って “同じ触感” がある
