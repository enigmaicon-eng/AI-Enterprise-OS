# Workflow Permission System

## Role
Defines and enforces permission requirements for every workflow class in the OS. Covers executive approvals, architecture approvals, compliance approvals, and all inter-workflow authorization gates.

## Workflow Permission Classes

```
CLASS                   EXAMPLES                                MIN_TIER    HUMAN_GATE
─────────────────────────────────────────────────────────────────────────────────────
STANDARD                Feature dev, research, sprint planning  T1          None
ELEVATED                Architecture changes, API changes       T2          T3 review
COMPLIANCE              Policy updates, audit workflows         T2          Compliance officer
EXECUTIVE               Budget decisions, org restructure       T4          T5 executive
ARCHITECTURE            ADRs, system design changes             T3          T4 CTO
RELEASE                 Production deployment                   T3          T4+T5 sign-off
PRODUCTION_ACCESS       Direct prod system interaction          T3          T4 real-time
CONSTITUTIONAL          OS core principles change               T5          Board vote
```

## Human-in-the-Loop Gates by Class

### Executive Approval Gate
```
TRIGGER: any workflow classified EXECUTIVE
REQUIRED_APPROVERS:
  - CPO or CTO (T5) for product/technical decisions
  - CAIO (T5) for AI capability decisions
  - Board (external) for budget > $1M or org restructure > 20% headcount
TIMEOUT: 48hr → auto-escalate to full executive council
OVERRIDE: none for EXECUTIVE class — no unilateral bypass
```

### Architecture Approval Gate
```
TRIGGER: workflow produces or modifies an ADR, changes API contracts, or alters agent topology
REQUIRED_APPROVERS:
  - Lead Architect (T4) — mandatory
  - Affected domain architects (T3) — quorum of 2/3
REVIEW_ARTIFACTS: RFC or ADR must exist before gate opens
SLA: 24hr standard, 4hr for CRITICAL architecture decisions
```

### Compliance Approval Gate
```
TRIGGER: workflow touches PII, data retention, regulatory obligations, or audit evidence
REQUIRED_APPROVERS:
  - DPO (T4) for GDPR/CCPA scope
  - CISO (T4) for security scope
  - Compliance Officer (T4) for regulatory scope
AUTO_ROUTE: based on regulatory domain mapping in compliance-framework/compliance-taxonomy.md
```

### Release Approval Gate
```
→ see permissions/production-safety-system.md
```

## Permission Inheritance Model
```
WORKFLOW INITIATOR TIER   → sets base permission ceiling
WORKFLOW TYPE CLASS       → sets required approvals
TASK SENSITIVITY          → may elevate ceiling one level
COMBINED RESULT           → effective_permission_set = intersection(tier_ceiling, class_requirements)
```

## Permission Delegation
```
T4 may delegate to T3: ELEVATED and COMPLIANCE gates only
T5 may delegate to T4: ARCHITECTURE gate only
EXECUTIVE and CONSTITUTIONAL gates: no delegation permitted
```

## Persistence
`memory/permissions/workflow-permission-state.yaml`
`memory/permissions/approval-gate-log.jsonl`
