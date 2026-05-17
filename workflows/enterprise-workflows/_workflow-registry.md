# Enterprise Workflow Registry

**Version:** 2.0.0 | **Last Updated:** 2026-05-15 | **Total Workflows:** 23

## Role
Canonical index of all enterprise workflows. Authoritative source for workflow metadata, routing triggers, dependency graph, gate requirements, escalation contacts, and SLA targets.

---

## Registry

```
ID       NAME                          OWNER ORG            TIER  CLASS      SLA          FILE
────────────────────────────────────────────────────────────────────────────────────────────────────────────
WF-001   Product Discovery             PM Org               T3    ELEVATED   5 days       01-product-discovery.md
WF-002   Annual Planning               PM + Exec Org        T4    ELEVATED   30 days      02-annual-planning.md
WF-003   Quarterly Planning            PM Org               T3    ELEVATED   14 days      03-quarterly-planning.md
WF-004   Roadmap Governance            PM Org               T3    ELEVATED   7 days       04-roadmap-governance.md
WF-005   Architecture Review           Architecture Org     T3    ELEVATED   14 days      05-architecture-review.md
WF-006   AI Feature Delivery           Engineering Org      T3    REGULATED  21 days      06-ai-feature-delivery.md
WF-007   API Development               Engineering Org      T2    ELEVATED   14 days      07-api-development.md
WF-008   Runtime Orchestration         Engineering Org      T2    CRITICAL   Real-time    08-runtime-orchestration.md
WF-009   Experimentation               PM + Eng Org         T2    ELEVATED   14 days      09-experimentation.md
WF-010   Release Governance            Delivery Org         T3    CRITICAL   2 days       10-release-governance.md
WF-011   Rollout Governance            Delivery Org         T3    CRITICAL   Real-time    11-rollout-governance.md
WF-012   Incident Management           Engineering Org      T2    CRITICAL   <15min ACK   12-incident-management.md
WF-013   Postmortem                    Engineering Org      T2    ELEVATED   5 days       13-postmortem.md
WF-014   Compliance Review             Governance Org       T3    REGULATED  21 days      14-compliance-review.md
WF-015   Stakeholder Alignment         PM Org               T3    ELEVATED   7 days       15-stakeholder-alignment.md
WF-016   Dependency Coordination       Delivery Org         T3    ELEVATED   5 days       16-dependency-coordination.md
WF-017   Customer Escalation           Customer Success Org T3    CRITICAL   4hr ACK      17-customer-escalation.md
WF-018   Fintech Onboarding            Customer Success Org T3    REGULATED  30 days      18-fintech-onboarding.md
WF-019   Mortgage Onboarding           Customer Success Org T3    REGULATED  45 days      19-mortgage-onboarding.md
WF-020   Organizational Evolution      People + Exec Org    T4    SENSITIVE  60 days      20-organizational-evolution.md
WF-021   Workflow Optimization         Engineering Org      T3    STANDARD   14 days      21-workflow-optimization.md
WF-022   Event-Driven Workflows        Engineering Org      T2    CRITICAL   Real-time    22-event-driven-workflows.md
WF-023   Runtime Execution Workflows   Engineering Org      T2    CRITICAL   Real-time    23-runtime-execution-workflows.md
```

---

## Approval Gates by Workflow

