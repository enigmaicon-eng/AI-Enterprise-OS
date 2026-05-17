# RFC 001 — scaffold-project bootstrap

Status: draft, awaiting user approval
Date: 2026-05-06
Tier: L (новый глобальный скилл, влияет на все будущие проекты, меняет глобальный CLAUDE.md)

## Проблема

При старте нового проекта Claude получает только глобальные правила
(`~/.claude/CLAUDE.md` + workspace-CLAUDE.md) и набор скиллов. Скилл
`dev-workflow` запускает корректный процесс (тиринг, RFC, DOD), но
**не разворачивает скелет проекта**: каталоги `rfc/`, `docs/decisions/`,
файлы `CLAUDE.md`, `README.md`, `DEVELOPMENT.md`, `CHANGELOG.md`,
`incidents.md`, `private/backlog/` появляются только если пользователь
явно попросит. На каждом новом проекте — копипаст из старых руками или
просьбы Клоду «создай вот это и вот это».

Вторая проблема — потеря накопленного опыта. Когда в одном проекте
впервые подключаем event analytics, Sentry, auth, feature flags и т.п. —
этот паттерн остаётся в этом проекте и не доезжает до следующего.

## Варианты

- **A. Скилл `scaffold-project` с диалогом и шаблонами + петля обратной
  связи через extension-pack'и.** Триггерится по фразам «новый проект»,
  «init project», «scaffold X». Создаёт скелет, делает первый коммит.
  Когда в проекте появляется reusable инфра-паттерн — Claude обязан
  предложить вынести его в `templates/extensions/<name>/` для будущих
  проектов.
- **B. Template-репо** `~/Desktop/Claude Code/_project_template/` с
  плейсхолдерами. Клод копирует и заполняет. Проще, но нет петли
  обратной связи и расширений по стеку.
- **C. Расширить `dev-workflow` секцией «bootstrap».** Минимально-
  инвазивно, но смешивает две функции в одном скилле и не решает
  проблему extension-pack'ов.

## Выбрано — A

Диалог + шаблоны + extension-pack'и + правило-петля в глобальном
CLAUDE.md. Решает обе проблемы: первичный скаффолдинг и накопление
опыта между проектами. Цена — больше файлов на старте, но они живут
в одном месте (`~/.claude/skills/scaffold-project/`) и версионируются.

## Архитектура скилла

```
~/.claude/skills/scaffold-project/
├── SKILL.md                    — описание, триггеры, сценарий диалога,
│                                  правила self-update
├── CHANGELOG.md                — история скилла, какие extensions
│                                  добавлены и когда
├── rfc/
│   └── 001-bootstrap.md        — этот файл
└── templates/
    ├── base/                   — минимальный скелет, кладётся всегда
    │   ├── CLAUDE.md.tpl
    │   ├── README.md.tpl
    │   ├── DEVELOPMENT.md.tpl
    │   ├── CHANGELOG.md.tpl
    │   ├── incidents.md.tpl
    │   ├── .gitignore.tpl
    │   ├── .env.example.tpl
    │   ├── rfc/_README.md
    │   ├── docs/decisions/_README.md
    │   └── private/backlog/
    │       ├── _README.md
    │       └── BL-001-scope-and-mvp.md.tpl
    └── extensions/
        ├── node-cli/           — Node 20+ CLI с node --test
        │   ├── package.json.tpl
        │   ├── engine/.gitkeep
        │   └── engine/index.test.js.tpl
        └── python-mcp/         — Python MCP-сервер с pytest
            ├── pyproject.toml.tpl
            ├── server.py.tpl
            └── tests/test_smoke.py.tpl
```

`.tpl` — суффикс, чтобы шаблоны не интерпретировались как часть скелета
скилла (например, чтобы `package.json.tpl` не подхватился как
зависимость). При копировании суффикс снимается.

## Контракт шаблонов base/

