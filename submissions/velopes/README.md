# ВелоПес 🚲🐕

Capstone для fwdays · Crash Course: Agentic Engineering — **Halyna Parashchuk**.

Вебзастосунок для **оренди велосипеда разом з екіпіруванням для собаки** (причіп, кошик, кріплення для повідця,
жилет) і для пошуку **реальних прокатів велосипедів поруч** через Google Maps / Places.

- вибір велосипеда, дат і екіпірування → живий розрахунок ціни (від 7 днів −10 %) → бронювання з перевіркою
  доступності (причіп — лише до велосипеда з фаркопом);
- «Прокати поруч»: геолокація або місто → найближчі прокати з Google з відстанню і посиланням на Google Maps.

Без акаунтів, оплати й бази даних — масштаб свідомо обрізано (див. `docs/spec.md`).

## Запуск

```bash
pnpm install
cp .env.example .env.local   # і встав свій ключ Google Maps Places API (New) — без нього пошук прокатів вимкнено
pnpm dev                      # http://localhost:3000
pnpm check                    # typecheck + lint + 37 тестів (мережа не потрібна: Google підмінено фікстурою)
```

## Що взято готовим, а що написано тут

README capstone дозволяє взяти харнес із демо заняття 1. Ми так і зробили — і ось чесний перелік.

| Взято з [`…-day01`](https://github.com/koldovsky/2026-agentic-engineering-crash-course-day01) | Як |
|---|---|
| `.claude/hooks/protect-env.mjs`, `.claude/hooks/log-action.mjs` | без змін |
| `scripts/agent-log-summary.mjs`, `scripts/hooks-selftest.mjs` | без змін |
| `.claude/settings.json` | взято, прибрано MCP-сервери демо, додано 3 дозволи |
| конфіги `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `next.config.ts`, `postcss.config.mjs`, `app/globals.css`, `.gitignore`, `.agent-log/README.md` | без змін (типовий скелет Next.js 16 + Vitest) |
| версії залежностей у `package.json` | ті самі, що в демо; скрипти свої |
| форма `AGENTS.md` (розділи Commands / Definition of done / Boundaries) | структуру взято за зразок, **зміст** — під цей проєкт |

**Написано в цьому проєкті:** `docs/spec.md`, `docs/plan.md`, усі тести, `lib/rental.ts`, `lib/places.ts`, API
`/api/bookings` і `/api/shops`, UI, `server/bookings-store.ts`, дані, `scripts/agent-loop.sh`, `scripts/review.sh`,
`.claude/agents/reviewer.md`, журнал довіри, логи прогонів і рев'ю.

## Як це будувалось агентно

| Що | Де дивитись |
|---|---|
| Специфікація до коду (SDD) і її зміни v1 → v1.1 → v2 | `docs/spec.md` (журнал змін унизу), `docs/plan.md` |
| Правила для агента | `AGENTS.md`, `CLAUDE.md` |
| Хуки: блок `.env`, журнал кожної дії | `.claude/hooks/`, `.agent-log/actions.jsonl`, `pnpm agent:log`, `pnpm hooks:selftest` |
| Цикл мейкера до зеленого | `scripts/agent-loop.sh` (`pnpm loop`), прогони — `docs/runs/` |
| Окремий агент-рецензент | `.claude/agents/reviewer.md`, `scripts/review.sh` (`pnpm review`), вивід — `docs/reviews/` |
| Журнал рівнів довіри | `docs/autonomy-log.md` |
