<#
.SYNOPSIS
  Run ALL Codex Work Orders sequentially (one branch + commit + push per Work Order).

USAGE (PowerShell):
  pwsh -ExecutionPolicy Bypass -File codex/scripts/run_all_work_orders.ps1 -ApprovalMode on-request
  pwsh -ExecutionPolicy Bypass -File codex/scripts/run_all_work_orders.ps1 -ApprovalMode never -CreatePR

NOTES:
  - "ApprovalMode never" aims for full automation, but your Codex rules may still prompt/deny git push.
    If git push is blocked, change codex/rules/nyano.project.rules to allow git commit/push, or run with on-request.
#>

param(
  [string]$Model = "gpt-5.3-codex",
  [string]$BaseBranch = "main",
  [ValidateSet("on-request","never","on-failure","untrusted")]
  [string]$ApprovalMode = "on-request",
  [switch]$CreatePR,
  [string]$WorkOrderDir = "codex/work_orders",
  [string]$RulesFile = "codex/rules/nyano.project.rules"
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
  $files = Get-ChildItem $dir -Filter "*.md" | Where-Object { $_.Name -notmatch "^000_TEMPLATE\.md$" } | Sort-Object Name
  if ($files.Count -eq 0) { throw "No work orders found in $dir" }
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

function Git-CheckoutBase([string]$base) {
  git fetch origin | Out-Null
  git checkout $base | Out-Null
  git pull --ff-only origin $base | Out-Null
}

function Git-NewBranch([string]$branch) {
  $exists = $false
  try { git rev-parse --verify $branch | Out-Null; $exists = $true } catch {}
  if ($exists) { git branch -D $branch | Out-Null }
  git checkout -b $branch | Out-Null
}

function Has-GH() { return [bool](Get-Command gh -ErrorAction SilentlyContinue) }

function Run-Codex([string]$workOrderPath, [string]$id, [string]$title, [string]$branch) {
  $wo = Parse-WorkOrderHeader $workOrderPath
  $raw = $wo.Raw

  $prBlock = "6) PR creation is optional; skip if 'gh' is not available."
  if ($CreatePR -and (Has-GH)) {
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
5) Commit and push:
   - git add -A
   - git commit -m "WO-${id}: $title"
   - git push -u origin HEAD
$prBlock

---- WORK ORDER ----
$raw
"@

  Write-Section "Codex running: WO-$id ($title)"
  $prompt | codex exec --model $Model --full-auto --sandbox workspace-write --ask-for-approval $ApprovalMode - | Out-Host
}

# ---------- main ----------
Assert-Command "git"
Assert-Command "codex"

if (-not (Test-Path $RulesFile)) {
  Write-Host "WARNING: rules file not found at $RulesFile. git push may prompt/deny depending on your setup."
}

Git-CleanCheck

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
  Git-CheckoutBase $BaseBranch
  Git-NewBranch $branch

  try {
    Run-Codex $f.FullName $id $title $branch
  } catch {
    Write-Host ""
    Write-Host "ERROR: Work Order $id failed. Keeping branch '$branch' for manual inspection."
    throw
  }

  Write-Section "Completed Work Order $id — $title"
}

Write-Section "ALL WORK ORDERS COMPLETED"
Write-Host "Done."
