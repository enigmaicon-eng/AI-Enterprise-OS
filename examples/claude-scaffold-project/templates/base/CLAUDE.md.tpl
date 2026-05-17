# {{PROJECT_NAME}} — Claude Code notes

> **Project type:** {{STACK}}
> **Created from scaffold-project v{{SCAFFOLD_VERSION}} on {{DATE}}**

## Scope

{{SCOPE_DESCRIPTION}}

## Key files

- `README.md` — human-facing overview.
- `DEVELOPMENT.md` — link to dev-workflow + project-specific rules.
- `CHANGELOG.md` — Keep a Changelog format.
- `incidents.md` — blameless incident log.
- `rfc/` — design docs for M/L tasks.
- `docs/decisions/` — ADRs.
- `private/backlog/` — BL-NN.md task files (gitignored).

(Дополни по мере роста проекта. Update on first major architectural
change, not before.)

## Working rules (для Claude)

- Развитие проекта идёт через скилл `dev-workflow`
  (`~/.claude/skills/dev-workflow/SKILL.md`). Тиринг XS / M / L,
  RFC перед M/L, smoke-тест обязателен.
- Образ результата на user-level — ДО кода. Жди явного approve.
- Каждая задача — отдельный BL-файл в `private/backlog/`.
- Не модифицируй `private/` без явной просьбы.
- Не коммить `.env`. Используй `.env.example` для документирования
  переменных. Namespace: `{{PROJECT_NAME_UPPER}}_*`.
- Английский в коде / комментариях / variable names. Документация —
  на языке, принятом в проекте.

## Self-update петля

Если в проекте появляется новый инфраструктурный паттерн (analytics,
auth, error tracking, payments, CI, feature flags, db migrations,
secret-guard) — до коммита **предложить** вынести в
`~/.claude/skills/scaffold-project/templates/extensions/<name>/`.
Решение за пользователем.