| Файл | Назначение |
|---|---|
| `CLAUDE.md` | scope проекта, ключевые файлы, правила для Клода. Заполняется через диалог. |
| `README.md` | человеко-читаемый обзор: что, зачем, как запустить. |
| `DEVELOPMENT.md` | ссылка на `~/.claude/skills/dev-workflow/SKILL.md` + проектные специфики (изначально пусто). |
| `CHANGELOG.md` | Keep a Changelog, секция `[Unreleased]` с записью «Initial scaffold from scaffold-project v{{VERSION}}». |
| `incidents.md` | заголовок + формат, blameless. |
| `rfc/_README.md` | формат RFC. |
| `docs/decisions/_README.md` | формат ADR. |
| `.gitignore` | Node + Python + .env + .DS_Store + IDE. |
| `.env.example` | namespace по проекту: `{{PROJECT_NAME_UPPER}}_*`. |
| `private/backlog/_README.md` | формат BL-NN.md, обязательные секции `## Plan`, `## DOD`, `## Progress`, `## Done`. |
| `private/backlog/BL-001-scope-and-mvp.md` | первая задача — заполнить scope в CLAUDE.md и определить MVP. Создаётся всегда. |

## Плейсхолдеры

- `{{PROJECT_NAME}}` — имя проекта (kebab-case).
- `{{PROJECT_NAME_UPPER}}` — UPPER_SNAKE_CASE для env-namespace.
- `{{SHORT_DESCRIPTION}}` — однострочное описание из диалога.
- `{{SCOPE_DESCRIPTION}}` — расширенный scope из диалога.
- `{{STACK}}` — выбранный стек (для упоминания в README/CLAUDE.md).
- `{{DATE}}` — `2026-05-06` формат.
- `{{AUTHOR}}` — из `git config user.name`.
- `{{SCAFFOLD_VERSION}}` — версия скилла, читается из его CHANGELOG.

Подмена — простой `String.replaceAll` по всем `.tpl`-файлам перед
записью. Без шаблонизатора. Если плейсхолдер не подставлен — error,
не молчаливый прогон.

## Триггеры скилла

Описание скилла (frontmatter `description`) содержит:

- «начинаем новый проект», «новый проект», «init project», «scaffold
  проект», «развернуть проект», «создать новый проект», «новый
  подпроект», «start a new project», и явный `/scaffold-project`.

Не должен срабатывать на:

- работу внутри уже существующего проекта (детектится по наличию
  `CLAUDE.md` или `package.json`/`pyproject.toml` в текущем каталоге);
- продакт-задачи (Notion, Jira, Confluence, тексты);
- однострочные правки.

## Сценарий диалога

```
1. Триггер сработал.
2. Скилл проверяет текущий каталог:
   - пустой/не существует     → продолжаем,
   - не пустой и нет CLAUDE.md → спрашиваем «extension mode?»,
   - есть CLAUDE.md            → отказ, проект уже инициализирован.
3. Вопросы (4 шт., минимум):
   a. Имя проекта (kebab-case, валидируем по `^[a-z][a-z0-9-]{1,40}$`).
   b. Однострочное описание.
   c. Стек: node-cli / python-mcp / both / none.
   d. Будут ли подключаться внешние сервисы сразу (Notion / Gmail /
      Stripe / Sentry / другое — список на будущее, сейчас только
      справочно).
4. Скилл показывает плоский список файлов, которые создаст. Ждёт «ok».
5. По approve:
   - mkdir каталога, если его не было,
   - копирование templates/base/* + выбранных extensions,
   - подстановка плейсхолдеров,
   - создание `private/backlog/BL-001-scope-and-mvp.md` всегда,
   - `git init`, `git add .`, `git commit -m "scaffold from
     scaffold-project v{{VERSION}}"`,
   - вывод отчёта: что создано, какие следующие шаги.
6. Скилл предлагает push в origin (по правилу из workspace-CLAUDE.md
   «после каждого коммита спрашивать про push»). Если remote ещё нет —
   предлагает создать GitHub-репо через `gh repo create` (с подтверждением).
