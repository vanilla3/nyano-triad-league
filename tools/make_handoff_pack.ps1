param(
  [string]$OutDir = "handoff_pack",
  [string]$ZipName = "nyano-triad-league-frontend-handoff.zip"
)

$ErrorActionPreference = "Stop"

function CopyIfExists([string]$Path, [string]$Dest) {
  if (Test-Path $Path) {
    Copy-Item $Path $Dest -Recurse -Force
  }
}

# clean
if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
New-Item -ItemType Directory -Path $OutDir | Out-Null

# docs (template)
New-Item -ItemType Directory -Path "$OutDir\_meta" | Out-Null
CopyIfExists "tools\handoff_pack\README.md" "$OutDir\_meta\README.md"
CopyIfExists "tools\handoff_pack\Requested_Materials_Checklist.md" "$OutDir\_meta\Requested_Materials_Checklist.md"
CopyIfExists "tools\handoff_pack\Screenshots_Guide.md" "$OutDir\_meta\Screenshots_Guide.md"

# apps/web structure
tree "apps\web" /F /A > "$OutDir\apps_web_tree.txt"
CopyIfExists "apps\web\package.json" "$OutDir\apps_web_package.json"

# pages / components
CopyIfExists "apps\web\src\pages" "$OutDir\apps_web_pages"
CopyIfExists "apps\web\src\components" "$OutDir\apps_web_components"
if (Test-Path "apps\web\src\components") {
  tree "apps\web\src\components" /F /A > "$OutDir\apps_web_components_tree.txt"
}

# Tailwind / PostCSS configs (if exist)
Get-ChildItem "apps\web" -File -Filter "tailwind.config.*" -ErrorAction SilentlyContinue | ForEach-Object {
  Copy-Item $_.FullName "$OutDir\" -Force
}
Get-ChildItem "apps\web" -File -Filter "postcss.config.*" -ErrorAction SilentlyContinue | ForEach-Object {
  Copy-Item $_.FullName "$OutDir\" -Force
}
Get-ChildItem "apps\web" -File -Filter "vite.config.*" -ErrorAction SilentlyContinue | ForEach-Object {
  Copy-Item $_.FullName "$OutDir\" -Force
}

# global css collection
New-Item -ItemType Directory -Path "$OutDir\global_css" | Out-Null
CopyIfExists "apps\web\src\index.css" "$OutDir\global_css\index.css"
CopyIfExists "apps\web\src\globals.css" "$OutDir\global_css\globals.css"
CopyIfExists "apps\web\src\styles" "$OutDir\global_css\styles"

# assets
CopyIfExists "apps\web\src\lib\nyano_assets.ts" "$OutDir\nyano_assets.ts"

# triad-engine
if (Test-Path "packages\triad-engine\src") {
  tree "packages\triad-engine\src" /F /A > "$OutDir\triad_engine_src_tree.txt"
  CopyIfExists "packages\triad-engine\src" "$OutDir\triad_engine_src"
  CopyIfExists "packages\triad-engine\package.json" "$OutDir\triad_engine_package.json"
  CopyIfExists "packages\triad-engine\tsconfig.json" "$OutDir\triad_engine_tsconfig.json"
}

# screenshots (optional)
CopyIfExists "screenshots" "$OutDir\screenshots"

# zip
if (Test-Path $ZipName) { Remove-Item $ZipName -Force }
Compress-Archive -Path "$OutDir\*" -DestinationPath $ZipName -Force

Write-Host "OK -> $ZipName"
