#!/usr/bin/env bash
# check-deferred-agents.sh
# Liệt kê các agent có status: script_deferred hoặc partial + blocker
# Usage: ./scripts/check-deferred-agents.sh
# Run đầu mỗi session để audit deferred work

set -euo pipefail

AGENTS_DIR="$(dirname "$0")/../.claude/agents"

if [ ! -d "$AGENTS_DIR" ]; then
  echo "ERROR: $AGENTS_DIR not found. Run from istudy-cms repo root."
  exit 1
fi

echo "=== Deferred / Partial Agents Audit ==="
echo ""

found_any=0

for f in "$AGENTS_DIR"/*.md; do
  [ -f "$f" ] || continue
  name=$(grep -m1 '^name:' "$f" | sed 's/name: *//' || true)
  status=$(grep -m1 '^status:' "$f" | sed 's/status: *//' || true)
  blocker=$(grep -m1 '^blocker:' "$f" | sed 's/blocker: *//' || true)

  if [ "$status" = "script_deferred" ] || [ "$status" = "partial" ]; then
    echo "Agent:   $name"
    echo "Status:  $status"
    echo "Blocker: $blocker"
    echo "File:    $f"
    echo "---"
    found_any=1
  fi
done

if [ "$found_any" = "0" ]; then
  echo "All agents ready. No deferred work."
fi

echo ""
echo "Total ready agents:"
grep -l '^status: ready$' "$AGENTS_DIR"/*.md 2>/dev/null | wc -l
