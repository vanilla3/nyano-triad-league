# Work Order: 000_TEMPLATE — <TITLE>

## 1) 背景 / 目的（ユーザー視点）
- 何が困っているか（症状）
- それがなぜ痛いか（体験の損失）
- いつから/どの環境で（分かれば）

## 2) 成果物（Deliverables）
- [ ] 実装（変更ファイル）
- [ ] テスト（unit/e2e/手順書のいずれか）
- [ ] before/after（スクショ or 手順）
- [ ] docs更新（必要なら）

## 3) 要件（Requirements）
### MUST
- 
### SHOULD
- 
### COULD
- 

## 4) 非要件（Non-goals）
- 今回やらないこと（仕様膨張を防ぐ）

## 5) 受け入れ条件（Acceptance Criteria）
- OK/NGが判断できる条件を具体的に
  - 例：tokenId=1でNFT画像が表示
  - 例：share URL が subpath 環境でも正しく動く
  - 例：vfx=low/off でFPSが落ちにくい

## 6) 調査ポイント（Investigation）
- まず見るファイル/関数
- 仮説
- 再現手順

## 7) 実装方針（Approach）
- 方針A（最短）
- 方針B（根治）
- 今回採用する方針（理由）

## 8) タスクリスト（細分化）
- [ ] A-1 …
- [ ] A-2 …
- [ ] B-1 …

## 9) 検証（Verification）
### 自動
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm -C apps/web e2e`（必要時）

### 手動
- 手順を箇条書きで（スマホ幅/遅い回線/失敗ケースも含む）

## 10) リスク / ロールバック
- リスク
- ロールバック方法（feature flag / revert / 旧実装へ切替）

## 11) PR説明（PR body 雛形）
- What / Why / How / Screenshots / Test
