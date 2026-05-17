# Enterprise Operational Playbooks

**Version:** 1.0.0 | **Last Updated:** 2026-05-15 | **Total Playbooks:** 19

## Role
Deterministic operating procedures for all recurring enterprise cadences — specifying participants, schedules, agendas, decision frameworks, artifacts, follow-up protocols, escalation paths, and governance checkpoints. Each playbook is the authoritative operating contract for its cadence.

## Playbook Index

```
ID      PLAYBOOK                        CADENCE           TIER  CLASS     FILE
─────────────────────────────────────────────────────────────────────────────────────────────────
PB-001  Executive Operating Cadence     Daily/Wkly/Mo/Qr  T4    CRITICAL  01-executive-operating-cadence.md
PB-002  PM Operating Cadence            Daily/Wkly/Sprt   T3    ELEVATED  02-pm-operating-cadence.md
PB-003  Architecture Councils           Bi-weekly         T3    ELEVATED  03-architecture-councils.md
PB-004  Release Councils                Per-release       T3    CRITICAL  04-release-councils.md
PB-005  Quarterly Planning              Quarterly         T3    ELEVATED  05-quarterly-planning.md
PB-006  Annual Planning                 Annual            T4    ELEVATED  06-annual-planning.md
PB-007  AI Governance Reviews           Monthly/Qr        T4    REGULATED 07-ai-governance-reviews.md
PB-008  Experimentation Governance      Per-experiment    T2    ELEVATED  08-experimentation-governance.md
PB-009  Onboarding                      Per-hire          T2    STANDARD  09-onboarding.md
PB-010  Operational Readiness           Per-feature       T3    CRITICAL  10-operational-readiness.md
PB-011  Release Readiness               Per-release       T3    CRITICAL  11-release-readiness.md
PB-012  Escalation Management           On-trigger        T3    CRITICAL  12-escalation-management.md
PB-013  Organizational Reviews          Quarterly         T4    ELEVATED  13-organizational-reviews.md
PB-014  Portfolio Reviews               Monthly/Qr        T3    ELEVATED  14-portfolio-reviews.md
PB-015  Dependency Management           Weekly            T3    ELEVATED  15-dependency-management.md
PB-016  Customer Escalation Handling    On-trigger        T3    CRITICAL  16-customer-escalation-handling.md
PB-017  Organizational Evolution        On-trigger        T4    SENSITIVE 17-organizational-evolution.md
PB-018  Fintech Governance              Monthly/Qr        T4    REGULATED 18-fintech-governance.md
PB-019  Runtime Governance              Weekly/Monthly    T3    CRITICAL  19-runtime-governance.md
```

## Quick Reference: Cadence Calendar

```
DAILY
  ├── Executive health check (PB-001)
  ├── PM standup (PB-002)
  └── On-call handoff (PB-019)

WEEKLY
  ├── PM weekly sync (PB-002)
  ├── Dependency review (PB-015)
  ├── Portfolio pulse (PB-014)
  └── Runtime health review (PB-019)

BI-WEEKLY
  └── Architecture council (PB-003)

PER-SPRINT (2-week)
  ├── Sprint planning (PB-002)
  ├── Sprint review + retro (PB-002)
  └── Release readiness (PB-011)

MONTHLY
  ├── Portfolio review (PB-014)
  ├── AI governance review (PB-007)
  ├── Fintech governance (PB-018)
  └── Org review (PB-013)

QUARTERLY
  ├── Quarterly planning (PB-005)
  ├── Org review (PB-013)
  ├── Portfolio review (PB-014)
  ├── AI governance (PB-007)
  └── Fintech governance (PB-018)

ANNUAL
  └── Annual planning (PB-006)

ON TRIGGER
  ├── Release council (PB-004)     — on release candidate
  ├── Escalation mgmt (PB-012)     — on SEV1/SEV2/ESC1
  ├── Customer escalation (PB-016) — on customer ESC1/ESC2
  └── Org evolution (PB-017)       — on restructure decision
```

## Workflow Cross-Reference

```
PLAYBOOK → PRIMARY WORKFLOW(S)
──────────────────────────────────────────────────────────────────────────────────────
PB-001  Executive Cadence          → WF-002, WF-003, WF-012, WF-020
PB-002  PM Cadence                 → WF-001, WF-003, WF-004, WF-015
PB-003  Architecture Councils      → WF-005
PB-004  Release Councils           → WF-010, WF-011
PB-005  Quarterly Planning         → WF-003, WF-016
PB-006  Annual Planning            → WF-002
PB-007  AI Governance Reviews      → WF-006, WF-014
PB-008  Experimentation Governance → WF-009
PB-009  Onboarding                 → WF-001, WF-007
PB-010  Operational Readiness      → WF-010, WF-011, WF-012
PB-011  Release Readiness          → WF-010, WF-011
PB-012  Escalation Management      → WF-012, WF-013, WF-017
PB-013  Organizational Reviews     → WF-020, WF-002
PB-014  Portfolio Reviews          → WF-003, WF-004
PB-015  Dependency Management      → WF-016, WF-015
PB-016  Customer Escalation        → WF-017, WF-012
PB-017  Organizational Evolution   → WF-020
PB-018  Fintech Governance         → WF-018, WF-014
PB-019  Runtime Governance         → WF-008, WF-011, WF-012, WF-023
```
