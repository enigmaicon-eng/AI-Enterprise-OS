---
type: recommended-prompts
as-of: 2026-05-09
purpose: copy-paste prompts for deterministic continuation
---

# Recommended Next Prompts

Copy-paste prompts for resuming work with zero context loss. Prompts are ordered by priority. Each prompt is self-contained — it includes the context an agent needs to proceed without reading the full conversation history.

---

## Prompt 0 — System Orientation (Run This First in Any New Session)

Use this at the start of any new session to orient the agent:

```
Read the following files in this order and confirm you understand the current system state:
1. SYSTEM.md
2. handoffs/session-2026-05-09/session-handoff.md
3. memory/open-questions.md
4. memory/decisions.md

After reading, summarize:
- What the Enterprise AI OS is and what has been built
- The 5 blocking questions that must be answered before product work begins
- What the recommended next action is

Do not start any new work until I confirm the summary is correct.
```

---

## Prompt 1 — Answer Blocking Questions and Start First Initiative

Use this when the human operator is ready to define the first product initiative:

```
I'm ready to answer the 5 blocking questions from memory/open-questions.md:

Q-001 (Tech stack): [YOUR ANSWER — e.g., "Python/FastAPI backend, React frontend, PostgreSQL"]
Q-002 (User base): [YOUR ANSWER — e.g., "Greenfield — no existing users"]
Q-003 (Cloud/infra): [YOUR ANSWER — e.g., "AWS, us-east-1, no existing infrastructure"]
Q-004 (Compliance): [YOUR ANSWER — e.g., "GDPR only" or "SOC2 Type II required"]
Q-005 (Product owner): [YOUR ANSWER — e.g., "I am the product owner"]

After updating memory/open-questions.md with these answers:
1. Update Q-001 through Q-005 status to "Resolved"
2. Create a brief summary of how these answers affect the first ADR
3. The first initiative I want to explore is: [YOUR PRODUCT PROBLEM STATEMENT]

Route this to the product discovery workflow.
```

---

## Prompt 2 — Run Product Discovery

Use this after blocking questions are answered:

```
Run the product discovery workflow (workflows/product-discovery.md) for the following opportunity:

Problem: [describe the user problem]
Target user: [who has this problem]
Business goal: [what outcome we want]
Initial hypothesis: [optional — what solution direction you're considering]

Constraints from memory/open-questions.md:
- Tech stack: [from Q-001]
- User base: [from Q-002]
- Compliance: [from Q-004]

Produce the following artifacts:
- prds/[date]-[slug]-opportunity-assessment.md
- prds/[date]-[slug]-discovery-decision.md (GO/NO-GO)

If GO: draft the initial PRD at prds/[date]-[slug].md using templates/prd-template.md
```

---

## Prompt 3 — Write First ADR

Use this after the tech stack is known (Q-001 answered):

```
Write the first ADR for the Enterprise AI OS.

ADR-001 should capture the foundational technology decisions:
- Tech stack: [from Q-001 answer]
- Cloud provider: [from Q-003 answer]
- Key architectural constraints: [list any you know]

Use templates/adr-template.md.
Save to: architecture/decisions/ADR-001-foundation.md
Register in: memory/architecture-decisions.md

After writing, update architecture/decisions/README.md with the ADR entry.
```

---

## Prompt 4 — Create Operational Runbooks

Use this before any release can happen (required by release-playbook.md pre-release checklist):

```
Create the following operational runbooks under wiki/runbooks/ using templates/runbook-template.md.

Create all four:
1. wiki/runbooks/deployment-runbook.md — how to deploy to each environment
2. wiki/runbooks/rollback-runbook.md — how to roll back any deployment
3. wiki/runbooks/incident-response-runbook.md — first 15 minutes of any incident
4. wiki/runbooks/database-migration-runbook.md — how to safely run DB migrations

For each runbook, use placeholder values where specifics depend on the tech stack (Q-001) 
and cloud provider (Q-003). Mark placeholders as [TO BE FILLED — depends on ADR-001].

These runbooks must exist before the first feature can pass the pre-release gate.
```

---

## Prompt 5 — Initialize Sprint Infrastructure

Use this to start the first sprint:

```
Initialize the sprint infrastructure and plan Sprint 001.

1. Create directory: sprints/
2. Create: sprints/README.md (index of all sprints)
3. Create: sprints/sprint-001/ directory
4. Run playbooks/sprint-playbook.md §① (Pre-Sprint Backlog Readiness) and §② (Sprint Planning)

Sprint 001 details:
- Sprint goal: [YOUR GOAL — e.g., "Complete product discovery and write ADR-001"]
- Sprint dates: [start date] to [end date]
- Committed items: [list with tier — e.g., "Discovery workshop (M-tier), ADR-001 (M-tier)"]
- Team: [agents and human operators]

Output: sprints/sprint-001/sprint-plan.md using templates/sprint-template.md
```

