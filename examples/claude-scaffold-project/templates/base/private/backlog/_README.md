# Backlog

Per-task files. **Gitignored** (`private/` in `.gitignore`).

## File format

`BL-NN-short-slug.md`, sequential, two digits.

## Required sections

```
# BL-NN — Title

**Status:** open | in-progress | blocked | done
**Created:** YYYY-MM-DD
**Tier:** XS | M | L (per dev-workflow)

## Что хочется получить
User-level outcome (per ~/.claude/CLAUDE.md rule about pre-code).

## Plan
Stepwise plan.

## DOD
Checkboxes — when this is "done".

## Progress
Append as we work.

## Done
Final state — what was actually shipped.
```

## Closing

When status moves to `done`:
- check all DOD boxes,
- write Progress → Done summary,
- mention follow-ups as separate BL-files (link them).

См. `~/.claude/CLAUDE.md` секцию «Закрытие задач во внешнем трекере».
