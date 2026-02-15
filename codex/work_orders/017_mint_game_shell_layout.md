# Work Order 017: MintGameShell + App Chrome（Mint 時の全体レイアウト土台）

## Goal

Mint テーマにおいて、/match 以外のページでも「ゲーム画面らしい背景・ガラス UI・セーフエリア」を共通化できるように、
アプリ全体の土台（Shell/Chrome）を整備する。

## Scope

- 追加: `MintGameShell`（背景 + safe-area + 中央カラム）
- 追加: `MintAppChrome`（上部ロゴ/タブ/戻るなどの“ゲームUI的”枠）
- 変更: `apps/web/src/App.tsx`（AppLayout）
  - theme=mint のとき、既存の Web 風 header/footer を出さず、MintChrome を使う
  - ただし `focusRoute`（overlay/配信/ステージ）は今の挙動を維持

## Non-goals

- 各ページの中身（Home/Arena/Decks）の本格移植（WO-018〜020で行う）
- triad-engine / transcript への変更

## Acceptance Criteria

1) theme=mint で Home/Arena/Decks/Events/Replay/Stream/Rulesets を開いたとき、
   - 背景が Mint gamefeel（空グラデ + ほんのり paw/sparkle）になり、
   - コンテンツ領域が “ガラスパネル” の上に載る

2) theme=rpg または theme 未指定では、既存 header/footer を維持

3) `focus=1` や `/battle-stage` `/replay-stage` では、今まで通り header/footer が出ず、
   画面が崩れない（配信用レイアウトの互換を維持）

4) iPhone 系のセーフエリア（`env(safe-area-inset-*)`）に配慮し、下部が欠けない

## Suggested Implementation Notes

- `MintGameShell` は「ページが必要な時だけ使う」より、AppLayout 側で包む方が統一しやすい
- 背景は既存 `mint-theme.css` の `mint-stage` を流用し、ページ用に `mint-app-bg` などを追加してもよい
- `MintAppChrome` は最小で良い（ロゴ、必要ならタブ枠）。
  - ナビゲーションの具体は WO-018〜020 が担当

## Files

- `apps/web/src/App.tsx`
- (new) `apps/web/src/components/mint/MintGameShell.tsx`
- (new) `apps/web/src/components/mint/MintAppChrome.tsx`
- `apps/web/src/mint-theme/mint-theme.css`（必要ならクラス追加）

## Test

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

Manual smoke:
- `/?theme=mint`
- `/arena?theme=mint`
- `/decks?theme=mint`
- `/battle-stage?theme=mint`（focus route）

