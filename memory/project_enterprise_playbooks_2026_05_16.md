---
name: project-enterprise-playbooks-v25
description: 19 complete enterprise operational playbooks (PB-001–PB-019) in enterprise-playbooks/ directory; OS v25.0.0
metadata:
  type: project
---

19 enterprise operational playbooks built 2026-05-15/16; OS bumped to v25.0.0.

**Why:** User requested complete enterprise operational playbook library covering all recurring cadences, governance reviews, and trigger-based protocols.

**How to apply:** Any operational cadence question (how do we do X in this org?) is answered by the relevant playbook. The playbooks are the authoritative operating contracts, not guidelines.

## Playbooks Built

| ID | Playbook | Cadence | Tier | Class |
|----|----------|---------|------|-------|
| PB-001 | Executive Operating Cadence | Daily/Wkly/Mo/Qr | T4 | CRITICAL |
| PB-002 | PM Operating Cadence | Daily/Wkly/Sprint | T3 | ELEVATED |
| PB-003 | Architecture Councils | Bi-weekly | T3 | ELEVATED |
| PB-004 | Release Councils | Per-release | T3 | CRITICAL |
| PB-005 | Quarterly Planning | Quarterly | T3 | ELEVATED |
| PB-006 | Annual Planning | Annual | T4 | ELEVATED |
| PB-007 | AI Governance Reviews | Monthly/Qr | T4 | REGULATED |
| PB-008 | Experimentation Governance | Per-experiment | T2 | ELEVATED |
| PB-009 | Onboarding | Per-hire | T2 | STANDARD |
| PB-010 | Operational Readiness | Per-feature | T3 | CRITICAL |
| PB-011 | Release Readiness | Per-release | T3 | CRITICAL |
| PB-012 | Escalation Management | On-trigger | T3 | CRITICAL |
| PB-013 | Organizational Reviews | Quarterly | T4 | ELEVATED |
| PB-014 | Portfolio Reviews | Monthly/Qr | T3 | ELEVATED |
| PB-015 | Dependency Management | Weekly | T3 | ELEVATED |
| PB-016 | Customer Escalation Handling | On-trigger | T3 | CRITICAL |
| PB-017 | Organizational Evolution | On-trigger | T4 | SENSITIVE |
| PB-018 | Fintech Governance | Monthly/Qr | T4 | REGULATED |
| PB-019 | Runtime Governance | Weekly/Monthly | T3 | CRITICAL |

## Key Design Decisions

- All playbooks reference WF-001–WF-023 (enterprise workflow library); playbooks are the human operating layer on top of workflows
- All decisions are C-001 bound (human decisions; AI advisory only)
- Every playbook has: owner, tier, class, cadence, agenda templates, health metrics, anti-patterns, governance checkpoints
- REGULATED playbooks (PB-007, PB-018) incorporate EU AI Act + GDPR + DORA + PCI-DSS + AML obligations explicitly
- SENSITIVE playbook (PB-017) includes severance standards and legal pre-review requirements
- Playbook-workflow cross-reference in enterprise-playbooks/INDEX.md

## Entry Points

- `enterprise-playbooks/INDEX.md` — master index + cadence calendar
- `SYSTEM.md` — OS v25.0.0 with full playbook section

[[project-enterprise-workflows-v24]]
