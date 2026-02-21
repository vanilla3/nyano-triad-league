#!/usr/bin/env bash
set -euo pipefail

# Run a single Work Order under codex/work_orders.
#
# Usage:
#   codex/scripts/run_work_order.sh 006
#   codex/scripts/run_work_order.sh codex/work_orders/006_some_task.md
#

MODEL="${MODEL:-gpt-5.3-codex}"
BASE_BRANCH="${BASE_BRANCH:-main}"
APPROVAL_MODE="${APPROVAL_MODE:-on-request}"  # on-request|never|untrusted
CREATE_PR="${CREATE_PR:-0}"                    # 1 to attempt gh pr create
WORK_ORDER_DIR="${WORK_ORDER_DIR:-codex/work_orders}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing command: $1" >&2; exit 1; }; }

need git
need codex

case "$APPROVAL_MODE" in
  on-request|never|untrusted) ;;
  *)
    echo "Invalid APPROVAL_MODE=$APPROVAL_MODE (expected: on-request|never|untrusted)" >&2
    exit 2
    ;;
 esac


if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <id|path>" >&2
  exit 2
fi

input="$1"
file=""

if [[ -f "$input" ]]; then
  file="$input"
else
  # Treat input as an ID prefix.
  # Accept: 6, 06, 006
  id_raw="$input"
  id_norm=$(printf "%03d" "$((10#$id_raw))" 2>/dev/null || true)
  if [[ -z "$id_norm" ]]; then
    echo "Invalid work order id: $input" >&2
    exit 2
  fi
  match=$(ls -1 "${WORK_ORDER_DIR}/${id_norm}"*.md 2>/dev/null | head -n 1 || true)
  if [[ -z "$match" ]]; then
    echo "Work order not found for id: ${id_norm} (dir: ${WORK_ORDER_DIR})" >&2
    exit 2
  fi
  file="$match"
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree not clean. Commit/stash first." >&2
  exit 1
fi

first="$(head -n 1 "$file" | sed 's/\r$//')"
id=""
title=""
if [[ "$first" =~ ^#\ Work\ Order:\ ([^[:space:]]+)[[:space:]]+[-—][[:space:]](.+)$ ]]; then
  id="${BASH_REMATCH[1]}"
  title="${BASH_REMATCH[2]}"
elif [[ "$first" =~ ^#\ Work\ Order:\ ([^[:space:]]+)[[:space:]]+(.+)$ ]]; then
  id="${BASH_REMATCH[1]}"
  title="${BASH_REMATCH[2]}"
else
  base="$(basename "$file" .md)"
  id="${base%%_*}"
  title="$base"
fi

slug="$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-+|-+$//g' | cut -c1-40)"
branch="codex/wo-${id}-${slug}"

has_gh=0
if command -v gh >/dev/null 2>&1; then
  has_gh=1
fi

echo "============================================================"
echo "Start Work Order ${id} — ${title}"
echo "File: ${file}"
echo "============================================================"

git fetch origin
git checkout "${BASE_BRANCH}"
git pull --ff-only origin "${BASE_BRANCH}"

if git rev-parse --verify "${branch}" >/dev/null 2>&1; then
  git branch -D "${branch}"
fi
git checkout -b "${branch}"

pr_block="6) PR creation is optional; skip if 'gh' is not available."
if [[ "${CREATE_PR}" == "1" && "${has_gh}" == "1" ]]; then
  pr_block=$(cat <<EOF
6) If GitHub CLI is available, open a PR:
   - gh pr create --title "WO-${id}: ${title}" --body "Implements Work Order ${id}." --base ${BASE_BRANCH} --head ${branch}
EOF
)
fi

prompt=$(cat <<EOF
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
   - git commit -m "WO-${id}: ${title}"
   - git push -u origin HEAD
${pr_block}

---- WORK ORDER ----
$(cat "$file")
EOF
)

echo "$prompt" | codex exec --model "${MODEL}" --full-auto --sandbox workspace-write --ask-for-approval "${APPROVAL_MODE}" -

echo "============================================================"
echo "Completed Work Order ${id} — ${title}"
echo "============================================================"