```

## Self-update protocol

Это главное отличие варианта A.

В `SKILL.md` есть секция «Self-update triggers» — явный список
сигналов, по которым Клод **обязан** предложить апгрейд скилла:

- Подключение event analytics (PostHog/Amplitude/Mixpanel/GA4) →
  предложить создать `extensions/ui-analytics/`.
- Подключение error tracking (Sentry/Bugsnag/Rollbar) →
  `extensions/error-tracking/`.
- Auth (OAuth/Clerk/Supabase Auth/Auth0) → `extensions/auth/` +
  threat-model шаблон в RFC.
- Платежи (Stripe/Paddle/LemonSqueezy) → `extensions/payments/` +
  чеклист S2.
- Первый GitHub Actions workflow → `extensions/ci-github/`.
- Pre-commit secret-guard, написанный руками → `extensions/secret-guard/`.
- Feature flags (GrowthBook/LaunchDarkly/Unleash) →
  `extensions/feature-flags/`.
- Database migrations (Prisma/Alembic/Knex) → `extensions/db-migrations/`.

Когда триггер срабатывает в каком-то проекте, Клод:

1. Замечает первое появление паттерна.
2. **До коммита** в этом проекте — предлагает: «Это первый раз, когда
   мы делаем X. Хочешь, я вынесу обвязку в `extensions/<name>/`, чтобы
   следующие проекты получали её сразу?»
3. По approve — обобщает (убирает названия из текущего проекта,
   заменяет на плейсхолдеры), кладёт в `templates/extensions/<name>/`,
   обновляет `CHANGELOG.md` скилла, добавляет имя расширения в список
   доступных в `SKILL.md`.
4. Только после этого — продолжает в текущем проекте.

Решение — за пользователем. Клод **не делает молча**.

Если пользователь говорит «не сейчас» — это зафиксировано как «один
раз спрошено, ответ нет». Повторно для того же паттерна в том же
проекте Клод не спрашивает; в другом проекте — спросит снова.

## Правка глобального CLAUDE.md

В `~/.claude/CLAUDE.md` (раздел «Структура проектов» или новая секция
«scaffold-project — обратная петля») добавляется примерно такой блок:

```markdown
## scaffold-project — обратная петля

Новые проекты разворачивает скилл `scaffold-project`
(`~/.claude/skills/scaffold-project/SKILL.md`). Триггеры:
«новый проект», «init project», «scaffold X».

