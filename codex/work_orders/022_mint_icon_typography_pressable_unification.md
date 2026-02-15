# Work Order 022: Mint UI の Icon / Typography / Pressable 統一

## Goal

参照画像の “ゲーム感” を支える、
- アイコンの統一感
- 太めで読みやすいタイポ
- 押し心地（press feedback）

を、共通部品として整備する。

## Scope

- `MintIcon`（SVG）: swords/cards/replay/stream/settings/... を最小セットで用意
- `MintTitleText` / `MintLabel` など、stroke + shadow を簡単に適用できるヘルパー
- `MintPressable`（Button/Link）: hover/press/disabled を統一し、ユーザーが “押した” のを確信できる

## Non-goals

- 既存の全ボタンを一気に置換（WO-018〜020 の範囲で使い始める）

## Acceptance Criteria

1) Mint UI 上の主要ボタンが “押し込める” 触感になる（transform/影/音は任意）
2) タイトルやバッジが “白縁 + 影” で、背景に埋もれない
3) アイコンが線幅/角丸/色味で統一される
4) `prefers-reduced-motion` のとき、過剰なアニメが抑制される

## Implementation Notes

- SVG は `currentColor` ベースにして、親でグラデや影を当てられる設計が望ましい
- press の演出は `transform: translateY(...) scale(...)` 程度に止める（layout 変化禁止）

## Files

- (new) `apps/web/src/components/mint/icons/*.tsx`
- (new) `apps/web/src/components/mint/MintPressable.tsx`
- `apps/web/src/mint-theme/mint-theme.css`

## Test

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`
