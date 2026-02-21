#!/usr/bin/env bash
set -euo pipefail

# Run all Codex Work Orders sequentially.
# By default this is safe for local-only repos (no remote required).
# If a remote (default: origin) exists, the script can optionally push and open PRs.

MODEL="${MODEL:-gpt-5.3-codex}"
BASE_BRANCH="${BASE_BRANCH:-main}"
APPROVAL_MODE="${APPROVAL_MODE:-on-request}"     # on-request|never|untrusted
SANDBOX_MODE="${SANDBOX_MODE:-workspace-write}"  # read-only|workspace-write|danger-full-access
CREATE_PR="${CREATE_PR:-0}"                       # 1 to attempt gh pr create (requires gh + remote)
WORK_ORDER_DIR="${WORK_ORDER_DIR:-codex/work_orders}"

START_ID="${START_ID:-}"            # e.g. 006 to start from WO006
INCLUDE_GLOB="${INCLUDE_GLOB:-}"    # regex for grep -E (e.g. motion|board)
GIT_REMOTE="${GIT_REMOTE:-origin}"  # remote name (default: origin)

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing command: $1" >&2; exit 1; }; }

need git
need codex

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree not clean. Commit/stash first." >&2
  exit 1
fi

has_remote=0
if git remote get-url "${GIT_REMOTE}" >/dev/null 2>&1; then
  has_remote=1
fi

has_gh=0
if command -v gh >/dev/null 2>&1; then
  has_gh=1
fi

mapfile -t files < <(ls -1 "${WORK_ORDER_DIR}"/*.md 2>/dev/null \
  | grep -v "000_TEMPLATE.md" \
  | sort)

# Optional filtering by regex (grep -E)
if [[ -n "${INCLUDE_GLOB}" ]]; then
  mapfile -t files < <(printf "%s\n" "${files[@]}" | grep -E "${INCLUDE_GLOB}" || true)
fi

# Optional start id (lexicographic on 3-digit prefix)
if [[ -n "${START_ID}" ]]; then
  mapfile -t files < <(printf "%s\n" "${files[@]}" | awk -v start="${START_ID}" '{
    base=$0; sub(/^.*\//,"",base); id=substr(base,1,3); if (id>=start) print $0;
  }')
fi

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No work orders found in ${WORK_ORDER_DIR} (after filters)." >&2
  exit 1
fi

if [[ "${has_remote}" == "0" ]]; then
  echo "[info] No git remote '${GIT_REMOTE}' detected. Will NOT fetch/pull/push."
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

  git checkout "${BASE_BRANCH}"

  if [[ "${has_remote}" == "1" ]]; then
    git fetch "${GIT_REMOTE}"
    git pull --ff-only "${GIT_REMOTE}" "${BASE_BRANCH}"
  fi

  if git rev-parse --verify "${branch}" >/dev/null 2>&1; then
    git branch -D "${branch}"
  fi
  git checkout -b "${branch}"

  push_block="5) Commit (push is optional):\n   - git add -A\n   - git commit -m \"WO-${id}: ${title}\"\n   - (optional) git push -u ${GIT_REMOTE} HEAD"
  if [[ "${has_remote}" == "1" ]]; then
    push_block="5) Commit and push:\n   - git add -A\n   - git commit -m \"WO-${id}: ${title}\"\n   - git push -u ${GIT_REMOTE} HEAD"
  fi

  pr_block="6) PR creation is optional; skip if 'gh' is not available or no remote exists."
  if [[ "${CREATE_PR}" == "1" && "${has_gh}" == "1" && "${has_remote}" == "1" ]]; then
    pr_block=$(cat <<EOB
6) If GitHub CLI is available, open a PR:
   - gh pr create --title "WO-${id}: ${title}" --body "Implements Work Order ${id}." --base ${BASE_BRANCH} --head ${branch}
EOB
)
  fi

  prompt=$(cat <<EOP
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
EOP
)

  echo "$prompt" | codex exec --model "${MODEL}" --sandbox "${SANDBOX_MODE}" --ask-for-approval "${APPROVAL_MODE}" -

  echo "============================================================"
  echo "Completed Work Order ${id} — ${title}"
  echo "============================================================"
done

echo "ALL WORK ORDERS COMPLETED"