```
ID       REQUIRED GATES                                       ESCALATION TIER
──────────────────────────────────────────────────────────────────────────────────────────
WF-001   G-AUTH(T3), G-QUALITY, G-EXEC(major)               T4 PM VP
WF-002   G-AUTH(T4), G-QUALITY, G-EXEC(T5)                  T5 CPO/CEO
WF-003   G-AUTH(T3), G-QUALITY, G-EXEC(T4)                  T4 PM VP
WF-004   G-AUTH(T3), G-EXEC(MAJOR changes)                  T4 PM VP
WF-005   G-AUTH(T3), G-ARCH(T4), G-QUALITY                  T4 CTO
WF-006   G-AUTH(T3), G-QUALITY, G-SECURITY, G-LEGAL(T4)     T4 DPO + T5 CTO
WF-007   G-AUTH(T2), G-QUALITY, G-ARCH(breaking changes)    T4 architect
WF-008   G-AUTH(T2), COMPOUND(no active incidents)           T3 on-call
WF-009   G-AUTH(T2), G-QUALITY, G-EXEC(launch)              T4 PM VP
WF-010   G-AUTH(T3), G-QUALITY, G-SECURITY, G-ARCH, G-EXEC  T5 CPO / T4 CTO
WF-011   G-AUTH(T3), COMPOUND(release validated)            T3 on-call
WF-012   SEV_CONFIRM, MITIGATION, CLOSE(commander)          T4→T5 by severity
WF-013   G-AUTH(T2), G-QUALITY(blameless scan)              T3 engineering lead
WF-014   G-AUTH(T3), G-QUALITY, G-LEGAL(T4 DPO)            T4 DPO + T5 for submission
WF-015   G-AUTH(T3), G-EXEC(unresolved conflict)            T4 exec sponsor
WF-016   G-AUTH(T3), G-EXEC(SLA breach)                     T4 program exec
WF-017   G-AUTH(any T2), G-EXEC(ESC1 comms)                 T4 CS VP → T5 CEO
WF-018   G-AUTH(T3), G-LEGAL(T4 DPO), G-SECURITY           T4 DPO + Legal
WF-019   G-AUTH(T3), G-LEGAL(T4 DPO + compliance), G-SECURITY  T4 DPO + Legal
WF-020   G-AUTH(T4), G-EXEC(T5, >10 people)                 T5 CEO/CPO
WF-021   G-AUTH(T3), G-QUALITY(T3/T4/T5 by change type)    T4 for governance changes
WF-022   G-AUTH(T2)                                          T3 eng lead
WF-023   G-AUTH                                              T4 + auto-checkpoint restore
```

---

## Routing Trigger Map

```
INTENT / EVENT / TRIGGER                                  → WORKFLOW
──────────────────────────────────────────────────────────────────────────────────────────────────
"I want to build [feature]" / new PRD request             → WF-001  Product Discovery
"Annual planning cycle / OKR planning"                    → WF-002  Annual Planning
"Q{N} planning / sprint planning cycle"                   → WF-003  Quarterly Planning
"Roadmap change / priority shift / backlog re-order"      → WF-004  Roadmap Governance
"RFC / ADR / design decision / new service / schema change" → WF-005 Architecture Review
"AI or ML feature / model deployment / HIGH_RISK AI"      → WF-006  AI Feature Delivery
"New API / API version / contract change"                 → WF-007  API Development
"Runtime config / agent orchestration / DAG execution"    → WF-008  Runtime Orchestration
"A/B test / experiment / feature flag test"               → WF-009  Experimentation
"Release candidate ready / release approval needed"       → WF-010  Release Governance
"Deploy to production / rollout execution"                → WF-011  Rollout Governance
"!incident / production alert / SEV declared"             → WF-012  Incident Management
"Incident closed / postmortem required"                   → WF-013  Postmortem
"Compliance audit / regulatory review / SOC2 / GDPR"      → WF-014  Compliance Review
"Stakeholder alignment needed / decision blocked"         → WF-015  Stakeholder Alignment
"Cross-team dependency / blocked on another team"         → WF-016  Dependency Coordination
"Customer escalation / SLA breach / executive complaint"  → WF-017  Customer Escalation
"New fintech customer / KYB required / payments onboarding" → WF-018 Fintech Onboarding
"New lender / mortgage customer / HMDA / NMLS"            → WF-019  Mortgage Onboarding
"Team restructure / reorg / scope realignment"            → WF-020  Organizational Evolution
"Workflow inefficiency / postmortem action item (process)" → WF-021 Workflow Optimization
"Register event trigger / automate workflow initiation"   → WF-022  Event-Driven Workflows
"Execution engine / DAG runtime / step scheduling"        → WF-023  Runtime Execution Workflows

AUTOMATED TRIGGERS (WF-022 event-driven):
enterprise.incidents.SEV1.detected                        → WF-012  (auto-initiate)
enterprise.incidents.WF-012.closed [SEV1/SEV2]            → WF-013  (auto-initiate)
enterprise.deployments.rollback.triggered                 → WF-012  (auto-initiate)
enterprise.incidents.recurrence.detected                  → WF-021  (auto-initiate)
enterprise.teams.health [DISTRESSED/CRITICAL]             → T4 alert (no auto-workflow)
enterprise.eu_ai_act.model.high_risk                      → WF-006  compliance check
enterprise.compliance.policy.updated                      → WF-014  review initiation
```

