# Work Order: 002 Fix Replay & Share reliability (subpath-safe)

## 1) 背景 / 目的
現象：
- リプレイやシェアが環境によって機能しない/リンクが壊れる

目的：
- **リプレイは常に再現できる**（RPC依存を減らす）
- **シェアURLはサブパス配信でも壊れない**（BASE_URL / Router basename）

## 2) 成果物
- [x] share URL生成が base path を考慮
- [x] Replayの読み込みが失敗しても復帰導線がある（再試行/説明）
- [x] E2E または unit に再発防止テスト

## 3) 要件
### MUST
- `Replay.tsx` の主要ケース（正常/失敗/データ破損）でUIが崩れない
- `Share` で生成したURLが同一環境で開ける
- サブパス（例：`https://example.com/game/`）でも壊れない

### SHOULD
- Replayデータフォーマットに version を持たせ、将来の互換を確保
- 圧縮/解凍はブラウザ差で壊れにくい実装（必要ならライブラリ採用）

## 4) 非要件
- 共有先SNSの最適化（OGP整備など）は別PR

## 5) 受け入れ条件
- `pnpm -C apps/web e2e` の既存specが通る（必要なら追加）
- `Share` 生成関数に unit test がある

## 6) 調査ポイント
- `apps/web/src/pages/Replay.tsx`
- share生成箇所（UIボタン、URL組み立て）
- Router設定（BASE_URL / Vite / deployment）
- `handoff_pack` との差分（ある場合）

## 7) 実装方針
採用：
- URL生成は `new URL()` + `import.meta.env.BASE_URL` を基準に統一
- Replayは “必要なスナップショット” を同梱できるようにし、RPC依存を削る（段階導入）

## 8) タスク
- [x] 002-A: share URL生成のユーティリティ化 + base path 対応
- [x] 002-B: Replayの失敗UI（再試行/説明/ホームへ）
- [x] 002-C: Replayデータの versioning（破壊的変更はしない）
- [x] 002-D: テスト（unit/e2e）

## 9) 検証
- `pnpm -C apps/web test`
- `pnpm -C apps/web e2e`
- 手動：share URL をコピペして別タブ/別端末で確認

## 10) リスク/ロールバック
- URL変更で既存リンクが壊れる可能性 → 旧形式も解釈できる互換処理を残す
