#!/usr/bin/env bash
set -euo pipefail

# Run a single Codex Work Order by file path or numeric ID.
# Examples:
#   ./codex/scripts/run_work_order.sh 006
#   ./codex/scripts/run_work_order.sh codex/work_orders/006_motion_language_tokens.md

MODEL="${MODEL:-gpt-5.3-codex}"
APPROVAL_MODE="${APPROVAL_MODE:-on-request}"   # on-request|never|untrusted
SANDBOX_MODE="${SANDBOX_MODE:-workspace-write}" # read-only|workspace-write|danger-full-access
WORK_ORDER_DIR="${WORK_ORDER_DIR:-codex/work_orders}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing command: $1" >&2; exit 1; }; }
need codex

arg="${1:-}"
if [[ -z "$arg" ]]; then
  echo "Usage: $0 <id|path>" >&2
  exit 2
fi

wo=""
if [[ "$arg" =~ ^[0-9]{3}$ ]]; then
  wo=$(ls -1 "${WORK_ORDER_DIR}/${arg}"_*.md 2>/dev/null | head -n 1 || true)
else
  wo="$arg"
fi

if [[ -z "$wo" || ! -f "$wo" ]]; then
  echo "Work Order not found: $arg" >&2
  exit 1
fi

first="$(head -n 1 "$wo" | sed 's/\r$//')"
id="$(basename "$wo" | cut -c1-3)"
title="$(basename "$wo" .md)"

if [[ "$first" =~ ^#\ Work\ Order:\ ([^[:space:]]+)[[:space:]]+[-—][[:space:]](.+)$ ]]; then
  id="${BASH_REMATCH[1]}"
  title="${BASH_REMATCH[2]}"
elif [[ "$first" =~ ^#\ Work\ Order:\ ([^[:space:]]+)[[:space:]]+(.+)$ ]]; then
  id="${BASH_REMATCH[1]}"
  title="${BASH_REMATCH[2]}"
fi

echo "============================================================"
echo "Run Work Order ${id} — ${title}"
echo "File: ${wo}"
echo "============================================================"

prompt=$(cat <<EOF
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
$(cat "$wo")
EOF
)

echo "$prompt" | codex exec --model "$MODEL" --sandbox "$SANDBOX_MODE" --ask-for-approval "$APPROVAL_MODE" -
