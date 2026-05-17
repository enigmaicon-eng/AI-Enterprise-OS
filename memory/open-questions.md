---
type: open-questions
domain: cross
importance: high
created: 2026-05-08
project: organizational
expires: never
---

# Open Questions

Active questions that have not been resolved. Any agent that encounters a question that affects multiple workflows, teams, or future decisions should log it here.

**Rule:** A question in this log is an unresolved dependency. Agents must not make silent assumptions about open questions that affect their work — either resolve the question or note the assumption explicitly in their artifact and flag it here.

---

## How to Use This Log

**Adding a question:**
- Assign the next sequential ID (`Q-NNN`)
- Set priority: `blocking` (nothing proceeds without answer) / `high` (materially affects design) / `normal` (good to know)
- Name a question owner — the agent or person responsible for answering it
- Set a due date if the question is time-sensitive

**Resolving a question:**
- Move it to the Resolved section at the bottom
- Record the answer and the artifact where it was documented
- Do not delete — resolutions are organizational memory

**Priority escalation:**
- If a `normal` question becomes `blocking`, update the priority and notify the orchestrator

---

## Blocking Questions

_Nothing proceeds in the affected domain until these are answered._

| ID | Question | Domain | Owner | Due | Status |
|----|---------|--------|-------|-----|--------|
| — | _(none currently blocking)_ | — | — | — | — |

---

## High-Priority Questions

_Materially affect design, architecture, or product direction._

| ID | Question | Domain | Context | Owner | Due | Status |
|----|---------|--------|---------|-------|-----|--------|
| Q-001 | What is the primary tech stack for the first feature built on this OS? | architecture | No stack has been specified; ADR cannot be written without it | architect-agent | TBD | Open |
| Q-002 | Is there an existing user base or is this greenfield? | PM | Affects discovery workflow scope, evidence requirements, and metric baselines | pm-agent | TBD | Open |
| Q-003 | What cloud provider and infrastructure constraints apply? | architecture | Affects deployment, scaling, and security architecture decisions | architect-agent | TBD | Open |
| Q-004 | Are there existing compliance requirements (GDPR, SOC2, HIPAA, PCI)? | security | Compliance scope must be defined before any data model work | security-agent | TBD | Open |
| Q-005 | Who is the human product owner for the first initiative? | PM | PM-agent needs a human approver for PRD sign-off and go/no-go decisions | pm-agent | TBD | Open |

---

## Normal Questions

_Good to resolve but not blocking current work._

| ID | Question | Domain | Context | Owner | Due | Status |
|----|---------|--------|---------|-------|-----|--------|
| Q-006 | Should the memory system be migrated to a vector store as content grows? | architecture | File-based works at current scale; revisit when memory index exceeds 50 entries | architect-agent | When MEMORY_INDEX.md > 50 entries | Open |
| Q-007 | What is the target deployment cadence (continuous / weekly / sprint-based)? | delivery | Affects DORA metric targets and delivery workflow configuration | delivery-agent | Before first engineering sprint | Open |
| Q-008 | Will any workflows need to run autonomously on a schedule (crons), or only on-demand? | architecture | Affects orchestrator design; cron execution has different context and auth requirements | architect-agent | Before first L-tier feature | Open |

---

## Resolved Questions

| ID | Question | Resolution | Resolved By | Date | Artifact |
|----|---------|-----------|------------|------|---------|
| — | _(none yet)_ | — | — | — | — |
