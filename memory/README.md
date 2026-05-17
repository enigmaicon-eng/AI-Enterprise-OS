# Memory System

The persistent AI memory layer for the Enterprise AI OS. This is the "warm" tier — curated facts, patterns, and constraints that agents should load at the start of relevant sessions.

---

## What Belongs Here

Memory files store knowledge that is:
- **Non-obvious**: Not derivable from reading current code or wiki
- **Persistent**: Relevant across multiple projects and sprints
- **Actionable**: Changes agent behavior when read
- **Concise**: One key fact or constraint per file

Memory files do NOT store:
- Full project histories (that's what wiki + artifacts are for)
- Temporary session state (that's `memory/workflow-state/`)
- Information already in CLAUDE.md files
- Code patterns (read the code)

---

## Directory Structure

```
memory/
├── README.md                    ← This file
├── MEMORY_INDEX.md              ← Index of all memory entries
├── organizational/              ← Org-wide facts and constraints
│   ├── team-context.md
│   ├── tech-stack.md
│   └── non-obvious-constraints.md
├── patterns/                    ← Validated reusable patterns
│   ├── pm-patterns.md
│   ├── engineering-patterns.md
│   └── architecture-patterns.md
├── failures/                    ← Documented failure modes to avoid
│   └── README.md
├── decisions/                   ← Key decisions agents must honor
│   └── README.md
├── workflow-state/              ← Active workflow state files
│   └── README.md
└── overrides/                   ← Documented gate/workflow overrides
    └── README.md
```

---

## Memory Entry Format

```markdown
---
type: constraint | pattern | decision | failure | context
domain: PM | architecture | engineering | QA | UX | analytics | delivery | cross
importance: critical | high | normal
created: YYYY-MM-DD
project: <project name or "organizational">
expires: YYYY-MM-DD | never
---

# <Title>

<The fact, constraint, or pattern — concise, actionable>

**Why this matters:** <why an agent needs to know this>
**When to apply:** <specific situation where this is relevant>
```

---

## Memory Lifecycle

1. **Create**: Agent or human identifies a non-obvious constraint or pattern
2. **Index**: Add entry to `MEMORY_INDEX.md`
3. **Use**: Orchestrator includes relevant memory in context packages
4. **Validate**: Before acting on a memory, verify the underlying fact is still true
5. **Expire**: Memory with `expires` dates are removed when expired; all others are reviewed quarterly

---

## Memory Index

All memory entries are indexed in `MEMORY_INDEX.md`. The orchestrator reads this index to determine which memory files to load for each agent invocation.

Format:
```markdown
| File | Domain | Type | Summary | Importance |
|------|--------|------|---------|-----------|
| organizational/tech-stack.md | engineering | context | Primary tech stack choices | high |
```

---

## Karpathy Wiki Model

This memory system follows the principle that organizational knowledge should be:
1. **Externalized** (not in anyone's head)
2. **Indexed** (findable by future agents)
3. **Layered** (summary → detail, not monolithic)
4. **Versioned** (changes are tracked, not overwritten without history)
5. **Linked** (connected to the artifacts that justify the knowledge)
