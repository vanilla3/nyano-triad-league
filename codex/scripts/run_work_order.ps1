Param(
  [Parameter(Mandatory=$true)][string]$WorkOrder,
  [string]$Model = $env:MODEL,
  [string]$ApprovalMode = $env:APPROVAL_MODE,
  [string]$SandboxMode = $env:SANDBOX_MODE,
  [string]$WorkOrderDir = $env:WORK_ORDER_DIR
)

if ([string]::IsNullOrEmpty($Model)) { $Model = "gpt-5.3-codex" }
if ([string]::IsNullOrEmpty($ApprovalMode)) { $ApprovalMode = "on-request" }
if ([string]::IsNullOrEmpty($SandboxMode)) { $SandboxMode = "workspace-write" }
if ([string]::IsNullOrEmpty($WorkOrderDir)) { $WorkOrderDir = "codex/work_orders" }

function Find-WorkOrderFile($arg) {
  if ($arg -match "^[0-9]{3}$") {
    $match = Get-ChildItem -Path $WorkOrderDir -Filter ("$arg`_*.md") -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $match) { return $match.FullName }
    return $null
  }
  if (Test-Path $arg) { return (Resolve-Path $arg).Path }
  return $null
}

$woPath = Find-WorkOrderFile $WorkOrder
if ($null -eq $woPath) {
  Write-Error "Work Order not found: $WorkOrder"
  exit 1
}

$first = (Get-Content $woPath -TotalCount 1).TrimEnd("`r")
$id = (Split-Path $woPath -Leaf).Substring(0,3)
$title = (Split-Path $woPath -LeafBase)

if ($first -match "^# Work Order: ([^\s]+)\s+[-—]\s+(.+)$") {
  $id = $Matches[1]
  $title = $Matches[2]
} elseif ($first -match "^# Work Order: ([^\s]+)\s+(.+)$") {
  $id = $Matches[1]
  $title = $Matches[2]
}

Write-Host "============================================================"
Write-Host "Run Work Order $id — $title"
Write-Host "File: $woPath"
Write-Host "============================================================"

$prompt = @"
You are an implementation agent working inside a git repository.

CRITICAL RULES:
- Implement ONLY what is required by the Work Order (keep scope tight).
- Keep changes safe and incremental. No large refactors unless explicitly requested.
- Do NOT add assets with unclear licenses.
- Always run verification before finishing.

STEPS (in order):
1) Read the Work Order below carefully.
2) Implement it fully.
3) Run verification commands (choose what's relevant, but include at least lint + typecheck + tests):
   - pnpm lint
   - pnpm typecheck
   - pnpm test
   - pnpm -C apps/web test
   - pnpm -C apps/web e2e (only if relevant)
4) Show git status and summarize the diff (high level).
5) Stop and WAIT for human review before pushing. (Commit is OK, push is optional.)

---- WORK ORDER ----
$(Get-Content $woPath -Raw)
"@

$prompt | codex exec --model $Model --sandbox $SandboxMode --ask-for-approval $ApprovalMode -
