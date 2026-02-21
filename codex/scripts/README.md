# Codex Scripts

## run_all_work_orders

全ての Work Order を番号順に実行します。

```bash
./codex/scripts/run_all_work_orders.sh
```

環境変数:
- `MODEL` (default: gpt-5.3-codex)
- `APPROVAL_MODE` (on-request|never|untrusted)
- `SANDBOX_MODE` (read-only|workspace-write|danger-full-access)
- `START_ID` (例: 006 から開始)
- `INCLUDE_GLOB` (grep -E に渡す regex。例: motion|board)
- `GIT_REMOTE` (default: origin)
- `CREATE_PR` (1 で gh pr create を試みる。remote がある場合のみ)

> remote（既定: origin）が無い場合は fetch/pull/push を行いません（ローカルだけで進められます）。

例：Motion系だけ 006 から実行
```bash
START_ID=006 INCLUDE_GLOB=motion ./codex/scripts/run_all_work_orders.sh
```

## run_work_order

単発で Work Order を実行します。

```bash
./codex/scripts/run_work_order.sh 006
```

> push は人間レビュー後に手動で行う運用を推奨します。