---

## Workflow Dependency Graph

```
UPSTREAM                           DOWNSTREAM
──────────────────────────────────────────────────────────────────────────────────────────
WF-001 (Product Discovery)    →    WF-005 (complex features trigger arch review)
WF-001 (Product Discovery)    →    WF-006 (AI features require AI delivery workflow)
WF-001 (Product Discovery)    →    WF-009 (features that need validation → experiment)
WF-002 (Annual Planning)      →    WF-003 (annual OKRs drive quarterly planning)
WF-003 (Quarterly Planning)   →    WF-016 (quarterly planning surfaces dependencies)
WF-003 (Quarterly Planning)   →    WF-015 (planning surfaces alignment needs)
WF-005 (Arch Review)          →    WF-006 (AI features must pass arch review)
WF-005 (Arch Review)          →    WF-007 (APIs must pass arch review if contract change)
WF-006 (AI Feature Delivery)  →    WF-010 (AI feature completes → release governance)
WF-007 (API Development)      →    WF-010 (API completes → release governance)
WF-009 (Experimentation)      →    WF-011 (experiment rollout via rollout governance)
WF-010 (Release Governance)   →    WF-011 (approved release → rollout governance)
WF-011 (Rollout Governance)   →    WF-012 (rollout regression → incident management)
WF-012 (Incident Management)  →    WF-013 (SEV1/SEV2 closed → postmortem)
WF-013 (Postmortem)           →    WF-021 (systemic process failure → workflow optimization)
WF-013 (Postmortem)           →    WF-005 (architecture gap → arch review)
WF-014 (Compliance Review)    →    WF-006 (compliance gate on AI features)
WF-014 (Compliance Review)    →    WF-021 (compliance gap → workflow optimization)
WF-015 (Stakeholder Alignment) →   WF-003 (alignment unblocks quarterly plan)
WF-016 (Dependency Coord)     →    WF-015 (unresolvable dependency → stakeholder alignment)
WF-017 (Customer Escalation)  →    WF-012 (technical root cause → incident)
WF-017 (Customer Escalation)  →    WF-013 (postmortem if technical failure confirmed)
WF-018 (Fintech Onboarding)   →    WF-014 (compliance conditions raised → review)
WF-019 (Mortgage Onboarding)  →    WF-014 (compliance conditions raised → review)
WF-019 (Mortgage Onboarding)  →    WF-006 (AI underwriting model → AI feature delivery)
WF-020 (Org Evolution)        →    WF-021 (org change causes workflow performance issues)
WF-021 (Workflow Optimization) →   WF-023 (updated workflow → runtime re-registration)
WF-022 (Event-Driven)         →    ANY    (triggers any workflow on matching event)
WF-023 (Runtime Execution)    ←    ALL    (all workflows execute via WF-023 engine)
```

---

## SLA Summary

