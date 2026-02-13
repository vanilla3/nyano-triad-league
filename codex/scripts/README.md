# Codex Runner Scripts

This folder contains scripts to run *all* Work Orders under `codex/work_orders/` sequentially.

## PowerShell (Windows)
Run from repo root:

```powershell
pwsh -ExecutionPolicy Bypass -File codex/scripts/run_all_work_orders.ps1 -ApprovalMode on-request
```

Fully automatic (no prompts):
```powershell
pwsh -ExecutionPolicy Bypass -File codex/scripts/run_all_work_orders.ps1 -ApprovalMode never -CreatePR
```

## Bash (macOS/Linux)
```bash
chmod +x codex/scripts/run_all_work_orders.sh
APPROVAL_MODE=on-request CREATE_PR=1 codex/scripts/run_all_work_orders.sh
```

## Notes
- If your Codex execution policy rules block `git push`, either:
  1) set ApprovalMode to `on-request`, approve when prompted, OR
  2) change `codex/rules/nyano.project.rules` so `git commit`/`git push` are `allow`.
- The runner stops on the first failed Work Order and keeps the branch for inspection.
