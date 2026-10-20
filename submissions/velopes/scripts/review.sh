#!/usr/bin/env bash
# maker ≠ checker: a SEPARATE headless session with the reviewer agent reviews the diff.
# The reviewer has read-only tools (see .claude/agents/reviewer.md); output goes to docs/reviews/.
#
#   pnpm review                # diff of this project vs the first commit of the branch
#   pnpm review <base-ref>
set -uo pipefail
cd "$(dirname "$0")/.."

BASE="${1:-$(git log --format=%H --reverse -- . | head -1)}"
mkdir -p docs/reviews
OUT="docs/reviews/$(date -u +%Y%m%dT%H%M%SZ)-review.md"

{
  echo "# Review — $(date -u +%FT%TZ)"
  echo
  echo "- reviewer: \`.claude/agents/reviewer.md\` via \`claude -p --agent reviewer\` (separate session, read-only tools)"
  echo "- diff: \`git diff ${BASE:0:7}..HEAD -- .\` ($(git diff --shortstat "$BASE"..HEAD -- . | xargs))"
  echo
} >"$OUT"

claude -p --agent reviewer \
  --allowedTools "Read" "Grep" "Glob" "Bash(git diff *)" "Bash(git log *)" "Bash(pnpm check)" "Bash(pnpm test *)" \
  --disallowedTools "Edit" "Write" "NotebookEdit" \
  -- "Review this project's changes: run \`git diff $BASE..HEAD -- .\` (skip pnpm-lock.yaml and docs/runs, docs/reviews). Follow your instructions and output format." \
  >>"$OUT" 2>&1

echo "review written to $OUT"
grep -m1 -E "^## Verdict" "$OUT" || echo "(no verdict line found — read the file)"
