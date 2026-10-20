# ВелоПес 🚲🐕

Capstone для fwdays · Crash Course: Agentic Engineering — **Halyna Parashchuk**.

Невеликий вебзастосунок:

- **`/`** — пошук б/у велосипедів і запчастин: текст, категорія, місто, розмір рами, ціна, сортування;
- **`/rent`** — оренда велосипеда з екіпіруванням для собаки (причіп, кошик, кріплення для повідця, жилет):
  дати → живий розрахунок ціни (від 7 днів −10 %) → бронювання з перевіркою доступності.

Без акаунтів, оплати й бази даних — масштаб свідомо обрізано (див. `docs/spec.md`).

## Запуск

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm check        # typecheck + lint + 33 тести
```

## Як це будувалось агентно

| Що | Де дивитись |
|---|---|
| Специфікація до коду (SDD) і її зміни | `docs/spec.md` (журнал змін унизу), `docs/plan.md` |
| Правила для агента | `AGENTS.md`, `CLAUDE.md` |
| Хуки: блок `.env`, журнал кожної дії | `.claude/hooks/`, `.agent-log/actions.jsonl`, `pnpm agent:log`, `pnpm hooks:selftest` |
| Цикл мейкера до зеленого | `scripts/agent-loop.sh` (`pnpm loop`), прогін — `docs/runs/` |
| Окремий агент-рецензент | `.claude/agents/reviewer.md`, `scripts/review.sh` (`pnpm review`), вивід — `docs/reviews/` |
| Журнал рівнів довіри | `docs/autonomy-log.md` |

Скрипти `pnpm loop` і `pnpm review` викликають Claude Code headless (`claude -p`); іншу CLI можна підставити
через змінну `AGENT`.
