# WO-038: Visual Regression for Battle Board (Playwright) v1

## ゴール

バトル盤面のUIは“少しのCSS差分”で壊れやすい。
そこで **最低限のビジュアル回帰チェック**を導入し、
将来の改修で「気づかない劣化」を防ぐ。

## 前提

- 既に Playwright のE2Eが存在する（`pnpm -C apps/web e2e`）
- ここでの目的は「UIが大きく崩れていない」ことの検知

## 実装タスク

### 1) Mint Match のスクリーンショットテストを追加

- 対象: `ui=mint` の Match 画面
- 条件: 端末サイズを固定（例: 390x844）
- できれば “開始直後” と “カード配置後” の2枚

実装案:
- `apps/web/e2e/...` に新規 spec を追加
- `page.goto` で guest match を開く（安定するURLを使う）
- 盤面が描画されたことを `locator` で待つ
- `expect(page).toHaveScreenshot(...)`

### 2) 不安定要素を止める

- ランダムなパーティクルやアニメがある場合、
  - `data-vfx=off` にする
  - もしくは `prefers-reduced-motion` を forced

### 3) テストの維持コストを抑える

- ピクセル完全一致だと壊れやすい
- `maxDiffPixelRatio` などを適切に設定

## 受け入れ基準

- CI/ローカルで `pnpm -C apps/web e2e` が通る
- 盤面の大きな崩れを検知できる
- 更新フローがREADMEに追記されている（必要なら）

## 手動チェック

- スクリーンショットの更新手順が分かる
- 変更が無いのに落ち続けない
