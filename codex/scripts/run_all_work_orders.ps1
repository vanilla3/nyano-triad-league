<#
.SYNOPSIS
  Run ALL Codex Work Orders sequentially (one branch per Work Order).

USAGE (PowerShell):
  pwsh -ExecutionPolicy Bypass -File codex/scripts/run_all_work_orders.ps1 -ApprovalMode on-request

FILTERING:
  - Start from WO006:
      pwsh -ExecutionPolicy Bypass -File codex/scripts/run_all_work_orders.ps1 -StartId 006
  - Only run motion-related work orders:
      pwsh -ExecutionPolicy Bypass -File codex/scripts/run_all_work_orders.ps1 -IncludeRegex 'motion|board'

NOTES:
  - If git remote (default: origin) does not exist, this script will NOT fetch/pull/push.
  - Codex rules may still prompt/deny git push depending on your setup.
#>

param(
  [string]$Model = "gpt-5.3-codex",
  [string]$BaseBranch = "main",
  [ValidateSet("on-request","never","untrusted")]
  [string]$ApprovalMode = "on-request",
  [switch]$CreatePR,
  [string]$WorkOrderDir = "codex/work_orders",
  [string]$RulesFile = "codex/rules/nyano.project.rules",
  [string]$StartId = "",
  [string]$IncludeRegex = "",
  [string]$GitRemote = "origin"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Command([string]$cmd) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $cmd"
  }
}

function Write-Section([string]$title) {
  Write-Host ""
  Write-Host "============================================================"
  Write-Host $title
  Write-Host "============================================================"
}

function Get-WorkOrders([string]$dir) {
  if (-not (Test-Path $dir)) { throw "Work order directory not found: $dir" }

  $files = Get-ChildItem $dir -Filter "*.md" |
    Where-Object { $_.Name -notmatch "^000_TEMPLATE\.md$" } |
    Sort-Object Name

  if (-not [string]::IsNullOrEmpty($IncludeRegex)) {
    $files = $files | Where-Object { $_.FullName -match $IncludeRegex }
  }

  if (-not [string]::IsNullOrEmpty($StartId)) {
    $files = $files | Where-Object {
      $name = $_.Name
      if ($name.Length -lt 3) { return $false }
      $id = $name.Substring(0,3)
      return ($id -ge $StartId)
    }
  }

  if ($files.Count -eq 0) { throw "No work orders found in $dir (after filters)." }
  return $files
}

function Parse-WorkOrderHeader([string]$path) {
  $raw = Get-Content $path -Raw
  $firstLine = ($raw -split "`n")[0].Trim()
  $id = ""
  $title = ""

  if ($firstLine -match "#\s*Work\s*Order:\s*([0-9A-Za-z_-]+)\s*[-—]\s*(.+)$") {
    $id = $matches[1].Trim()
    $title = $matches[2].Trim()
  } elseif ($firstLine -match "#\s*Work\s*Order:\s*([0-9A-Za-z_-]+)\s+(.+)$") {
    $id = $matches[1].Trim()
    $title = $matches[2].Trim()
  } else {
    $id = (Split-Path $path -Leaf).Split("_")[0]
    $title = (Split-Path $path -Leaf).Replace(".md","")
  }

  $slug = ($title.ToLower() -replace "[^a-z0-9]+","-").Trim("-")
  if ($slug.Length -gt 40) { $slug = $slug.Substring(0,40).Trim("-") }

  return @{ Raw=$raw; Id=$id; Title=$title; Slug=$slug }
}

function Git-CleanCheck() {
  $status = (git status --porcelain)
  if ($status) { throw "Working tree is not clean. Commit/stash your changes first." }
}

function Has-Remote([string]$remote) {
  $null = git remote get-url $remote 2>$null
  return ($LASTEXITCODE -eq 0)
}

function Git-CheckoutBase([string]$base, [string]$remote, [bool]$hasRemote) {
  if ($hasRemote) {
    git fetch $remote | Out-Null
  }

  git checkout $base | Out-Null

  if ($hasRemote) {
    git pull --ff-only $remote $base | Out-Null
  }
}

function Git-NewBranch([string]$branch) {
  $exists = $false
  try { git rev-parse --verify $branch | Out-Null; $exists = $true } catch {}
  if ($exists) { git branch -D $branch | Out-Null }
  git checkout -b $branch | Out-Null
}

function Has-GH() { return [bool](Get-Command gh -ErrorAction SilentlyContinue) }

function Run-Codex([
  string]$workOrderPath,
  string]$id,
  [string]$title,
  [string]$branch,
  [bool]$hasRemote,
  [string]$remote
) {
  $wo = Parse-WorkOrderHeader $workOrderPath
  $raw = $wo.Raw

  $pushBlock = @"
5) Commit (push is optional):
   - git add -A
   - git commit -m "WO-${id}: $title"
   - (optional) git push -u $remote HEAD
"@
  if ($hasRemote) {
    $pushBlock = @"
5) Commit and push:
   - git add -A
   - git commit -m "WO-${id}: $title"
   - git push -u $remote HEAD
"@
  }

  $prBlock = "6) PR creation is optional; skip if 'gh' is not available or no remote exists."
  if ($CreatePR -and (Has-GH) -and $hasRemote) {
    $prBlock = @"
6) If GitHub CLI is available, open a PR:
   - gh pr create --title "WO-${id}: $title" --body "Implements Work Order $id." --base $BaseBranch --head $branch
"@
  }

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
   - pnpm -C apps/web e2e (only if relevant to your changes)
4) Show git status and summarize the diff (high level).
$pushBlock
$prBlock

---- WORK ORDER ----
$raw
"@

  Write-Section "Codex running: WO-$id ($title)"
  $prompt | codex exec --model $Model --sandbox workspace-write --ask-for-approval $ApprovalMode - | Out-Host
}

# ---------- main ----------
Assert-Command "git"
Assert-Command "codex"

if (-not (Test-Path $RulesFile)) {
  Write-Host "WARNING: rules file not found at $RulesFile. Command approvals may prompt/deny depending on your setup."
}

Git-CleanCheck

$hasRemote = Has-Remote $GitRemote
if (-not $hasRemote) {
  Write-Host "[info] No git remote '$GitRemote' detected. Will NOT fetch/pull/push." }

$workOrders = Get-WorkOrders $WorkOrderDir
Write-Section "Found Work Orders"
$workOrders | ForEach-Object { Write-Host " - $($_.FullName)" }

foreach ($f in $workOrders) {
  $info = Parse-WorkOrderHeader $f.FullName
  $id = $info.Id
  $title = $info.Title
  $slug = $info.Slug
  $branch = "codex/wo-$id-$slug"

  Write-Section "Start Work Order $id — $title"
  Git-CheckoutBase $BaseBranch $GitRemote $hasRemote
  Git-NewBranch $branch

  try {
    Run-Codex $f.FullName $id $title $branch $hasRemote $GitRemote
  } catch {
    Write-Host ""
    Write-Host "ERROR: Work Order $id failed. Keeping branch '$branch' for manual inspection."
    throw
  }

  Write-Section "Completed Work Order $id — $title"
}

Write-Section "ALL WORK ORDERS COMPLETED"
Write-Host "Done."
