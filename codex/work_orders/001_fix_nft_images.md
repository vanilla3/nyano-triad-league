# Work Order: 001 Fix NFT image non-display (DOM/Pixi consistency)

## 1) 背景 / 目的
現象：
- NFT画像が出ず、デフォ画像が表示される/白抜けになることがある
- DOM（NyanoCardArt）と Pixi（engine/textureResolver）で画像URL解決がズレる可能性

目的：
- **NFT画像の確実表示**（遅延/失敗時も破綻しない）
- URL解決ロジックを共有し、再発を防ぐ

## 2) 成果物
- [x] 画像URL解決の共有関数（単一ソース）
- [x] DOM/Pixiの両方が同じ解決結果になる
- [x] 既存テスト更新 + 追加テスト
- [x] 失敗時UI（説明・再試行）を維持/強化

## 3) 要件
### MUST
- tokenId（例：1, 2, 9999, 10000）で画像が表示される
- 画像ロード失敗時も UI が崩れない（説明 + フォールバック）
- DOM/Pixi の画像が一致する（同じURL優先順位）

### SHOULD
- 盤面/手札に見える tokenId は先読み（プリロード）される
- 低品質（vfx=low/off）ではプリロード同時数を絞る

### COULD
- 画像失敗の観測（console warn ではなく、ユーザー向け通知は控えめに）

## 4) 非要件
- 新しい画像ホスティング基盤の追加（今回はやらない）
- NFTメタデータ仕様の全面変更（互換維持）

## 5) 受け入れ条件
- `apps/web/src/components/NyanoCardArt.tsx` と `apps/web/src/engine/renderers/pixi/textureResolver.ts` が同じロジックを使用
- `pnpm -C apps/web test` が通る
- 画像URL解決のテストが増えている（例：tokenImageUrls.ts のテスト）

## 6) 調査ポイント
見る場所：
- DOM: `apps/web/src/components/NyanoCardArt.tsx`
- メタデータ: `apps/web/src/lib/nyano/useNyanoTokenMetadata.ts`
- game index: `apps/web/src/lib/nyano/gameIndex.ts` + cache tests
- Pixi: `apps/web/src/engine/renderers/pixi/textureResolver.ts`
- Pixi URL: `apps/web/src/engine/renderers/pixi/tokenImageUrls.ts`

仮説例：
- baseUrl/env/キャッシュの組み合わせで「旧キャッシュ」が優先され、URLが欠ける
- gateway failover の順序がズレ、片方だけデフォへ落ちる

## 7) 実装方針
採用：
- “URL組み立て” を純関数として `apps/web/src/lib/nyano/resolveNyanoImageUrl.ts` に集約
- DOM/Pixi はこの関数を使う
- 既存の `tokenImageUrls.ts` / `useNyanoTokenMetadata` はラッパー化して重複排除

## 8) タスク
- [x] 001-A: URL解決純関数 `resolveNyanoImageUrl()` を追加
- [x] 001-B: NyanoCardArt を新関数へ切替
- [x] 001-C: textureResolver を新関数へ切替
- [x] 001-D: テスト追加（DOM/Pixi一致、edge tokenId、cache）
- [x] 001-E: 低回線を想定したリトライ/プリロード制御（必要最小限）

## 9) 検証
- `pnpm lint`
- `pnpm typecheck`
- `pnpm -C apps/web test`
- 手動：`pnpm dev:web` で tokenId 指定の表示確認（手札/盤面/リプレイ）

## 10) リスク/ロールバック
- 画像URL解決は影響範囲が広い → feature flag（旧ロジック）を一時的に残すか、段階的に切替
