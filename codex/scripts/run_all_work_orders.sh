#!/usr/bin/env bash
set -euo pipefail

MODEL="${MODEL:-gpt-5.3-codex}"
BASE_BRANCH="${BASE_BRANCH:-main}"
APPROVAL_MODE="${APPROVAL_MODE:-on-request}"  # untrusted|on-request|never
CREATE_PR="${CREATE_PR:-0}"                    # 1 to attempt gh pr create
WORK_ORDER_DIR="${WORK_ORDER_DIR:-codex/work_orders}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing command: $1" >&2; exit 1; }; }

need git
need codex

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree not clean. Commit/stash first." >&2
  exit 1
fi

mapfile -t files < <(ls -1 "${WORK_ORDER_DIR}"/*.md 2>/dev/null | grep -v "000_TEMPLATE.md" | sort)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "No work orders found in ${WORK_ORDER_DIR}" >&2
  exit 1
fi

has_gh=0
if command -v gh >/dev/null 2>&1; then
  has_gh=1
fi

has_origin=0
if git remote get-url origin >/dev/null 2>&1; then
  has_origin=1
else
  echo "NOTE: git remote 'origin' not found. Skipping fetch/pull/push steps."
fi

for f in "${files[@]}"; do
  first="$(head -n 1 "$f" | sed 's/\r$//')"
  id=""
  title=""
  if [[ "$first" =~ ^#\ Work\ Order:\ ([^[:space:]]+)[[:space:]]+[-—][[:space:]](.+)$ ]]; then
    id="${BASH_REMATCH[1]}"
    title="${BASH_REMATCH[2]}"
  elif [[ "$first" =~ ^#\ Work\ Order:\ ([^[:space:]]+)[[:space:]]+(.+)$ ]]; then
    id="${BASH_REMATCH[1]}"
    title="${BASH_REMATCH[2]}"
  else
    base="$(basename "$f" .md)"
    id="${base%%_*}"
    title="$base"
  fi
  slug="$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-+|-+$//g' | cut -c1-40)"
  branch="codex/wo-${id}-${slug}"

  echo "============================================================"
  echo "Start Work Order ${id} — ${title}"
  echo "============================================================"

  if [[ "${has_origin}" == "1" ]]; then
    git fetch origin
    git checkout "${BASE_BRANCH}"
    git pull --ff-only origin "${BASE_BRANCH}"
  else
    git checkout "${BASE_BRANCH}"
  fi

  if git rev-parse --verify "${branch}" >/dev/null 2>&1; then
    git branch -D "${branch}"
  fi
  git checkout -b "${branch}"

  push_block=$(cat <<EOF
5) Commit:
   - git add -A
   - git commit -m "WO-${id}: ${title}"
   - (No git remote 'origin' found; skip push/PR and leave the branch locally.)
EOF
)

  pr_block="6) PR creation is optional; skip if 'gh' is not available."
  if [[ "${has_origin}" == "1" ]]; then
    push_block=$(cat <<EOF
5) Commit and push:
   - git add -A
   - git commit -m "WO-${id}: ${title}"
   - git push -u origin HEAD
EOF
)
  fi

  if [[ "${CREATE_PR}" == "1" && "${has_gh}" == "1" && "${has_origin}" == "1" ]]; then
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
${push_block}
${pr_block}

---- WORK ORDER ----
$(cat "$f")
EOF
)

  echo "$prompt" | codex exec --model "${MODEL}" --full-auto --sandbox workspace-write --ask-for-approval "${APPROVAL_MODE}" -

  echo "============================================================"
  echo "Completed Work Order ${id} — ${title}"
  echo "============================================================"
done

echo "ALL WORK ORDERS COMPLETED"
