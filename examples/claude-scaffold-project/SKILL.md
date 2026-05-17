---
name: scaffold-project
version: 0.1.0
description: |
  Разворачивает скелет нового проекта за один диалог: создаёт CLAUDE.md,
  README, DEVELOPMENT.md, CHANGELOG, incidents.md, rfc/, docs/decisions/,
  private/backlog/ + первый BL-001, .gitignore, .env.example. По выбору
  подключает extension-pack под стек (node-cli, python-mcp). Делает
  git init и первый коммит. После этого все следующие задачи в проекте
  идут через скилл dev-workflow.

  Главная фича — петля обратной связи. При работе в любом проекте, если
  впервые появляется reusable инфра-паттерн (event analytics, auth,
  error tracking, payments, CI, secret-guard, feature flags, db
  migrations) — Claude обязан до коммита предложить вынести его как
  extension-pack для будущих проектов.

  Trigger when: пользователь хочет создать новый проект. Фразы:
  «новый проект», «начинаем новый проект», «init project», «scaffold
  проект», «развернуть проект», «создать новый проект», «новый
  подпроект», «start a new project», «scaffold X», или явный
  /scaffold-project. Также скилл срабатывает обратной стороной — при
  первом появлении в проекте инфра-паттерна, который должен стать
  extension-pack'ом (см. секцию Self-update triggers).
license: MIT
compatibility: claude-code
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - TodoWrite
---

# scaffold-project — bootstrap нового проекта

Когда пользователь говорит «новый проект» — этот скилл разворачивает
полный скелет за один диалог. После scaffold все задачи в проекте идут
через `dev-workflow`.

## Шаг 1 — pre-checks

Перед стартом скилл проверяет целевой каталог:

| Состояние | Действие |
|---|---|
| Каталог не существует / пустой | Продолжаем (mkdir создаст). |
| Не пуст, нет `CLAUDE.md`/`package.json`/`pyproject.toml` | Продолжаем, но предупреждаем «каталог не пуст, продолжить?». |
| Есть `package.json` или `pyproject.toml` без `CLAUDE.md` | Предлагаем **extension mode**: добавить недостающие base-файлы, не трогая существующее. |
| Есть `CLAUDE.md` | Отказ — проект уже инициализирован. |

## Шаг 2 — диалог

Скилл задаёт **четыре** вопроса. Не больше, не меньше.

1. **Имя проекта** (kebab-case). Валидация: `^[a-z][a-z0-9-]{1,40}$`.
   Не проходит — спрашиваем заново.
2. **Однострочное описание** — 1 предложение, чем проект полезен.
   Если пользователь хочет дать развёрнутый scope — приветствуется,
   уйдёт в `{{SCOPE_DESCRIPTION}}` as-is.
3. **Стек**:
   - `node-cli` — Node 20+ CLI или библиотека, тесты через `node --test`.
   - `python-mcp` — Python MCP-сервер или скрипт, тесты через `pytest`.
   - `both` — оба extension'а.
   - `none` — только base, никакого языкового скелета.
4. **Внешние сервисы, которые предполагаются сразу** (Notion / Gmail /
   Stripe / Sentry / другое). Список справочный — попадёт в
   `.env.example` и в комментарий к BL-001. Если ничего — `none`.

## Шаг 3 — preview + approve

Перед записью — плоский список файлов, которые скилл создаст:

```
<project-root>/
├── CLAUDE.md
├── README.md
├── DEVELOPMENT.md
├── CHANGELOG.md
├── incidents.md
├── .gitignore
├── .env.example
├── rfc/_README.md
├── docs/decisions/_README.md
├── private/backlog/_README.md
├── private/backlog/BL-001-scope-and-mvp.md
├── package.json                          (если node-cli)
├── engine/index.js                       (если node-cli)
├── engine/index.test.js                  (если node-cli)
├── pyproject.toml                        (если python-mcp)
├── server.py                             (если python-mcp)
└── tests/test_smoke.py                   (если python-mcp)
```

**Жду явного «ok» от пользователя.**

## Шаг 4 — запись

По approve:

0. **Pre-flight check.** До любых mkdir / write:
   - `git --version` отвечает (git установлен).
   - `git config --get user.name` и `git config --get user.email` оба
     возвращают значение.
   Если что-то из этого не выполнено — отказ с понятным сообщением
   («настрой `git config --global user.email …` и попробуй заново»).
   **Никаких файлов не создаём, пока pre-flight красный** — иначе
   получим скаффолд без коммита и тупик в следующем запуске («есть
   CLAUDE.md, отказ»).
1. `mkdir -p <project-root>` если не существует. Запомним флаг
   `created_root = (true | false)` — пригодится для отката.
2. Для каждого файла из `templates/base/` (и выбранных
   `templates/extensions/<name>/`):
   - читаем шаблон,
   - подменяем плейсхолдеры (см. ниже),
   - пишем в `<project-root>/<relative-path>` без `.tpl` в имени.
   - **исключение**: файл `README.md` в корне каждого
     `templates/extensions/<name>/` — это документация самого extension'а
     (для скилла, не для проекта). Не копируется в проект.
   - запоминаем список **записанных файлов** (`created_files[]`) —
     для отката.
3. Sanity-check: `grep -l '{{' <created_files[]>` (только по
   только-что-записанным файлам, не по всему каталогу — иначе ловим
   ложные срабатывания на `_README.md`-примерах). Если что-то
   осталось — error и **откат**:
   - **fresh-mode** (`created_root = true`): `rm -rf` всего каталога.
   - **extension-mode** (`created_root = false`): удаляем только
     `created_files[]`, не трогая ничего другого. **Никогда не
     удаляем целиком чужой каталог.**
