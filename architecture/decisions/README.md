# Architecture Decision Records

All significant technical decisions for the Enterprise AI OS are documented here as ADRs.

**Template:** `templates/adr-template.md`
**Workflow:** `workflows/architecture-review.md`

---

## ADR Index

| ID | Title | Status | Date | Supersedes |
|----|-------|--------|------|-----------|
| — | _(No ADRs yet — system initialized 2026-05-08)_ | | | |

---

## ADR Numbering

ADRs are numbered sequentially starting at ADR-001. Never reuse a number.

**Next available:** ADR-001

---

## ADR Lifecycle

```
proposed → accepted | rejected
accepted → deprecated | superseded
```

- **proposed**: Under review
- **accepted**: Decision in effect
- **rejected**: Considered but not adopted (keep for reference)
- **deprecated**: No longer applies (system changed, but no replacement decision)
- **superseded**: Replaced by a newer ADR (always reference the new ADR)

---

## When to Write an ADR

Write an ADR when:
- The decision is hard to reverse (infrastructure, data models, auth systems)
- It affects more than one team or system
- A future engineer would be confused by the choice without context
- You want to record alternatives considered and why they were rejected

Do NOT write an ADR for:
- Implementation details that are easily changed
- Stylistic choices with no architectural impact
- Decisions fully documented in a PRD or RFC

---

## How to Create an ADR

1. Copy `templates/adr-template.md`
2. Assign the next sequential ID
3. Save as `ADR-NNN-<slug>.md` in this directory
4. Set status to `proposed`
5. Route through `architecture-review` workflow
6. Update status to `accepted` or `rejected` after review
7. Update `wiki/index.md` to link to new ADR
