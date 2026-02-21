Param(
  [Parameter(Mandatory=$true)][string]$WorkOrder,
  [string]$Model = $env:MODEL,
  [string]$BaseBranch = $env:BASE_BRANCH,
  [ValidateSet("on-request","never","untrusted")][string]$ApprovalMode = $env:APPROVAL_MODE,
  [switch]$CreatePR
)

if (-not $Model) { $Model = "gpt-5.3-codex" }
if (-not $BaseBranch) { $BaseBranch = "main" }
if (-not $ApprovalMode) { $ApprovalMode = "on-request" }

$WorkOrderDir = $env:WORK_ORDER_DIR
if (-not $WorkOrderDir) { $WorkOrderDir = "codex/work_orders" }

function Need([string]$cmd) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    Write-Error "Missing command: $cmd"
    exit 1
  }
}

Need git
Need codex

function Resolve-WorkOrderFile([string]$input) {
  if (Test-Path $input) { return $input }
  # Accept 6, 06, 006
  $id = [int]$input
  $idNorm = $id.ToString("000")
  $matches = Get-ChildItem -Path $WorkOrderDir -Filter "$idNorm*.md" | Select-Object -First 1
  if (-not $matches) {
    Write-Error "Work order not found for id: $idNorm (dir: $WorkOrderDir)"
    exit 2
  }
  return $matches.FullName
}

$file = Resolve-WorkOrderFile $WorkOrder

$status = git status --porcelain
if ($status) {
  Write-Error "Working tree not clean. Commit/stash first."
  exit 1
}

$firstLine = (Get-Content $file -TotalCount 1)
$id = ""
$title = ""
if ($firstLine -match "^# Work Order: ([^\s]+)\s+[-—]\s+(.+)$") {
  $id = $Matches[1]
  $title = $Matches[2]
} elseif ($firstLine -match "^# Work Order: ([^\s]+)\s+(.+)$") {
  $id = $Matches[1]
  $title = $Matches[2]
} else {
  $base = [System.IO.Path]::GetFileNameWithoutExtension($file)
  $id = $base.Split('_')[0]
  $title = $base
}

$slug = ($title.ToLower() -replace "[^a-z0-9]+","-" -replace "(^-+|-+$)","")
if ($slug.Length -gt 40) { $slug = $slug.Substring(0,40) }
$branch = "codex/wo-$id-$slug"

Write-Host "============================================================"
Write-Host "Start Work Order $id — $title"
Write-Host "File: $file"
Write-Host "============================================================"

git fetch origin | Out-Null
git checkout $BaseBranch | Out-Null
git pull --ff-only origin $BaseBranch | Out-Null

git branch --list $branch | ForEach-Object { git branch -D $branch | Out-Null }
git checkout -b $branch | Out-Null

$prBlock = "6) PR creation is optional; skip if 'gh' is not available."
if ($CreatePR) {
  $hasGh = Get-Command gh -ErrorAction SilentlyContinue
  if ($hasGh) {
    $prBlock = @"
6) If GitHub CLI is available, open a PR:
   - gh pr create --title \"WO-$id: $title\" --body \"Implements Work Order $id.\" --base $BaseBranch --head $branch
"@
  }
}

$workOrderText = Get-Content $file -Raw

$prompt = @"
You are an implementation agent working inside a git repository.

CRITICAL RULES:
- Implement ONLY what is required by the Work Order (keep scope tight).
- Keep changes safe and incremental. No large refactors unless explicitly requested.
- Do NOT add assets with unclear licenses.
- Always run verification before committing.

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
5) Commit and push:
   - git add -A
   - git commit -m \"WO-$id: $title\"
   - git push -u origin HEAD
$prBlock

---- WORK ORDER ----
$workOrderText
"@

$prompt | codex exec --model $Model --full-auto --sandbox workspace-write --ask-for-approval $ApprovalMode -

Write-Host "============================================================"
Write-Host "Completed Work Order $id — $title"
Write-Host "============================================================"
