#!/usr/bin/env bash
# Loop engineering: run the deterministic gate, hand the failure to a headless agent, repeat.
# Stops on green or after MAX_ITER. Each run leaves a log in docs/runs/<timestamp>.md.
#
#   pnpm loop                       # goal = make `pnpm check` green
#   pnpm loop "implement lib/search.ts per docs/spec.md F1"
#   MAX_ITER=3 AGENT="claude -p" pnpm loop
set -uo pipefail
cd "$(dirname "$0")/.."

MAX_ITER="${MAX_ITER:-5}"
# Override with AGENT="some-cli -p" to use another tool; default is Claude Code headless.
run_agent() {
  if [ -n "${AGENT:-}" ]; then $AGENT "$1"; return; fi
  claude -p --permission-mode acceptEdits \
    --allowedTools "Read" "Edit" "Write" "Glob" "Grep" "Bash(pnpm check)" "Bash(pnpm test *)" \
    -- "$1"
}
GOAL="${1:-make pnpm check green}"
mkdir -p docs/runs
LOG="docs/runs/$(date -u +%Y%m%dT%H%M%SZ)-loop.md"

{
  echo "# Loop run — $(date -u +%FT%TZ)"
  echo
  echo "- goal: $GOAL"
  echo "- max iterations: $MAX_ITER"
  echo "- agent: \`${AGENT:-claude -p}\` (headless, fresh session per iteration)"
  echo
} >"$LOG"

for i in $(seq 1 "$MAX_ITER"); do
  OUT="$(pnpm check 2>&1)"
  CODE=$?
  SUMMARY="$(printf '%s\n' "$OUT" | grep -E 'Tests |Test Files|error TS|✗|×|FAIL|problems?' | head -20)"
  {
    echo "## Iteration $i — \`pnpm check\` exit $CODE"
    echo
    echo '```'
    printf '%s\n' "${SUMMARY:-<no summary lines>}"
    echo '```'
    echo
  } >>"$LOG"

  if [ "$CODE" -eq 0 ]; then
    echo "**Result: green after $((i - 1)) agent iteration(s).**" >>"$LOG"
    echo "green after $((i - 1)) agent iteration(s) — log: $LOG"
    exit 0
  fi

  PROMPT="You are the MAKER in a loop. Goal: $GOAL.
Follow AGENTS.md and docs/spec.md exactly. Do not edit tests, docs/spec.md, configs or .claude/**.
\`pnpm check\` currently fails (exit $CODE). Last 80 lines of its output:
$(printf '%s\n' "$OUT" | tail -80)

Make the smallest change that moves toward green, run \`pnpm check\` yourself, then reply with
3-5 lines: what you changed and what (if anything) is still red."
  echo "### Agent says" >>"$LOG"
  echo >>"$LOG"
  run_agent "$PROMPT" 2>&1 | tail -15 | sed 's/^/> /' >>"$LOG"
  echo >>"$LOG"
done

FINAL="$(pnpm check >/dev/null 2>&1; echo $?)"
echo "**Result: stopped at MAX_ITER=$MAX_ITER, final check exit $FINAL — needs a human.**" >>"$LOG"
echo "stopped after $MAX_ITER iterations (exit $FINAL) — log: $LOG"
exit 1
