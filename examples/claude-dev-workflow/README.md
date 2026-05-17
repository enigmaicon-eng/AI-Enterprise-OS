# claude-dev-workflow

A [Claude Code](https://claude.com/claude-code) skill that enforces a
tiered development workflow on every coding task — from a one-line bug
fix to a full architectural change.

It is the personal workflow I use across all my code projects (CLIs,
MCP servers, SaaS prototypes), captured as a skill so Claude Code
applies the same discipline automatically. Published as a portable
reference for anyone interested in opinionated AI-assisted development
practices.

> ⚠️ The skill itself ([SKILL.md](SKILL.md)) is written in **Russian** —
> that is my working language. This README in English explains what
> the skill does and how to adopt it.

## What it does

When you give Claude Code a coding task, the skill triggers
automatically and:

1. **Classifies the task into a tier**:
   - **XS** — < 20 LOC, bug fix, single-file change. Minimal ceremony.
   - **M** — new feature, multi-file, non-trivial logic. Requires an RFC.
   - **L** — architecture, migration, security, breaking change.
     Requires a full RFC, multi-agent review, and explicit final
     approval.

2. **Enforces an "image of result" before any code** (`Шаг 0.5`).
   Before the RFC, before code, Claude must describe — in user-level
   language — what the user will see, type, and get. Approved in chat
   or written into a backlog item. Code starts only after approval.

3. **Demands an RFC for M/L tasks** under
   `<project>/rfc/NNN-title.md`: problem → options → chosen + why →
   risks → verification plan. Code is blocked until the user approves
   the RFC.

4. **Requires a smoke test even for XS**. One trivial test proving the
   primary function gets called and returns the expected shape. Catches
   ~80% of refactor breakage in two minutes.

5. **Runs multi-agent code review for M/L**. A `code-reviewer` subagent
   gets the diff and reports findings on readability, edge cases,
   over-engineering, and secrets. For L-tier, also runs
   `/security-review` and `/review`.

6. **Final approval is always the user's**. Claude does not commit
   M/L code without an explicit "ok".

7. **Incrementally scales security through S1/S2/S3 levels**:
   - **S1** — local scripts and personal tools. `/security-review` for
     L-tier, secret-detection in code review.
   - **S2** — pre-prod SaaS with auth or a public URL. SAST
     (`semgrep`), OWASP Top 10 checklist, threat modeling for
     auth/data features.
   - **S3** — production with real users. A pentest subagent against
     staging, external audit before paid customers.

8. **Blameless incident log** in `<project>/incidents.md` — what
   broke, root cause, what we changed so it doesn't repeat.

The full content (testing pyramid, lint setup, pre-commit hook policy,
CI guidance, definition-of-done checklist) lives in
[SKILL.md](SKILL.md).

## What it is *not*

- **Not a framework.** No code is shipped — only conventions. There is
  nothing to import, run, or configure. The skill is a long policy
  document Claude Code reads at session start and applies during work.
- **Not a productivity tool.** It deliberately adds friction for
  M/L tasks. The point is to slow down enough to think before writing
  multi-file changes.
- **Not language-specific.** Targets JavaScript/Node and Python in the
  test/lint guidance, but the tiering and review logic apply to any
  stack.
- **Not for product/PM tasks.** Excluded explicitly. Notion/Jira/
  Confluence work bypasses this skill.

## Installation

This skill is intended to be installed in your personal Claude Code
skills directory:

```bash
# Clone the repo somewhere persistent
git clone https://github.com/ymuromcev/claude-dev-workflow.git ~/Code/claude-dev-workflow

# Symlink into Claude Code's skills directory
ln -s ~/Code/claude-dev-workflow ~/.claude/skills/dev-workflow
```

That's it. Claude Code auto-loads the skill on the next session and
triggers it on any coding-task phrase.

To verify: in a Claude Code session, the skill should appear in
`/help` → skills list under `dev-workflow`.

## Companion skill

[claude-scaffold-project](https://github.com/ymuromcev/claude-scaffold-project)
is the companion bootstrapper — when you start a brand-new project,
it scaffolds `CLAUDE.md`, `rfc/`, `private/backlog/BL-001`, and other
structure that this workflow expects. They are designed to be used
together, but each works on its own.

## Tier examples

A typical XS interaction:

```
> fix the typo in CLAUDE.md "untrustred" → "untrusted"
```

Claude classifies as XS, edits, runs a quick check, shows the diff,
commits.

A typical M interaction:

```
> add a new ATS adapter for Workable to engine/modules/discovery/
```

Claude pauses. Writes an "image of result" (what the user will see),
asks for approval. Drafts an RFC under `rfc/NNN-workable-adapter.md`.
Waits. Once approved, writes code + tests, runs `code-reviewer`
subagent, fixes critical findings, shows diff, asks for commit
approval.

A typical L interaction:

```
> migrate all profiles to a new TSV schema with a backfill
```

Same as M but also runs `/security-review` and requires a phased
plan with rollback. No code starts until the full plan is approved.

## Why publish this?

Two reasons:

1. **Portfolio transparency.** This is part of my actual day-to-day
   working setup — not a curated demo. Showing it explains how I
   think about AI-assisted code more honestly than a one-page resume
   bullet.
2. **Possible reuse.** If anyone else finds the tiering / RFC-gating /
   multi-agent-review pattern useful, the skill is MIT-licensed and
   copyable.

## Pairing with skills

Designed to compose with [claude-scaffold-project](https://github.com/ymuromcev/claude-scaffold-project):
that skill creates a new project's directory layout (including the
`rfc/` folder this skill expects) and references this one in the
generated `CLAUDE.md`. You can use either independently.

## License

[MIT](LICENSE).
