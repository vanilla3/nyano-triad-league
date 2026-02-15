# Work Order 019: Arena を「モード選択」UIへ刷新（Mint）

## Goal

Arena ページを参照画像 `03_arena_mode_select_reference.png` の情報設計に寄せ、
“対戦を始める” 行為が直感的になるようにする。

## Scope

- `apps/web/src/pages/Arena.tsx` の Mint 表示を再設計
- 左: 大ボタンのサイドナビ（Decks / Match / Replay / Playground）
- 中央: タイトルバナー（Nyano Triad League Arena）
- 右: Quick Play ガラスパネル（Play Now / Pixi Stage など）
- 下: 難易度カード 4 つ（Easy/Normal/Hard/Expert）

## Non-goals

- マッチング仕様の変更
- 難易度ロジックの実装（ひとまず UI とクエリ/状態管理の骨組みで良い）

## Acceptance Criteria

1) `/<arena>?theme=mint` で、ユーザーが迷わず “Play Now” を押せる
2) 難易度は選択状態が分かる（selected state）
3) Pixi Stage への導線があり、クリックで `/battle-stage` に遷移できる
4) 左ナビは押すと各ページへ遷移できる（既存ルートを利用）

## Implementation Notes

- 難易度は URL クエリ（例: `difficulty=easy`）で保持すると share しやすい
- `MintSideNav` / `GlassPanel` の再利用を推奨（WO-017/022 と整合）
- スマホ幅では左ナビを上段/下段へ折りたたむ（横幅に依存しない）

## References

- `docs/01_design/reference/ui_mockups_20260215/03_arena_mode_select_reference.png`
- `docs/01_design/NYTL_MINT_UI_REFERENCE_APP_SCREENS_v1_ja.md`

## Files

- `apps/web/src/pages/Arena.tsx`
- `apps/web/src/components/mint/*`
- `apps/web/src/mint-theme/mint-theme.css`

## Test

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

Manual:
- `/arena?theme=mint`（320〜390px幅）
- `/battle-stage?theme=mint`
