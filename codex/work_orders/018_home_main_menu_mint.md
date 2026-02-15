# Work Order 018: Home を「メインメニュー」UIへ刷新（Mint）

## Goal

Home ページを参照画像 `01_main_menu_reference.png` のような、
“スマホゲームの入口” らしいメインメニュー画面に寄せる。

## Scope

- `apps/web/src/pages/Home.tsx` の Mint 表示を再設計
- 追加/再利用: ガラス大ボタン 4つ（Arena / Decks / Replay / Stream）
- 追加/再利用: 「3ステップで始めよう」カード 3つ（既存 onboarding.ts を使用）
- 追加: 画面下 info bar（現フェーズ/次マイルストーンなど。テキストは仮でOK）

## Non-goals

- ルール/AI/データ系の仕様変更
- 既存機能の削除（必要なら “More” 折りたたみに退避）

## Acceptance Criteria

1) `/?theme=mint` を開くと、以下が一目で分かる
   - Arena（対戦）へ進める
   - Decks（デッキ編集）へ進める
   - Replay / Stream へ進める

2) ボタンはタップしやすい
   - 最小 44px 以上のタップ領域
   - hover / press のフィードバック（押し込み・光）

3) onboarding の完了状態が視覚で分かる
   - “DONE” バッジ or 同等の完了表現
   - ステップを押すと該当ページへ遷移する

4) focusRoute（`focus=1`）では既存挙動を壊さない

## Implementation Notes

- 参照画像の構造を優先し、既存 Home の説明文は「More」にまとめるか、別セクションへ退避
- 4大ボタンは `MintBigButton` のようなコンポーネント化を推奨（WO-022 と整合）
- アイコンは最初は SVG（MintIcon）で良い。後で Gemini 生成アセットに差し替え可能

## References

- `docs/01_design/reference/ui_mockups_20260215/01_main_menu_reference.png`
- `docs/01_design/NYTL_MINT_UI_REFERENCE_APP_SCREENS_v1_ja.md`

## Files

- `apps/web/src/pages/Home.tsx`
- `apps/web/src/components/mint/*`（必要なら追加）
- `apps/web/src/mint-theme/mint-theme.css`（必要ならクラス追加）

## Test

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

Manual:
- `/?theme=mint`（320px〜390px幅でチェック）