4. `cd <project-root>` → `git init` → `git add .` →
   `git commit -m "scaffold from scaffold-project v{{SCAFFOLD_VERSION}}"`.
5. Спросить про push в origin (по правилу из workspace-CLAUDE.md
   «после каждого коммита спрашивать про push»). Если remote ещё нет —
   предложить `gh repo create` (с подтверждением).

## Плейсхолдеры

| Плейсхолдер | Источник |
|---|---|
| `{{PROJECT_NAME}}` | ответ пользователя |
| `{{PROJECT_NAME_UPPER}}` | UPPER_SNAKE_CASE из имени (`-` → `_`) |
| `{{SHORT_DESCRIPTION}}` | ответ на вопрос 2, первое предложение |
| `{{SCOPE_DESCRIPTION}}` | ответ на вопрос 2 целиком (или то же, что short) |
| `{{STACK}}` | human-readable mapping: `node-cli` → `Node.js 20+ (CLI / library)`, `python-mcp` → `Python 3.11+ (MCP server)`, `both` → `Node.js 20+ + Python 3.11+`, `none` → `TBD — choose during BL-001` |
| `{{DATE}}` | сегодняшняя дата `YYYY-MM-DD` |
| `{{AUTHOR}}` | `git config user.name`, или `unknown` |
| `{{SCAFFOLD_VERSION}}` | версия скилла из его `CHANGELOG.md` |
| `{{EXTERNAL_SERVICES}}` | ответ на вопрос 4, или `none` |

Подмена — простой текстовый replaceAll по содержимому файла.

## Шаг 5 — после scaffold

После первого коммита Claude:

1. Резюмирует что создано (файлы, какие extensions подключены).
2. Указывает на `private/backlog/BL-001-scope-and-mvp.md` как первую
   задачу.
3. Напоминает: «дальше работаем через `dev-workflow`. Все M/L задачи —
   через RFC, тесты, code-review».

## Self-update triggers — петля обратной связи

Когда пользователь работает **внутри проекта**, созданного через
scaffold-project (или живущего по тем же конвенциям), и впервые
появляется один из паттернов ниже — **до коммита** Claude **обязан**
сказать:

> «Это первый раз, когда мы делаем X в этом проекте. Хочешь, я вынесу
> обвязку в `~/.claude/skills/scaffold-project/templates/extensions/<name>/`,
> чтобы следующие проекты получали её сразу?»

| Триггер | Имя extension'а |
|---|---|
| Подключение event analytics (PostHog/Amplitude/Mixpanel/GA4) | `ui-analytics` |
| Подключение error tracking (Sentry/Bugsnag/Rollbar) | `error-tracking` |
| Auth-флоу (OAuth/Clerk/Supabase Auth/Auth0) | `auth` |
| Платежи (Stripe/Paddle/LemonSqueezy) | `payments` |
| Первый GitHub Actions workflow | `ci-github` |
| Pre-commit secret-guard, написанный руками | `secret-guard` |
| Feature flags (GrowthBook/LaunchDarkly/Unleash) | `feature-flags` |
| DB migrations (Prisma/Alembic/Knex) | `db-migrations` |
| Dockerfile + deploy-config (Fly/Railway/Render) | `deploy-saas` |
| UI SPA scaffold (React/Vue/Svelte) | `ui-spa` |
| MCP server в Node | `mcp-node` |

**Решение принимает пользователь.** Если «не сейчас» — в этом же
проекте Claude больше не спрашивает про этот паттерн (на текущую
сессию). В другом проекте — спросит снова.

### Как добавить новый extension (по approve пользователя)

1. Создать каталог
   `~/.claude/skills/scaffold-project/templates/extensions/<name>/`.
2. Положить туда файлы паттерна с плейсхолдерами вместо
   project-specific значений (имена, токены, URL, продакт-named
   константы).
3. Добавить короткий `README.md` в самом extension'е: что включает,
   когда подключать, какие env-vars ждёт, как тестировать локально.
4. Обновить `CHANGELOG.md` скилла: новая запись «extension `<name>`
   added» с датой и кратким резюме.
5. Обновить таблицу выше (триггер → имя extension'а), если паттерн
   новый.
6. Обновить Шаг 2 / вопрос про стек, если extension может быть
   подключён на старте проекта (а не только инкрементально).
7. Если extension должен подсказывать threat-model в RFC (для auth,
   payments, secret-guard) — упомянуть это в его README.

После этого вынос в текущем проекте идёт как обычно: код в проекте
коммитится, а его обобщённая копия живёт в скилле.

## Edge cases

- **Пустой `package.json`/`pyproject.toml`** в каталоге → extension
  mode, diff, approve.
- **Уже инициализирован через scaffold** (`CLAUDE.md` существует) →
  отказ. Миграция — отдельная задача, не в scope.
- **Версия шаблона старее текущей** → отказ, показ diff'а изменений с
  прошлой версии.
- **`git init` падает** (нет git, нет user.name/user.email) → понятное
  сообщение, каталог оставляем как есть, без коммита.
- **Имя проекта не валидно** → просим ввести заново.
- **Остатки `{{...}}` в выходных файлах** → error, откат каталога если
  мы его создали.
- **Пользователь отвечает «не сейчас»** на self-update предложение →
  не повторяем для того же паттерна в этой же сессии.

## Когда скилл НЕ применяется

- Внутри уже существующего проекта без явного запроса «init» — там
  работает `dev-workflow`.
- Продакт-задачи, тексты, оформление гипотез.
- Миграция существующих проектов под общий шаблон — отдельная задача.

## Версионирование

Версия скилла — в его `CHANGELOG.md` и во всех файлах через
`{{SCAFFOLD_VERSION}}`. Бамп версии — при любом изменении шаблонов
или процесса диалога.
