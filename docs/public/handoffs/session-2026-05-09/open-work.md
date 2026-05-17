---
type: open-work
as-of: 2026-05-09
priority-system: P0 (must before next initiative) | P1 (should this week) | P2 (next 2 weeks) | P3 (backlog)
---

# Open Work

Everything that is not yet done. Organized by priority. Read this before starting any new session.

---

## P0 — Blocking (Must resolve before first real initiative)

These gaps prevent the OS from operating on a real product initiative.

### 1. Answer the 5 Blocking Questions

**Location:** `memory/open-questions.md` (Q-001 through Q-005)

| Question | Impact if Unanswered |
|---------|---------------------|
| Q-001: Primary tech stack | Cannot write ADRs, cannot scaffold implementation |
| Q-002: Greenfield vs. existing user base | Discovery scope changes entirely |
| Q-003: Cloud provider + infra constraints | Architecture decisions depend on this |
| Q-004: Compliance requirements (GDPR/SOC2/HIPAA/PCI) | Security policy and data model are blocked |
| Q-005: Human product owner | PRD cannot be approved; go/no-go has no authority |

**How to resolve:** Human operator answers these in a new session before any product work begins.

### 2. Write the First ADR

**Location:** `architecture/decisions/` (currently only has README)

The ADR directory has zero actual ADRs. The very first one should capture the foundational architectural choice that defines the OS's own technical approach — even if just the coordination layer. Required before any L-tier engineering work.

**Template:** `templates/adr-template.md`
**Naming:** `architecture/decisions/ADR-001-<slug>.md`

---

## P1 — Important (This Week)

### 3. Upgrade Pre-existing Legacy Templates

8 templates from the installed repos have not been upgraded to enterprise-grade standards:

| Template | Current State | Gap |
|---------|--------------|-----|
| `templates/adr-template.md` | Pre-existing stub | No consequences section, no rejection rationale table, no conditions tracking |
| `templates/sprint-template.md` | Pre-existing stub | No velocity tracking, no DORA fields, no scope change log |
| `templates/retro-template.md` | Pre-existing stub | No action item quality rules, no prior retro review |
| `templates/threat-model-template.md` | Pre-existing stub | Likely thin — needs STRIDE table, threat rating, remediation tracking |
| `templates/release-template.md` | Pre-existing stub | Likely thin — distinct from rollout-plan-template.md |
| `templates/test-plan-template.md` | Pre-existing stub | Superseded by qa-plan-template.md but still referenced |
| `templates/runbook-template.md` | Pre-existing stub | Needs 7-section structure from docs-agent.md |

### 4. Upgrade Legacy Workflows

7 pre-existing workflow stubs in `workflows/` need to either be upgraded or explicitly deprecated:

| Workflow | Status | Action |
|---------|--------|--------|
| `workflows/feature-development.md` | Legacy stub | Superseded by engineering-workflow.md — add deprecation notice |
| `workflows/discovery.md` | Legacy stub | Superseded by product-discovery.md — add deprecation notice |
| `workflows/incident-response.md` | Legacy stub | Superseded by incident-workflow.md — add deprecation notice |
| `workflows/sprint-planning.md` | Legacy stub | Partially covered by sprint-playbook.md — evaluate and deprecate or upgrade |
| `workflows/architecture-review.md` | Legacy stub | Superseded by architecture-workflow.md + architecture-review-playbook.md — deprecate |
| `workflows/release-workflow.md` | Legacy stub | Overlaps release-playbook.md — evaluate |
| `workflows/wiki-maintenance.md` | Legacy stub | No new equivalent exists — upgrade or keep |

### 5. Create Missing Wiki Sections

| Section | Gap |
|---------|-----|
| `wiki/runbooks/` | Does not exist — needed by release-playbook.md pre-release checklist |
| `wiki/learnings/` | Does not exist — needed by all workflow close steps |
| `wiki/architecture/decisions-index.md` | Would surface ADRs without reading each file |
| `wiki/processes/discovery-pipeline-status.md` | Referenced in PM-review-playbook.md |

### 6. Write the First Sprint Plan

**Location:** `sprints/` (directory does not exist yet)

The OS is ready to run a sprint. Creating `sprints/` and `sprints/sprint-001/sprint-plan.md` is the operational start. Nothing requires content — this is about standing up the directory and running the first `playbooks/sprint-playbook.md §①`.

---

## P2 — Soon (Next 2 Weeks)

### 7. Document the Installed Plugin Inventory

The OS uses many installed repos (BMAD-METHOD, ai-pm-copilot, agent-teams, etc.) but there is no canonical document mapping which plugin provides what capability. Future agents may try to use plugins that exist but are unknown.

**Location to create:** `wiki/architecture/installed-plugins.md`

### 8. Create `wiki/runbooks/` Stubs for Core Operations

Before the first feature ships, these runbooks should exist:
- `wiki/runbooks/deployment-runbook.md`
- `wiki/runbooks/rollback-runbook.md`
- `wiki/runbooks/incident-response-runbook.md`
- `wiki/runbooks/database-migration-runbook.md`

Template available: `templates/runbook-template.md`

### 9. Build the Sprints Directory Structure

```
sprints/
├── README.md
├── sprint-001/
│   ├── sprint-plan.md
│   ├── sprint-review.md
│   └── retro.md
```

### 10. Create Analytics Event Taxonomy Stub

`analytics/event-taxonomy-standard.md` — the standard format for all events, so engineering knows what to instrument before the first feature ships.

### 11. Extend memory/failures/ with First Known Failure Mode

`memory/failures/README.md` is a stub. The first documented failure mode should be added to teach future agents what not to do. Good candidates:
- Context overflow from loading full workflows without compression
- Rubber-stamp architecture review (< 30 min, no blocking comments)

---

## P3 — Backlog

### 12. Wire Superpowers Integration

`agents/engineer-agent.md` references the `superpowers` plugin for subagent-driven development. The integration path (`brainstorm → design → plan → execute → review`) is described but not verified against the actual `superpowers/` directory contents.

### 13. Validate BMAD-METHOD Integration

`BMAD-METHOD/` is installed. The orchestrator references it but no formal integration test has been run. Verify which BMAD workflows map to which OS workflows.

### 14. Add Second OS Onboarding Guide

`wiki/onboarding/agent-ops.md` covers operations. A complementary `wiki/onboarding/contributor-guide.md` would cover how to extend the OS (add a new agent, add a new workflow, add a template).

### 15. Automated Governance Checks

Currently all governance gates are manually operated. A future improvement: automated pre-flight checks before any agent starts a step, verifying that required artifacts exist at expected paths.

### 16. Context Manager Calibration

`orchestrator/context-manager.md` defines token budgets (PM: 8K, Engineer: 10K, etc.) but these have not been empirically validated against Claude's actual behavior. Calibration run recommended after the first real initiative.

---

## Structural Gaps (Directories That Don't Exist Yet)

| Directory | Needed For | How to Create |
|-----------|-----------|--------------|
| `sprints/` | Sprint planning and reviews | Create `sprints/README.md` + first sprint |
| `incidents/` | Incident reports | Create when first incident occurs (`!incident`) |
| `bugs/` | Bug reports | Create when first bug is filed |
| `wiki/runbooks/` | Operational runbooks | Create immediately (pre-release checklist requires it) |
| `wiki/learnings/` | Retrospective learnings | Create at close of first sprint |
| `analytics/` | Metrics frameworks | Has directory but needs `event-taxonomy-standard.md` |
