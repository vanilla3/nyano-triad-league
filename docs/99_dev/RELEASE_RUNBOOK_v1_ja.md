# Nyano Triad League — Release Runbook v1

目的：リリース時の手順を固定し、担当者が変わっても同じ品質で出荷・ロールバックできるようにする。

---

## 1. 事前条件

- 作業ブランチが `main` にマージ済み
- `pnpm install` 済み
- 変更内容が `docs/99_dev/IMPLEMENTATION_LOG.md` に記録済み

---

## 2. Release Check（必須）

ルートで以下を実行:

```bash
pnpm run release:check
```

実行内容:

- `packages/triad-engine`: lint + build
- `apps/web`: typecheck + lint + build

補足:
- この環境では `node:test` / `vitest` が `spawn EPERM` になるケースがあるため、失敗時は実行環境起因かを切り分ける。

---

## 3. Versioning

v1運用では、リリース単位で以下を更新する:

1. `docs/99_dev/IMPLEMENTATION_LOG.md` に対象コミットを追記
2. 破壊的変更がないことを確認（ある場合は `V2` として明示）
3. 必要に応じて `ruleset` / `protocol` 仕様書を同期

---

## 4. Changelog（最小テンプレ）

各リリースで次の4項目を残す:

- `Added`
- `Changed`
- `Fixed`
- `Docs`

保存先は当面 `docs/99_dev/IMPLEMENTATION_LOG.md` とし、将来 `CHANGELOG.md` を導入する。

---

## 5. Feature Flag 運用（web）

新機能は可能な限り URL / local setting で段階有効化する。

- URL 例: `?debug=1` / `?theme=mint`
- local setting 例: `nytl.vfx.quality`
- 本番デフォルトは安全側（OFF or 既存動作）にする

---

## 6. Rollback 手順

### 6.1 軽微ロールバック（推奨）

- 問題コミットを特定し、`main` へ revert commit を積む
- 再度 `pnpm run release:check` を通す

### 6.2 緊急ロールバック

- 直前の正常コミットをデプロイ対象として再配布
- その後、原因調査を `IMPLEMENTATION_LOG.md` に追記

---

## 7. Error Tracking（Phase 3）

web は `apps/web/src/lib/error_tracking.ts` でグローバル例外を収集する。

- 既定: `local`（localStorageリングバッファ）
- 設定:
  - `VITE_ERROR_TRACKING_MODE`（`off` / `local` / `console` / `remote` / 組み合わせ）
  - `VITE_ERROR_TRACKING_ENDPOINT`（remote送信先）
  - `VITE_ERROR_TRACKING_MAX_EVENTS`（保持件数、既定50）
  - `VITE_APP_RELEASE`（リリース識別子）

運用時は「エラー増加 → 対象コミット特定 → rollback or hotfix」を最短で回す。
