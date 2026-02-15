# Work Order 024: e2e / Visual guardrails（主要画面のレイアウト崩れ防止）

## Goal

Mint UI の改修が進むほど、
- 320〜390px のスマホ幅
- 1024px 以上の PC 幅
- focusRoute / stage / overlay

での崩れが混入しやすい。
最低限の e2e/スモークで “壊れていない” を担保する。

## Scope

- Home/Arena/Decks/Match のスモークを追加（既存 e2e があるなら拡張）
- レイアウトシフトが分かりやすい箇所（Nyano comment、メニュー大ボタン）を優先

## Non-goals

- デザインの完全一致（ピクセルパーフェクト）を CI で強制する

## Acceptance Criteria

1) `pnpm -C apps/web e2e`（または同等）がローカルで通る
2) 少なくとも以下 URL を開ける
   - `/?theme=mint`
   - `/arena?theme=mint`
   - `/decks?theme=mint`
   - `/match?theme=mint`
3) 390px 幅相当での崩れを検知しやすい形（viewport 固定、スクショなど）になっている

## Implementation Notes

- 既存の e2e 構成を尊重し、過剰に重くしない
- `prefers-reduced-motion` を強制して安定化させても良い

## Files

- `apps/web/playwright.config.*`（存在すれば）
- `apps/web/src/pages/__tests__/*` または `apps/web/e2e/*`

## Test

- `pnpm -C apps/web e2e`
- `pnpm -C apps/web build`