При работе в любом проекте, если появляется инфраструктурный паттерн,
потенциально применимый к другим проектам того же типа (event
analytics в UI-приложениях, error tracking, auth, feature flags,
CI-конфиг, pre-commit secret-guard, миграции БД и т.п.) — Claude
**обязан** до коммита предложить вынести этот паттерн как
extension-pack в `~/.claude/skills/scaffold-project/templates/
extensions/<name>/`. Решение принимает пользователь. Если «не сейчас» —
не повторяет в этом же проекте.
```

Точная формулировка — на этапе кода; здесь — суть.

## Edge cases

- **Каталог не пустой, но нет CLAUDE.md.** Скилл предлагает «extension
  mode»: дописать только недостающие из base/-набора, не трогая
  существующее. Diff показывает, ждёт approve.
- **Каталог уже инициализирован через scaffold-project (есть CLAUDE.md
  с маркером).** Отказ — для миграций нужен отдельный сценарий, в
  scope первой версии не входит.
- **Версия шаблона старее текущей.** Если пользователь говорит
  «scaffold по v1, мы сейчас на v3» — отказ, но показ diff'а.
- **`git init` падает (нет git, нет имени автора).** Скилл выводит
  понятное сообщение и оставляет каталог как есть, без коммита.
- **Имя проекта не проходит валидацию.** Клод просит ввести заново.
- **Плейсхолдер остался в выходных файлах.** После прогона —
  `grep -r "{{" <project>` — если что-то осталось, error и откат.

## План проверки

Smoke-тест перед approve кода:

1. На пустом временном каталоге `mktemp -d` запускаем сценарий
   диалога вручную. Имя `test-project`, описание любое, стек
   `node-cli`. Проверяем:
   - все base-файлы созданы,
   - extension `node-cli` подключён,
   - плейсхолдеры подставлены (нет остатков `{{...}}`),
   - `git log` показывает один коммит scaffold,
   - `node --test` находит smoke-test и проходит.
2. То же для `python-mcp`. Проверяем `pytest` запускается и smoke
   проходит.
3. Edge case: запускаем повторно в том же каталоге — отказ.
4. Edge case: запускаем в каталоге с пустым `package.json` — попадаем
   в extension-mode, видим diff, можем отказаться.

После smoke — code-review субагент проходит по diff'у скилла
(шаблоны + SKILL.md), фокус на: secrets в шаблонах, имена/email в
шаблонах (не должно быть), консистентность плейсхолдеров,
читаемость диалога.

## Риски

- **Шаблоны застаревают.** Митигация — `CHANGELOG.md` скилла + правило
  обновлять шаблоны при изменении dev-workflow или CLAUDE.md.
- **Скилл слишком жадный** (триггерится в неподходящих контекстах).
  Митигация — детект существующего проекта по `CLAUDE.md` /
  `package.json` / `pyproject.toml` + явный отказ при не-пустом
  каталоге.
- **Self-update петля игнорируется** Клодом. Митигация — пункт
  занесён в **глобальный** CLAUDE.md, не только в скилл (CLAUDE.md
  всегда в контексте, скилл — только при триггере).
- **Конфликт с `dev-workflow`.** Скиллы не конфликтуют: scaffold
  сработает на старте, `dev-workflow` — на каждой следующей задаче.
  В `SKILL.md` явно прописано «после scaffold — все следующие задачи
  идут через dev-workflow».
- **Шаблоны делают молчаливое продуктовое решение** (например,
  выбирают конкретный test runner). Митигация — для Node берём
  встроенный `node --test` (zero-config, в Node 20+); для Python —
  `pytest` (де-факто стандарт). Это согласуется с `dev-workflow` Шаг 2.

## Out of scope первой версии

- Extension'ы кроме `node-cli` и `python-mcp` (приходят через
  self-update).
- Миграция существующих проектов под шаблон.
- Автоматическое создание GitHub-репо без подтверждения.
- Подключение к внешним сервисам (Sentry init, Stripe webhook setup
  и т.п.) — только `.env.example` записи.
- Stage-18-style wizard для добавления профилей внутри уже
  существующего движка (другая задача).
- Windows.

## Решения, требующие отдельного approve пользователя в коде

- Точная формулировка пункта в `~/.claude/CLAUDE.md` — покажу до
  записи.
- Точное содержание `templates/base/CLAUDE.md.tpl` — покажу до
  записи (это скелет, который попадёт во все будущие проекты).
- Точное содержание `BL-001-scope-and-mvp.md.tpl` — покажу до
  записи.
- Если smoke-тест поймает что-то существенное — приду спрашивать.

## Post-implementation notes

- В `SKILL.md` итоговая таблица self-update триггеров расширена с
  8 (как в этом RFC) до 11: добавлены `deploy-saas`, `ui-spa`,
  `mcp-node`. Это документация под фактическую активность
  пользователя; авторитет — `SKILL.md`, не RFC.
- Базовый `.gitignore.tpl` гитигнорит `private/`, но **исключает**
  `private/backlog/**` — иначе BL-файлы (включая обязательный BL-001)
  не попадали бы в первый коммит. Поймано на code-review.
- `Шаг 4 — запись` дополнен **pre-flight check** (git и `user.email`
  настроены), уточнённым sanity-check (grep только по записанным
  файлам, не по всему каталогу) и расходящимся откатом для
  fresh-mode vs extension-mode. Поймано на code-review.
