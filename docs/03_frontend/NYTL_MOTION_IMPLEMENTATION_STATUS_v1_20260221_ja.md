# NYTL かわいいモーション集 — 実装状況監査 v1（2026-02-21）

## 結論（今回の整備）

- **動かない原因の主因**：`src/index.css` に定義されていた一部のモーション用ユーティリティ（`.animate-cell-place` 等）が、現在のエントリCSS（`src/styles.css`）から読み込まれていなかった。
- **対処**：まだ参照されているユーティリティのみを `apps/web/src/motions.css` に移し、`src/main.tsx` でグローバルに import するように修正した。
- 併せて `styles.css` 内で参照されていた `--nyano-primary` 系の CSS 変数を `:root` に復元し、ナビのアクティブ状態のグラデが欠ける問題を回避した。

## モーション実装のレイヤ構造

1) **Tailwindアニメーション**（推奨・追加先）
- `apps/web/tailwind.config.ts` の `theme.extend.animation` / `keyframes`
- 例：`animate-card-place` / `animate-card-flip` / `animate-confetti` / `animate-shake` / `animate-fade-in-up` …

2) **テーマCSS（Mint / RPG）**
- Mint：`apps/web/src/mint-theme/mint-theme.css`（盤面・HUDの質感、`mint-cell-place` など）
- RPG：`apps/web/src/rpg-theme/rpg-theme.css`
- それぞれコンポーネント側から import している（`BoardViewMint.tsx` など）

3) **共通モーションユーティリティ（legacy補完）**
- `apps/web/src/motions.css`
- “まだ参照されているがTailwind化されていない” クラスだけを保持（増やしすぎない）

## 主要モーション（参照箇所 → 実装箇所）

| クラス/要素 | 参照している場所（例） | 定義/供給元 |
|---|---|---|
| `.animate-cell-place` | `components/BoardView.tsx`, `pages/Overlay.tsx` | `src/motions.css` |
| `.animate-cell-flip` | `components/BoardView.tsx`, `pages/Overlay.tsx` | `src/motions.css` |
| `.flip-delay-1..3` | `components/BoardView.tsx`, `pages/Overlay.tsx` | `src/motions.css` |
| `.animate-flip-glow` | `components/BoardView.tsx` | `src/motions.css` |
| `.animate-banner-enter` | `pages/Replay.tsx` | `src/motions.css` |
| `.result-banner-shimmer` | `pages/Replay.tsx` | `src/motions.css` |
| `.animate-victory` | `components/GameResultOverlay.tsx` | `src/motions.css` |
| `.animate-float` | `pages/Home.tsx` | `src/motions.css` |

※ Mint側は `mint-theme.css` の専用クラス（`mint-cell--placed` 等）で成立しているため、上記は主に classic/overlay/legacy 側の補完。

## 互換性・品質ガード

- `prefers-reduced-motion: reduce`
  - `motions.css` 側で infinite 系（float / shimmer / live-dot）を無効化
  - 主要な短時間アニメは 1ms / 1回に抑制

- VFX品質（`data-vfx` on `<html>`）
  - `visualSettings.ts` が `off/low/medium/high` を付与
  - `motions.css` でも `off` で glow/shimmer を無効化、`low` で時間を短縮

## QA（手動確認の最短ルート）

- `/motions`：モーション確認ページ（VFX切替/リプレイ）
- `Home`：タイトル/ヒーロー付近の **ふわ待機**（`.animate-float`）
- `Replay`：勝敗バナーの **入場**（`.animate-banner-enter`）と **シマー**（`.result-banner-shimmer`）
- `Playground`（または `Overlay`）：盤面の **配置**（`.animate-cell-place`）と **反転**（`.animate-cell-flip` + delay）

## 次の改善候補（Codex投入前の整理メモ）

- `motions.css` を増やしすぎると “Tailwindと二重管理” になりがち。
  - 次フェーズで `.animate-cell-*` を Tailwind `keyframes` に寄せるか、classic盤面も Mint のモーションに寄せて統一する。
- 「かわいさ」強化は **押し心地（Press Pop）** と **成功時のカタルシス（粒/光/揺れ）** を優先。
  - MOTの仕様表：`docs/01_design/NYTL_MOTION_LANGUAGE_SPEC_TABLE_v0_1_ja.md`