```
CLASS        ID       SLA           NOTES
──────────────────────────────────────────────────────────────────────────────────────────
REAL-TIME    WF-008   < 1s rollback  Runtime orchestration; canary atomic rollback
             WF-011   < 10s rollback Rollout governance; sub-10s traffic shift
             WF-012   < 15min ACK   SEV1: 5min ACK; SEV2: 15min ACK
             WF-022   < 500ms        Event → workflow initiation (CRITICAL triggers)
             WF-023   < 100ms steps  System steps; human steps per workflow SLA

DAYS (SHORT) WF-010   2 days        Release governance full approval chain
             WF-001   5 days        Product discovery; opportunity validation
             WF-013   5 days        Postmortem; SEV1 mandatory within 5d
             WF-016   5 days        Dependency coordination + commitment
             WF-017   4hr ACK       Customer escalation; ESC1: 1hr ACK

DAYS (MED)   WF-004   7 days        Roadmap governance
             WF-015   7 days        Stakeholder alignment
             WF-007   14 days       API development
             WF-009   14 days       Experimentation (min duration)
             WF-021   14 days       Workflow optimization cycle
             WF-005   14 days       Architecture review
             WF-003   14 days       Quarterly planning
             WF-006   21 days       AI feature delivery (REGULATED)
             WF-014   21 days       Compliance review (REGULATED)

DAYS (LONG)  WF-002   30 days       Annual planning
             WF-018   30 days       Fintech onboarding (REGULATED)
             WF-019   45 days       Mortgage onboarding (REGULATED)
             WF-020   60 days       Organizational evolution (SENSITIVE)
```

---

## Class Definitions

```
CLASS       WORKFLOWS             MEANING
──────────────────────────────────────────────────────────────────────────────────────────
CRITICAL    WF-008,011,012,017,   Real-time or near-real-time; production impact; paged
            022,023               on-call; automatic rollback available
REGULATED   WF-006,014,018,019   Requires DPO/CISO/compliance sign-off; 7yr evidence retention;
                                  EU AI Act / GDPR / RESPA / AML applicable
ELEVATED    WF-001,003,004,005,   Human approval gates; 24–72hr response SLAs;
            007,009,013,015,016   escalation to T3/T4; artifact-required
SENSITIVE   WF-020                Confidentiality required during design phase;
                                  T5 approval; legal review mandatory
STANDARD    WF-021                T3 approval; lower escalation; data-driven
```

---

## Governance Checkpoints Quick Reference

```
CHECKPOINT  APPLIES TO                              RULE
──────────────────────────────────────────────────────────────────────────────────────────
C-001       ALL workflows with HUMAN steps          Human must resolve; AI cannot auto-complete
C-004       ALL workflows                           All decisions + artifacts permanently recorded
C-003       WF-006,010,013,014,018,019             Artifact required before proceeding (PRD, ADR, etc.)
C-006       WF-006,014,018,019 (GDPR scope)        DPO review mandatory; personal data inventory
EU_AI_ACT   WF-006,014                             Enforcement date 2026-08-02; HIGH_RISK must comply
BLAMELESS   WF-013                                 AI scans for blame language; blocks publish if found
SANCTIONS   WF-018                                 Positive match = immediate freeze; no exceptions
SAME_DAY    WF-020                                 All affected individuals notified same business day
ROLLBACK    WF-011                                 Automatic rollback always available; never disabled
AUDIT_CHAIN WF-010,011,023                         SHA-256 hash-chained; tamper-evident; permanent
```

---

## Rollback Policy Summary

```
ID       ROLLBACK POLICY
──────────────────────────────────────────────────────────────────────────────────────────
WF-008   < 1s atomic traffic shift; state restored from pre-deploy snapshot
WF-010   NO_GO: gate fail → fix + re-run gate; no rollback of governance itself
WF-011   < 10s traffic shift; 30-day rollback window post-completion; T4 after 30 days
WF-012   Incident record is append-only; ROLLBACK handled via WF-011 within incident
WF-013   Decisions stand; INCORRECT_FINDING: DPO approves addendum; version incremented
WF-014   Compliance findings stand; INCORRECT_FINDING: addendum + version bump
WF-015   Decisions superseded by new WF-015 run; silent override detected + flagged
WF-016   Commitments are tracked records; reliability scores updated on failure
WF-017   Communications not rolled back; corrections made transparently
WF-018   Pre-activation: safe to deprovision; post-activation: offboarding process
WF-019   Pre-activation: safe to deprovision; post-activation: compliance hold 90 days
WF-020   Org changes reversible; reversal requires new WF-020 + re-brief
WF-021   Workflow changes versioned; revert to prior version if metrics worsen
WF-022   Trigger pause/delete instant; in-flight workflows complete; schema rollback pauses
WF-023   Executions forward-only; CHECKPOINT_RESTORE on infra failure; 30-day suspension
```

---

