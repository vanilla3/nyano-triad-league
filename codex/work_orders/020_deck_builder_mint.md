# Work Order 020: Decks を「Deck Builder」UIへ刷新（Mint）

## Goal

Decks ページを参照画像 `04_deck_builder_reference.png` の構造へ寄せ、
デッキ編集が「遊びの一部」に見える UI を作る。

## Scope

- `apps/web/src/pages/Decks.tsx` の Mint 表示を再設計
- 上部: タブナビ（Decks / Arena / Events / Replay / Stream / Settings）
- 左: Deck Stats + Filter（All/Attacker/Defender/Power/other）
- 中央: カード一覧グリッド（既存 CardBrowser / CardMini / 画像ローダー等を活用）
- 右: Deck Summary（選択カード一覧 + Save Deck ボタン）

## Non-goals

- デッキ仕様（枚数・制限）の変更
- カードデータの取得ロジック変更

## Acceptance Criteria

1) `/decks?theme=mint` が Deck Builder らしい 3カラム UI になる

2) 既存の主要機能が維持される
   - カードを選択して deck に入れられる
   - deck の保存ができる（既存の保存 UI/ハンドラを流用）
   - 主要なフィルタ/検索の導線がある（見つからない状態にならない）

3) グリッドはパフォーマンスに配慮
   - backdrop-filter を “全面に多用” しない
   - hover/press は軽量（transform/opacity中心）

4) スマホ幅（320〜390px）でも破綻しない
   - 3カラムが難しい場合、左/右をアコーディオン or 下段ドロワー化して良い

## Implementation Notes

- 既存の Decks ページは機能が多いので、「ゲーム画面」の骨格に収める
  - 詳細操作（import/export、細かい統計など）は “More” パネルへ退避 OK
- 上部タブは `MintTopTabs` としてコンポーネント化推奨（WO-022 と整合）
- 右の Save Deck は “強い primary ボタン” にする

## References

- `docs/01_design/reference/ui_mockups_20260215/04_deck_builder_reference.png`
- `docs/01_design/NYTL_MINT_UI_REFERENCE_APP_SCREENS_v1_ja.md`

## Files

- `apps/web/src/pages/Decks.tsx`
- `apps/web/src/components/mint/*`
- `apps/web/src/mint-theme/mint-theme.css`

## Test

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

Manual:
- `/decks?theme=mint`
