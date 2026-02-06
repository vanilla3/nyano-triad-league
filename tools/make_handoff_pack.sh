#!/usr/bin/env bash
set -euo pipefail

OUTDIR="${1:-handoff_pack}"
ZIPNAME="${2:-nyano-triad-league-frontend-handoff.zip}"

rm -rf "$OUTDIR"
mkdir -p "$OUTDIR/_meta"

cp -f tools/handoff_pack/README.md "$OUTDIR/_meta/README.md" || true
cp -f tools/handoff_pack/Requested_Materials_Checklist.md "$OUTDIR/_meta/Requested_Materials_Checklist.md" || true
cp -f tools/handoff_pack/Screenshots_Guide.md "$OUTDIR/_meta/Screenshots_Guide.md" || true

# apps/web
( cd apps/web && find . -maxdepth 4 -print ) > "$OUTDIR/apps_web_tree.txt"
cp -f apps/web/package.json "$OUTDIR/apps_web_package.json"

cp -R apps/web/src/pages "$OUTDIR/apps_web_pages"
cp -R apps/web/src/components "$OUTDIR/apps_web_components"
( cd apps/web/src/components && find . -maxdepth 3 -print ) > "$OUTDIR/apps_web_components_tree.txt"

# configs
for f in apps/web/tailwind.config.* apps/web/postcss.config.* apps/web/vite.config.*; do
  if [ -f "$f" ]; then cp -f "$f" "$OUTDIR/"; fi
done

# global css
mkdir -p "$OUTDIR/global_css"
for f in apps/web/src/index.css apps/web/src/globals.css; do
  if [ -f "$f" ]; then cp -f "$f" "$OUTDIR/global_css/"; fi
done
if [ -d "apps/web/src/styles" ]; then cp -R apps/web/src/styles "$OUTDIR/global_css/styles"; fi

# assets
if [ -f "apps/web/src/lib/nyano_assets.ts" ]; then cp -f apps/web/src/lib/nyano_assets.ts "$OUTDIR/nyano_assets.ts"; fi

# triad-engine
if [ -d "packages/triad-engine/src" ]; then
  ( cd packages/triad-engine/src && find . -maxdepth 3 -print ) > "$OUTDIR/triad_engine_src_tree.txt"
  cp -R packages/triad-engine/src "$OUTDIR/triad_engine_src"
  [ -f packages/triad-engine/package.json ] && cp -f packages/triad-engine/package.json "$OUTDIR/triad_engine_package.json" || true
  [ -f packages/triad-engine/tsconfig.json ] && cp -f packages/triad-engine/tsconfig.json "$OUTDIR/triad_engine_tsconfig.json" || true
fi

# screenshots optional
if [ -d "screenshots" ]; then cp -R screenshots "$OUTDIR/screenshots"; fi

# zip
rm -f "$ZIPNAME"
( cd "$OUTDIR" && zip -r "../$ZIPNAME" . ) >/dev/null
echo "OK -> $ZIPNAME"
