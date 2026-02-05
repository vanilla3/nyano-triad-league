# commit-0058 IMPLEMENTATION LOG

## What
- UI: Nyano image (Arweave) を表示できるようにした
  - `NYANO_IMAGE_URL` を `apps/web/src/lib/nyano_assets.ts` に追加
  - `NyanoImage` コンポーネントを追加（remote失敗時のfallbackあり）
  - `/match` と `/stream` のヘッダーに Nyano 画像を配置して“ゲーム感”を強化

## Why
現状UIが機械的で、初見の人に「ゲームっぽさ」が伝わりにくい。  
Nyano のビジュアルを UI の前面に出すことで、世界観・感情価値（かわいさ）を最初の1秒で提示する。

## Manual test checklist
- `pnpm -C apps/web dev`
- `/match` の上部に Nyano 画像が表示される
- `/stream` のタイトル左に Nyano 画像が表示される
- 画像が読み込めない場合も UI が崩れない（fallbackが出る）
