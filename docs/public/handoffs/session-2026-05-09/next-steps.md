---
type: next-steps
as-of: 2026-05-09
for: next agent or human operator
---

# Next Steps

Prioritized action list. Step 1 cannot be skipped. Steps 2–4 can run in parallel once step 1 is complete.

---

## Immediate: Answer the 5 Blocking Questions

**Before any product work can begin**, the human operator must provide answers to these questions. These answers will cascade through every subsequent decision.

```
Q-001: What is the primary tech stack?
       (language, framework, database — even if approximate)

Q-002: Is there an existing user base, or is this greenfield?
       (affects discovery scope, evidence requirements, metric baselines)

Q-003: What cloud provider and infrastructure constraints apply?
       (AWS/GCP/Azure/self-hosted, region requirements, existing services)

Q-004: Are there compliance requirements?
       (GDPR / SOC2 / HIPAA / PCI / none — which apply?)

Q-005: Who is the human product owner?
       (name or role — someone who can approve PRDs and go/no-go decisions)
```

Once answered: update `memory/open-questions.md` Q-001 through Q-005 (status → Resolved, answer → filled in).

---

## Step 1 — Orient the System to the First Initiative

**What to say:**

> "The tech stack is [X]. The user base is [greenfield / existing: N users]. Cloud is [AWS/GCP/Azure]. Compliance: [list]. Product owner: [name/role]. The first initiative is: [describe the product problem you want to solve]."

**What happens:**
- Open questions are resolved
- orchestrator routes to `workflows/product-discovery.md`
- pm-agent and strategist-agent begin opportunity assessment
- First PRD is scoped

---

## Step 2 — Run Product Discovery on First Initiative

**Workflow:** `workflows/product-discovery.md`
**Playbook:** Referenced in `wiki/processes/workflow-guide.md`
**Template:** `templates/prd-template.md` (v2.0)
**Output location:** `prds/<date>-<slug>.md`

**What to say:**

> "Run product discovery on: [problem statement]. The target user is [user type]. The business goal is [goal]."

**What happens:**
- pm-agent produces opportunity assessment
- strategist-agent produces positioning brief
- Evidence is gathered and scored
- GO/NO-GO decision is made
- If GO: PRD is drafted and sent for approval

---

## Step 3 — Create the First ADR

**Once the first initiative is scoped**, architect-agent writes ADR-001 to establish the foundational tech stack decision.

**What to say:**

> "Write ADR-001 for the foundational technology choices for [initiative name]. Tech stack: [X]. Constraints: [Y]."

**Template:** `templates/adr-template.md`
**Output:** `architecture/decisions/ADR-001-<slug>.md`
**Register:** Update `memory/architecture-decisions.md`

---

## Step 4 — Create Operational Runbooks

Before any feature ships, these runbooks must exist. They are required by the release-playbook.md pre-release checklist.

**What to say:**

> "Create the following operational runbooks: deployment, rollback, incident-response, database-migration. Use templates/runbook-template.md."

**Output locations:**
- `wiki/runbooks/deployment-runbook.md`
- `wiki/runbooks/rollback-runbook.md`
- `wiki/runbooks/incident-response-runbook.md`
- `wiki/runbooks/database-migration-runbook.md`

---

## Step 5 — Stand Up Sprint Infrastructure

Create the sprints directory and start Sprint 001.

**What to say:**

> "Initialize Sprint 001 using playbooks/sprint-playbook.md. The sprint goal is: [goal]. Committed items: [list of items with tier classification]."

**Output:** `sprints/sprint-001/sprint-plan.md`

---

## Step 6 — Upgrade Legacy Templates and Workflows

This is housekeeping but important for consistency. Legacy stubs should either be upgraded or marked deprecated.

**What to say:**

> "Upgrade the pre-existing template stubs to enterprise-grade: adr-template.md, sprint-template.md, retro-template.md, threat-model-template.md, runbook-template.md. Also add deprecation notices to legacy workflows that have been superseded."

---

## Step 7 — First Feature Engineering Cycle

Once PRD is approved and ADR exists, begin the engineering cycle.

**Workflow sequence:**
```
product-discovery.md → [PRD approved] →
architecture-workflow.md → [ADR accepted] →
engineering-workflow.md → [PR ready] →
qa-workflow.md → [PASS] →
release-playbook.md → [deployed] →
PM-review-playbook.md → [metrics reviewed]
```

---

## Quick Reference: What File to Read Before Each Step

| When you're about to... | Read this first |
|------------------------|----------------|
| Start any task | `orchestrator/master-orchestrator.md` |
| Run product discovery | `workflows/product-discovery.md` + `memory/open-questions.md` |
| Write a PRD | `templates/prd-template.md` + `memory/product-decisions.md` |
| Write an ADR | `templates/adr-template.md` + `memory/architecture-decisions.md` |
| Start engineering | `agents/engineer-agent.md` + `memory/patterns/dev-tier-classification.md` |
| Run QA | `workflows/qa-workflow.md` + `templates/qa-plan-template.md` |
| Release | `playbooks/release-playbook.md` |
| Handle an incident | `playbooks/incident-playbook.md` |
| Review metrics | `playbooks/PM-review-playbook.md` |
| Make an arch decision | `playbooks/architecture-review-playbook.md` |
