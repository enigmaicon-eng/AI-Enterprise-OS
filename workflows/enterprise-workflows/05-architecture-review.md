# WF-005: Architecture Review

**Version:** 1.0.0 | **Owner:** Architecture Org | **Tier:** T3 | **Class:** ELEVATED | **SLA:** 10 days

## Purpose
Evaluate architectural proposals (RFCs), record architectural decisions (ADRs), assess technical risk, ensure design patterns align with system-wide principles, and produce a binding architectural decision that governs implementation.

## Inputs

```
REQUIRED:
  proposal_type:        RFC | ADR | DESIGN_DOC | SPIKE_RESULT
  proposal_document:    artifact — structured document per RFC template
  proposer_id:          string — T2+ engineer or architect
  scope:                COMPONENT | SERVICE | PLATFORM | CROSS_CUTTING

OPTIONAL:
  feature_prd_id:       artifact_id — WF-001 output if feature-driven
  urgency:              IMMEDIATE | HIGH | STANDARD
  security_sensitive:   boolean
  pii_involved:         boolean
```

## Outputs / Artifacts

```
PRIMARY:
  ADR:                  wiki/architecture/decisions/ADR-{NNN}.md
  REVIEW_RECORD:        review notes, concerns, and resolution

SECONDARY:
  ARCHITECTURE_DIAGRAM: updated system diagram if topology changes
  SECURITY_ASSESSMENT:  if security_sensitive = true
  MIGRATION_GUIDE:      if proposal deprecates existing pattern
  TECH_DEBT_RECORD:     if known shortcuts approved under time constraint
```

## Lifecycle States

```
INITIATED → VALIDATING → PROPOSAL_PREP (if incomplete) → REVIEW_SCHEDULING
  → AUTOMATED_ANALYSIS → PEER_REVIEW → ARCHITECTURE_COUNCIL_REVIEW
  → [security] SECURITY_GATE → [G-ARCH] APPROVAL_GATE
  → ADR_WRITING → COMPLETED
  → REJECTED (with binding reason) | NEEDS_REVISION → RFC_REVISION → REVIEW_SCHEDULING
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T2+]              Root
S-002  PROPOSAL_VALIDATION     [AGENT: arch-agent]             depends_on: S-001
         Check: RFC template complete; problem statement, options, consequences
         On incomplete: return to proposer with checklist
S-003  SCOPE_CLASSIFICATION    [AGENT: arch-agent]             depends_on: S-002
         COMPONENT: 1 architect reviewer; 5-day SLA
         SERVICE: 2 architects; 7-day SLA; domain expert required
         PLATFORM: full architecture council; 10-day SLA
         CROSS_CUTTING: full council + T4 CTO sign-off
S-004  AUTOMATED_ANALYSIS      [AGENT: arch-agent]             depends_on: S-002
         Check: consistency with current ADR library
         Check: pattern conflicts with existing system design
         Check: performance/scalability implications (flagged risks)
         Check: if pii_involved → data governance requirements
S-005  SECURITY_SCAN           [AGENT: security-agent]         depends_on: S-002
         Only if: security_sensitive OR scope=PLATFORM OR external API
         OWASP threat model; data flow analysis; auth/authz pattern review
S-006  PEER_REVIEW             [HUMAN: T2+ engineers]          depends_on: S-004, S-005
         2 peer engineers assigned; async review
         SLA: 3 business days  |  Comments captured in review_record
S-007  ARCHITECTURE_COUNCIL    [HUMAN: T3+ architects]         depends_on: S-006
         Scope COMPONENT: 1 architect  |  SERVICE/PLATFORM: full council
         Review session (synchronous for PLATFORM/CROSS_CUTTING)
         Outcome: APPROVE | REJECT | CONDITIONAL_APPROVE | REQUEST_REVISION
S-008  ARCH_GATE               [GATE: G-ARCH]                  depends_on: S-007
         Pass: council vote >= 2/3 majority
         On conditional: conditions documented; tracked to completion
S-009  CTO_REVIEW              [GATE: G-EXEC T4]               depends_on: S-008
         Required: CROSS_CUTTING scope OR security-sensitive OR PLATFORM
         T4 CTO synchronous; SLA: 4hr IMMEDIATE, 24hr standard
S-010  ADR_WRITING             [AGENT: arch-agent]             depends_on: S-008 or S-009
         Draft ADR: context, decision, alternatives considered, consequences
         Number: next in sequence; update ADR index
S-011  ARCHITECTURE_DIAGRAM    [AGENT: arch-agent]             depends_on: S-010
         Update affected architecture diagrams (C4 model or equivalent)
S-012  MIGRATION_GUIDE         [AGENT: arch-agent]             depends_on: S-010
         Only if: existing pattern deprecated
         Document: migration path, timeline, breaking changes
S-013  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-010–S-012
S-014  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-013
S-015  NOTIFY_STAKEHOLDERS     [INTEGRATION]                   depends_on: S-013
         Notify: all engineers in affected service domain
S-016  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-015
```

