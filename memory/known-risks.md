---
type: risk-registry
domain: cross
importance: high
created: 2026-05-08
project: organizational
expires: never
---

# Known Risks Registry

Active risks that agents and operators should be aware of. This is not a project risk register for a single initiative — it is the organizational risk registry for the OS itself and any products built on it.

**Rule:** Before starting any L-tier engineering work or architectural change, the assigned agent must read this registry and note whether any active risks affect the work. Unmitigated HIGH risks in the relevant domain are a gate blocker.

---

## How to Use This Registry

**Adding a risk:**
- Assign the next sequential ID (`RISK-NNN`)
- Rate probability and impact independently: H / M / L
- Rate overall risk level: H×H = CRITICAL, H×M or M×H = HIGH, all others scale accordingly
- Assign an owner — the agent or person responsible for monitoring and mitigation
- Set a review date: when should this be re-evaluated?

**Closing a risk:**
- Move to the Closed section
- Record whether it was mitigated, accepted, or occurred

**Escalation:**
- Any `CRITICAL` risk without a mitigation plan must be escalated to the supervisor immediately
- Any risk that materializes becomes an incident: `!incident`

---

## Risk Levels

| Probability \ Impact | High Impact | Medium Impact | Low Impact |
|---------------------|------------|--------------|-----------|
| **High Probability** | CRITICAL | HIGH | MEDIUM |
| **Medium Probability** | HIGH | MEDIUM | LOW |
| **Low Probability** | MEDIUM | LOW | LOW |

---

## Critical Risks

| ID | Risk | Probability | Impact | Level | Mitigation | Owner | Review Date |
|----|------|------------|--------|-------|-----------|-------|------------|
| — | _(none currently)_ | — | — | — | — | — | — |

---

## High Risks

| ID | Risk | Probability | Impact | Level | Mitigation | Owner | Review Date |
|----|------|------------|--------|-------|-----------|-------|------------|
| RISK-001 | Context window overflow: Agent receives too much context and loses critical instructions | H | H | HIGH | Context budgets enforced per `memory/patterns/minimum-viable-context.md`; orchestrator validates before dispatch | architect-agent | Quarterly |
| RISK-002 | Workflow state loss: Active workflow interrupted mid-execution with no recovery path | M | H | HIGH | Workflow state written to `memory/workflow-state/` after each step; execution engine resumes from last completed step | delivery-agent | Quarterly |
| RISK-003 | Secret / credential leakage via artifact or handoff | M | H | HIGH | Governance constraint ORG hard-blocks secrets in any artifact; security-agent reviews Confidential/Restricted artifacts | security-agent | Quarterly |
| RISK-004 | Governance bypass under deadline pressure | H | H | HIGH | Quality gates are non-negotiable per ORG-005; `!override` requires explicit human authorization and is logged | supervisor-agent | Monthly |

---

## Medium Risks

| ID | Risk | Probability | Impact | Level | Mitigation | Owner | Review Date |
|----|------|------------|--------|-------|-----------|-------|------------|
| RISK-005 | Memory staleness: Agent acts on outdated memory that has been superseded by new decisions | M | M | MEDIUM | Memory entries include `created` dates; agents verify memory against current artifacts before acting; superseded entries marked explicitly | architect-agent | Quarterly |
| RISK-006 | ADR proliferation: Architecture decisions accumulate but are never reviewed or retired | M | M | MEDIUM | Quarterly ADR review in architecture workflow; superseded ADRs marked and cross-linked | architect-agent | Quarterly |
| RISK-007 | Wiki rot: Wiki pages become outdated as the codebase evolves | H | M | MEDIUM | Wiki update is a mandatory step at workflow close; `wiki/index.md` includes `updated` timestamps | docs-agent | Monthly |
| RISK-008 | AI quality degradation in production: Model or prompt changes degrade quality below threshold without detection | M | H | HIGH | Quality sampling 1–5% of production; automated regression on golden test set; rollback trigger at defined threshold | analytics-agent | Monthly |
| RISK-009 | Runbook gaps: Incident occurs for a scenario with no runbook | M | M | MEDIUM | Runbook creation is a required pre-release checklist item; `wiki/runbooks/` reviewed after each incident | delivery-agent | Quarterly |
| RISK-010 | Open question assumption: Agent makes a silent assumption about an open question in `memory/open-questions.md` | H | M | MEDIUM | Agents must read open-questions.md for relevant domain before L-tier work; assumptions must be documented in artifact | orchestrator | Monthly |

---

## Low Risks

| ID | Risk | Probability | Impact | Level | Mitigation | Owner | Review Date |
|----|------|------------|--------|-------|-----------|-------|------------|
| RISK-011 | Template drift: Templates fall out of sync with workflow expectations | L | M | LOW | Templates versioned; workflow artifact schemas cross-reference template versions | docs-agent | Quarterly |

---

## Risks Added 2026-05-09 (from system assessment)

| ID | Risk | Probability | Impact | Level | Mitigation | Owner | Review Date |
|----|------|------------|--------|-------|-----------|-------|------------|
| RISK-012 | Ontology drift: agents use terms inconsistently across sessions as system evolves | H | M | MEDIUM | Ontology directory created; `ontology/core-concepts.md` must be in context for governance-critical work | architect-agent | Quarterly |
| RISK-013 | State model not enforced: agents proceed without reading workflow state files, causing duplicate or skipped steps | M | H | HIGH | State model defined in `state-models/`; orchestrator must check `memory/workflow-state/` at session start | orchestrator | Monthly |
| RISK-014 | Supervisor single point of failure: no agent backstops supervisor quality failures | M | H | HIGH | Human operator is the backstop; escalation protocol requires explicit escalation path when supervisor fails twice | supervisor-agent | Monthly |
| RISK-015 | Lifecycle phase drift: features move between phases without formal transition gates, making PM visibility unreliable | M | M | MEDIUM | Feature lifecycle model defined; PRD frontmatter tracks phase; PM-review-playbook checks phase at each sprint review | pm-agent | Quarterly |
| RISK-016 | Eval framework bypass: AI features ship without completing evaluation suite, creating quality blind spots | M | H | HIGH | G5 gate requires eval plan; ai-feature-workflow Steps 3+12 are mandatory; analytics-agent blocks release without eval score | analytics-agent | Monthly |

---

## Risk Materialization Log

When a risk materializes (becomes an incident or causes a quality failure), record it here.

| Risk ID | Date | What Happened | Incident Ref | Corrective Action |
|---------|------|--------------|-------------|------------------|
| — | — | _(none yet)_ | — | — |

---

## Closed Risks

| ID | Risk | Outcome | Date Closed | Notes |
|----|------|---------|------------|-------|
| — | _(none yet)_ | — | — | — |
