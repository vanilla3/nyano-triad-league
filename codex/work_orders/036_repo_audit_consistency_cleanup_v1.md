# WO-036: Repo Audit & Consistency Cleanup v1

## ゴール

サイト全体（コード/設定/ドキュメント）の **不整合や潜在不具合**を棚卸しし、
Codexが今後の改善を迷わず進められる状態へ整える。

ここで言う“不整合”は、
- ビルドやCIで落ちる可能性
- 触ると壊れやすい構造
- 人間が迷う配置・命名
を含む。

## 既に確認できた事項（このリポジトリ内）

1) **BOM（UTF-8 with BOM）混入（※このセットアップzipでは除去済み）**

- 以前は一部ファイル先頭にBOMが混入していたが、このセットアップzipでは除去済み。
- 今後の再混入を防ぐため、検査手順を残す（下記）。

2) **ロックファイルの二重管理**
- ルートに `pnpm-lock.yaml` と `package-lock.json` が共存
- 現状は pnpm 前提（`packageManager: pnpm@...`）なので、npm lockは混乱の元

3) **Codex作業単位の番号衝突**
- `codex/execplans` と `codex/work_orders` に同番号のファイルが複数存在
- 自走時に “どれが最新版か” 迷う

## 実装タスク

### 1) BOM混入を検査し、0件を維持

- 対象: `apps/web/src/**/*.ts*` を中心に全体
- やり方例: 先頭3バイト（EF BB BF）の有無をスキャンし、検出したら除去して保存
- 変更前後で TypeScript の挙動が変わらないこと

### 2) パッケージマネージャを一本化

方針: **pnpm に統一**

- `package-lock.json` を削除し、README / docs も pnpm 前提に統一
- もし npm を残す事情があるなら、理由を明記して逆に `pnpm-lock.yaml` を削除
  - ただし現状は pnpm が自然

### 3) Codexドキュメントの衝突整理

- 重複番号がある場合は
  - (A) 最新を残して旧版は `DEPRECATED_...` へリネーム
  - (B) 旧版の先頭に「DEPRECATED」と明記し、ExecPlanから参照しない

Codexが迷わないことが最重要。

### 4) “見た目の不整合”を棚卸し

- Mintテーマのページと旧UI（tailwindのcard/btn系）が混在していないか
- ルーティング遷移でテーマが不意に変わらないか
- `appendThemeToPath` が使われているか（必要箇所）

### 5) 依存/設定の健全性チェック

Codexはローカルで以下を実行して、落ちるところを修正する。

- `pnpm -w install`
- `pnpm -C apps/web lint`
- `pnpm -C apps/web build`
- `pnpm -C apps/web e2e`

## 受け入れ基準

- BOMが無い
- ロックファイル運用が一貫している
- Codex文書の番号衝突が整理され、最新版が明確
- lint/build/e2e が通る

## 手動チェック

- Home/Arena/Match/Decks/Replay/Stream/Settings の導線に破綻が無い
- テーマが意図せず切り替わらない
