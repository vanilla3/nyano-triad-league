# Codex Operator Guide (Repo)

このリポジトリで Codex を “自走” させるための運用メモです。

---

## 1) どこに指示を書くか

- **ルート `AGENTS.md`**: リポジトリ全体の不変条件 / 守るべき互換 / 実行コマンド
- **サブディレクトリ `AGENTS.md`**（例: `apps/web/AGENTS.md`）: その領域だけの詳細ルール

原則:

- 仕様・不変条件は `AGENTS.md`
- 具体タスクは `codex/work_orders/*.md`
- 大きな方向性・章立ては `codex/execplans/*.md`

---

## 2) 作業の単位

この repo では「Work Order = 1 PR」を基本とします。

- 小さく・安全に・戻せる
- 回帰が出たらすぐ切り戻せる

---

## 3) 推奨の回し方

### Bash (macOS/Linux)

```bash
chmod +x codex/scripts/run_work_order.sh
APPROVAL_MODE=on-request codex/scripts/run_work_order.sh 006
```

### PowerShell (Windows)

```powershell
pwsh -ExecutionPolicy Bypass -File codex/scripts/run_work_order.ps1 -WorkOrder 006 -ApprovalMode on-request
```

---

## 4) 安全装置

- `.codex/config.toml` に repo 固有の model / approval policy を設定
- `codex/rules/*.rules` で外部コマンド実行を制御

注意:

- ルールファイルは “文法エラー” があると読み込みに失敗しやすいので、
  文字列のクォート（`\"`）に注意する

---

## 5) Done の定義

Work Order 実装後は最低限これを満たす:

- `pnpm -C apps/web test`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web build`

変更内容により `pnpm -C apps/web e2e` も追加。