## Approval Gates

```
G-AUTH:    proposer >= T2; RFC template complete
G-ARCH:    architecture council vote >= 2/3; all REJECT votes documented with binding reason
G-EXEC:    T4 CTO; required for PLATFORM or CROSS_CUTTING scope
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
Peer review SLA breach (3d)              Reminder + T3 escalation    4hr response
Council deadlock (split vote)            T4 CTO tiebreaker           4hr
Security scan finds critical issue       Block; T4 security review   2hr
Implementation proceeds without ADR      Governance finding; T3+     Immediate
CONDITIONAL_APPROVE conditions not met   Block implementation until  Per condition
```

## Governance Checkpoints

```
C-003: ADR artifact must exist before implementation begins
C-004: every architectural decision recorded with alternatives considered
C-001: PLATFORM/CROSS_CUTTING require T4 CTO approval
SECURITY: OWASP scan required for any new external interface
EU AI Act: AI architecture proposals reviewed for HIGH_RISK system implications
COMPLIANCE: data residency, encryption, PII handling checked vs. policy
```

## Observability

```
HEALTH METRICS:
  avg_review_cycle_days:    target <= 10
  first_pass_approval_rate: target >= 0.65 (proposals well-prepared before submission)
  adr_coverage:             pct of active services with current ADR target >= 0.90
  revision_rate:            REQUEST_REVISION per total target < 0.30
  security_finding_rate:    track; reduction = maturity signal
```

## Telemetry Events

```
enterprise.workflows.WF-005.initiated    {proposal_type, scope, proposer}
enterprise.workflows.WF-005.gate.G-ARCH  {result, vote_count, conditions}
enterprise.workflows.WF-005.gate.G-EXEC  {result, approver, scope}
enterprise.workflows.WF-005.rejected     {reason, binding_constraints}
enterprise.workflows.WF-005.completed    {adr_id, adr_number, scope}
```

## Rollback System

```
ROLLBACK WINDOW: 30 days post-ADR (before implementation fully committed)
ROLLBACK TRIGGER: security vulnerability discovered; fundamental design flaw found

ROLLBACK STEPS:
  R-010: mark ADR as SUPERSEDED; issue ADR addendum with reason
  R-011: notify all engineers in affected domain
  R-012: trigger new RFC for superseding design
  Implementation work in progress: pause and assess impact
```

## Enterprise System Integrations

```
GITHUB:      S-013 → open PR to add ADR to /docs/architecture/decisions/
JIRA:        S-013 → create implementation epic linked to ADR
CONFLUENCE:  S-013 → publish ADR to Architecture space
SLACK:       S-015 → notify #architecture channel with ADR summary
```

## Wiki Updates

```
wiki/architecture/decisions/ADR-{NNN}.md   ← full ADR
wiki/architecture/decision-index.md       ← append ADR to index
wiki/architecture/diagrams/              ← updated diagrams (if changed)
wiki/architecture/migration-guides/      ← migration guide (if applicable)
```

## Memory Updates

```
memory/architecture/adr-registry.yaml          ← new ADR entry
memory/architecture/pattern-library.yaml       ← new pattern (if introduced)
memory/knowledge-management/decision-records.yaml ← link ADR to knowledge graph
```