---

## Prompt 6 — Upgrade Legacy Templates

Use this for housekeeping:

```
Upgrade the following pre-existing template stubs to enterprise-grade standard, 
matching the quality level of the templates created in Phase 3 
(see handoffs/session-2026-05-09/completed-work.md for reference).

Templates to upgrade:
1. templates/adr-template.md — add: consequences section, rejection rationale table, conditions tracking, supersedes field
2. templates/sprint-template.md — add: velocity tracking, DORA fields, scope change log, definition of done
3. templates/retro-template.md — add: action item quality rules (specific/owned/time-bound), prior retro review section
4. templates/runbook-template.md — implement the 7-section structure from agents/docs-agent.md

Also add deprecation notices to superseded legacy workflows:
- workflows/feature-development.md → superseded by workflows/engineering-workflow.md
- workflows/discovery.md → superseded by workflows/product-discovery.md
- workflows/incident-response.md → superseded by workflows/incident-workflow.md
- workflows/architecture-review.md → superseded by workflows/architecture-workflow.md
```

---

## Prompt 7 — Architecture Review for First Feature

Use this after PRD is approved and design is ready:

```
Run the architecture review playbook (playbooks/architecture-review-playbook.md) for:

Feature: [feature name]
PRD: prds/[date]-[slug].md
Design proposal: [link to design doc or describe the design]

Required for this review:
1. At least 2 genuine alternatives evaluated (anti-strawman rule)
2. STRIDE threat assessment for any new data or auth surface
3. Performance considerations for the defined scale targets
4. Output ADR at: architecture/decisions/ADR-00N-[slug].md

Use templates/architecture-review-template.md for the review document.
Register the accepted ADR in memory/architecture-decisions.md.
```

---

## Prompt 8 — Deprecate Legacy Workflows (Quick)

Minimal version for fast housekeeping:

```
Add a deprecation notice to the top of each legacy workflow file.

For each file listed below, prepend this notice:

---
DEPRECATED: This workflow has been superseded. Use [NEW_WORKFLOW] instead.
See workflows/INDEX.md for the current workflow catalog.
---

Files to update:
- workflows/feature-development.md → superseded by: workflows/engineering-workflow.md
- workflows/discovery.md → superseded by: workflows/product-discovery.md
- workflows/incident-response.md → superseded by: workflows/incident-workflow.md
- workflows/architecture-review.md → superseded by: workflows/architecture-workflow.md
- workflows/sprint-planning.md → superseded by: playbooks/sprint-playbook.md
```

---

## Prompt 9 — Full System Audit

Use this after the first sprint to validate the system is working:

```
Conduct a system audit after Sprint 001. Read the following and report on each:

1. memory/open-questions.md — are all 5 blocking questions now resolved?
2. architecture/decisions/ — how many ADRs exist? Are they registered in memory/architecture-decisions.md?
3. memory/workflow-state/ — are any workflow states active or stale?
4. wiki/runbooks/ — do the 4 core runbooks exist?
5. memory/known-risks.md — have any risks materialized? Are all mitigations active?
6. workflows/INDEX.md — are legacy workflows deprecated?

Output: handoffs/session-[date]/system-audit.md summarizing status of each area,
with specific action items for gaps found.
```

---

## Prompt 10 — Incident Response (Emergency)

Use this if something breaks:

```
!incident

Detected at: [time]
What's broken: [one-sentence description]
Who is affected: [users / services]
Initial severity assessment: P[1/2/3/4]

Follow playbooks/incident-playbook.md immediately.

Create incident report at: incidents/INC-[YYYY-MM-DD]-[slug].md
using templates/incident-template.md

I am the incident commander. You are the technical lead.
```

---

## Recommended Session Start Checklist

Run this at the start of any new session before doing any work:

```
□ Read SYSTEM.md (2 min)
□ Read handoffs/session-2026-05-09/session-handoff.md (3 min)
□ Check memory/open-questions.md — any blocking questions still open?
□ Check memory/workflow-state/ — any in-progress workflows to resume?
□ Check memory/known-risks.md — any risks that need attention today?
□ Check open-work.md — what's P0 and P1?
□ Start with Prompt 0 if you're a new agent
□ Start with Prompt 1 if Q-001 through Q-005 are still unresolved
□ Start with Prompt 2 if all questions are answered and no discovery is in progress
```
