# Project rules — ВелоПес (fwdays capstone)

Б/у велосипеди й запчастини + оренда велосипеда з екіпіруванням для собаки. Що будуємо — `docs/spec.md`.
Специфікація — джерело правди: якщо код і spec розходяться, зупинись і скажи, не «підганяй» тест.

## Commands (pnpm only — never npm or yarn)

- `pnpm check` — typecheck + lint + tests. Run it before saying a task is done and quote the output.
- `pnpm dev` — dev server on http://localhost:3000. Never start a second one.
- `pnpm loop` — runs `pnpm check`, hands failures to a headless agent, repeats (max 5).
- `pnpm review` — separate reviewer session over the branch diff → `docs/reviews/`.

## Definition of done

- `pnpm check` is green; every requirement F1–F4 from `docs/spec.md` has a test that names it (`F2: …`).
- Evidence, not claims: report the command you ran and the test count.

## Conventions

- Pure logic in `lib/` (no React / Next imports), each file with a `*.test.ts` beside it.
- Money is integer **cents** inside `lib/`; convert to € only for display.
- Dates are `YYYY-MM-DD` strings; never use `new Date()` inside `lib/` — "today" is a parameter.
- Route handlers in `app/api/**/route.ts` stay thin: parse → call `lib/` → respond.
- Ukrainian UI copy and error messages; English code, comments and commit messages.
- Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`), one logical change per commit.

## Boundaries

- Ask before: adding a dependency, editing configs, `.claude/**`, CI, or `docs/spec.md`.
- Never: touch `.env*` (a hook blocks it), delete or weaken tests to get green, `git push`, `rm -rf`.
- Do not edit `.agent-log/` — it is the observability layer written by hooks.
