# Codex Runner Scripts

This folder contains scripts to run *all* Work Orders under `codex/work_orders/` sequentially.

It also includes a script to run **a single Work Order** by id.

## PowerShell (Windows)
Run from repo root:

```powershell
pwsh -ExecutionPolicy Bypass -File codex/scripts/run_all_work_orders.ps1 -ApprovalMode on-request
```

Fully automatic (no prompts):
```powershell
pwsh -ExecutionPolicy Bypass -File codex/scripts/run_all_work_orders.ps1 -ApprovalMode never -CreatePR
```

Run a single Work Order:
```powershell
pwsh -ExecutionPolicy Bypass -File codex/scripts/run_work_order.ps1 -WorkOrder 006 -ApprovalMode on-request
```

## Bash (macOS/Linux)
```bash
chmod +x codex/scripts/run_all_work_orders.sh
APPROVAL_MODE=on-request CREATE_PR=1 codex/scripts/run_all_work_orders.sh
```

Run a single Work Order:
```bash
chmod +x codex/scripts/run_work_order.sh
APPROVAL_MODE=on-request CREATE_PR=0 codex/scripts/run_work_order.sh 006
```

## Notes
- If your Codex execution policy rules block `git push`, either:
  1) set ApprovalMode to `on-request`, approve when prompted, OR
  2) change `codex/rules/nyano.project.rules` so `git commit`/`git push` are `allow`.
- The runner stops on the first failed Work Order and keeps the branch for inspection.
