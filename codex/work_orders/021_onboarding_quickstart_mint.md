# Work Order 021: Onboarding（3ステップカード）画面の整備（Mint）

## Goal

参照画像 `02_onboarding_reference.png` のように、
初心者が “1分で始める” ための導線を、独立した分かりやすい画面として用意する。

## Scope

- 新規ページ追加（推奨）: `/start` または `/onboarding`
  - 3枚カード（ルール / ゲスト対戦 / Matchで初手確定 など）
  - DONE バッジ + 右上 progress pill
- Home からこの画面へ遷移できる導線を設置
- 既存 `apps/web/src/lib/onboarding.ts` の状態管理を利用する

## Non-goals

- onboarding の仕様追加（ステップ数を増やす等）
- 既存の Home onboarding セクションの完全削除（段階移行でOK）

## Acceptance Criteria

1) `/<start>?theme=mint` で 3カード UI が表示され、各カードのボタンが動く
   - ルール: Rulesets または ルールページへ
   - ゲスト対戦: Arena か Match へ
   - 初手確定: Match へ

2) DONE 状態が視覚で分かり、進捗 pill（例: 3/3 steps）が正しく更新される

3) iPhone 幅で崩れない（横並び→縦並びでも可）

## Implementation Notes

- ルート追加は `apps/web/src/main.tsx` の router 定義へ追加
- 既存 onboarding.ts は localStorage を前提としているので、そのまま利用

## References

- `docs/01_design/reference/ui_mockups_20260215/02_onboarding_reference.png`
- `docs/01_design/NYTL_MINT_UI_REFERENCE_APP_SCREENS_v1_ja.md`

## Files

- (new) `apps/web/src/pages/Start.tsx`（仮名）
- `apps/web/src/main.tsx`
- `apps/web/src/pages/Home.tsx`（導線追加）
- `apps/web/src/mint-theme/mint-theme.css`

## Test

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

Manual:
- `/start?theme=mint`
