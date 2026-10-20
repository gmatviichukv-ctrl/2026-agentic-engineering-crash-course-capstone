@AGENTS.md

## Claude Code

- Hooks in `.claude/hooks/` block `.env*` and log every tool call to `.agent-log/actions.jsonl` (`pnpm agent:log`).
- The reviewer is a separate agent: `.claude/agents/reviewer.md`. The maker never reviews its own diff.