## Workflow Persistence Paths

```
ID       MEMORY UPDATES (on completion)
──────────────────────────────────────────────────────────────────────────────────────────
WF-001   memory/work-cognition/pattern-library.yaml
         memory/knowledge-management/learnings.yaml
WF-002   memory/work-cognition/sprint-risk-assessments.yaml
         memory/org-intelligence/org-performance-records.yaml
WF-003   memory/team-intelligence/velocity-records.yaml
         memory/team-intelligence/capacity-records.yaml
         memory/org-intelligence/dependency-registry.yaml
WF-004   memory/governance/decision-registry.yaml
WF-005   memory/knowledge-management/learnings.yaml
         architecture/decisions/ (ADR file)
WF-006   memory/compliance/open-findings.yaml
         memory/data-fabric/governance-policy-state.yaml
WF-007   memory/deployment-intelligence/version-registry.yaml
WF-008   memory/deployment-intelligence/canary-state.yaml
WF-009   memory/work-cognition/pattern-library.yaml
WF-010   memory/deployment-intelligence/deployment-queue.yaml
         memory/deployment-intelligence/version-registry.yaml
WF-011   memory/deployment-intelligence/deployment-history.jsonl
         memory/deployment-intelligence/canary-state.yaml
         memory/deployment-intelligence/version-registry.yaml
WF-012   memory/incidents/incident-registry.yaml
         memory/incidents/incident-history.jsonl
         memory/data-intelligence/anomaly-records.yaml
WF-013   memory/incidents/incident-registry.yaml
         memory/knowledge-management/learnings.yaml
         memory/work-cognition/pattern-library.yaml
WF-014   memory/compliance/compliance-reports.yaml
         memory/compliance/open-findings.yaml
         memory/data-fabric/governance-policy-state.yaml
WF-015   memory/governance/decision-registry.yaml
         memory/work-cognition/active-bottlenecks.yaml
         memory/org-intelligence/coupling-matrix.yaml
WF-016   memory/org-intelligence/dependency-registry.yaml
         memory/org-intelligence/coupling-matrix.yaml
         memory/work-cognition/active-bottlenecks.yaml
WF-017   memory/incidents/incident-registry.yaml
         memory/knowledge-management/learnings.yaml
WF-018   memory/compliance/open-findings.yaml
         memory/data-fabric/governance-policy-state.yaml
WF-019   memory/compliance/open-findings.yaml
         memory/data-fabric/governance-policy-state.yaml
WF-020   memory/org-intelligence/org-performance-records.yaml
         memory/org-intelligence/coupling-matrix.yaml
         memory/people-intelligence/skill-graph.yaml
         memory/people-intelligence/concentration-risks.yaml
         memory/team-intelligence/team-health-scores.yaml
WF-021   memory/work-cognition/active-bottlenecks.yaml
         memory/work-cognition/pattern-library.yaml
         memory/knowledge-management/learnings.yaml
WF-022   memory/deployment-intelligence/deployment-history.jsonl
         memory/data-intelligence/anomaly-records.yaml
WF-023   memory/deployment-intelligence/deployment-history.jsonl
         memory/work-cognition/flow-metrics-current.yaml
         memory/work-cognition/active-bottlenecks.yaml

ALL WF:  memory/enterprise-workflows/workflow-execution-log.jsonl
         memory/enterprise-workflows/workflow-health-metrics.yaml
```

---

## Execution Infrastructure

```
EXECUTION ENGINE:    WF-023 (Runtime Execution Workflows) — all workflows run on this substrate
EVENT TRIGGERS:      WF-022 (Event-Driven Workflows) — automated initiation on enterprise events
HEALTH METRICS:      memory/enterprise-workflows/workflow-health-metrics.yaml
EXECUTION LOG:       memory/enterprise-workflows/workflow-execution-log.jsonl
ACTIVE EXECUTIONS:   memory/enterprise-workflows/active-executions.yaml
EVENT TRIGGERS:      memory/enterprise-workflows/event-trigger-registry.yaml
TELEMETRY NAMESPACE: enterprise.workflows.WF-{NNN}.*
```
