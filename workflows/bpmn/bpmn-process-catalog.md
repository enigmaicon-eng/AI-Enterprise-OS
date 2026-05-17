# BPMN Process Catalog — Enterprise Standard Processes

## Purpose
Registry of all standard enterprise processes expressed in BPMN. Each entry is a reusable process template with a unique ID, classification, and invocation contract. New processes MUST be registered here before deployment.

---

## Catalog Schema

```yaml
process:
  id: "PROC-DOMAIN-NNN"
  name: "Process Name"
  version: "1.0.0"
  owner: "org-name"
  classification: OPERATIONAL | GOVERNANCE | CASE | INCIDENT | INTEGRATION
  complexity: SIMPLE | MODERATE | COMPLEX | ENTERPRISE
  avg_duration_ms: integer
  governance:
    tier_required: 0–5
    constitutional_check: true/false
    audit_level: NONE | STANDARD | ENHANCED
  inputs: [schema references]
  outputs: [schema references]
  error_codes: [ERR_XXX]
  subprocess_ids: [PROC-XXX]
  status: DRAFT | ACTIVE | DEPRECATED
```

---

## Registered Processes

### PROC-GOV-001 — RFC Approval Process
```yaml
id: PROC-GOV-001
name: RFC Approval Process
version: 2.1.0
owner: architecture
classification: GOVERNANCE
complexity: COMPLEX
avg_duration_ms: 86400000   # 24h nominal
governance:
  tier_required: 3
  constitutional_check: true
  audit_level: ENHANCED
inputs:
  - rfc_document: RFC schema v1
  - submitter_id: agent-id
outputs:
  - decision: APPROVED | REJECTED | DEFERRED
  - decision_rationale: string
  - reviewer_ids: [agent-id]
error_codes:
  - ERR_GOVERNANCE_TIMEOUT
  - ERR_QUORUM_NOT_MET
  - ERR_CONSTITUTIONAL_VIOLATION
subprocess_ids:
  - PROC-GOV-005   # constitutional review
  - PROC-GOV-006   # quorum collection
status: ACTIVE
```

**Flow Summary:**
```
(○ RFC submitted) ——→ [⚙ validate RFC schema]
  ——→ ◇ X (valid?) ——NO——→ [⚙ reject with reason] ——→ (● rejected)
  ——YES——→ [⚙ route to reviewers]
  ——→ ◇ + (parallel review)
      ——→ [👤 peer review]
      ——→ [👤 architecture review]
      ——→ [▷ PROC-GOV-005 constitutional check]
  ——→ ◇ + (join)
  ——→ [▷ PROC-GOV-006 quorum]
  ——→ ◇ X (quorum met?) ——NO——→ (⊙ timer 24h) ——→ [△ escalation event]
  ——YES——→ [📋 decision rule]
  ——→ ◇ X (decision?)
      ——APPROVED——→ [⚙ publish approval] ——→ (● approved)
      ——REJECTED——→ [⚙ publish rejection] ——→ (● rejected)
      ——DEFERRED——→ [⚙ schedule resurface] ——→ (● deferred)
```

---

### PROC-ENG-001 — Feature Deployment Process
```yaml
id: PROC-ENG-001
name: Feature Deployment Process
version: 1.3.0
owner: engineering
classification: OPERATIONAL
complexity: MODERATE
avg_duration_ms: 3600000   # 1h nominal
governance:
  tier_required: 2
  constitutional_check: false
  audit_level: STANDARD
inputs:
  - artifact_id: build-artifact-id
  - environment: staging | production
  - rollback_plan: string
outputs:
  - deployment_id: string
  - deployment_status: SUCCESS | FAILED | ROLLED_BACK
error_codes:
  - ERR_QA_GATE_FAILED
  - ERR_DEPLOYMENT_TIMEOUT
  - ERR_ROLLBACK_FAILED
subprocess_ids:
  - PROC-QA-001   # quality gate
status: ACTIVE
```

---

### PROC-INCIDENT-001 — Incident Response Process
```yaml
id: PROC-INCIDENT-001
name: Incident Response Process
version: 3.0.0
owner: delivery
classification: INCIDENT
complexity: COMPLEX
avg_duration_ms: 7200000   # 2h p50
governance:
  tier_required: 2
  constitutional_check: true
  audit_level: ENHANCED
inputs:
  - incident_signal: incident schema
  - severity: P1 | P2 | P3 | P4
outputs:
  - incident_id: string
  - resolution_status: RESOLVED | MITIGATED | ESCALATED
  - postmortem_required: boolean
error_codes:
  - ERR_INCIDENT_TIMEOUT
  - ERR_NO_OWNER_ASSIGNED
  - ERR_ESCALATION_CHAIN_EXHAUSTED
subprocess_ids:
  - PROC-INCIDENT-002  # triage
  - PROC-INCIDENT-003  # postmortem
status: ACTIVE
```

---

### PROC-GOV-005 — Constitutional Review
```yaml
id: PROC-GOV-005
name: Constitutional Review Subprocess
version: 1.0.0
owner: governance
classification: GOVERNANCE
complexity: SIMPLE
avg_duration_ms: 30000   # 30s automated
governance:
  tier_required: 0   # invoked as subprocess only
  constitutional_check: false   # is the check itself
  audit_level: ENHANCED
inputs:
  - artifact: any reviewable artifact
  - context: execution-context
outputs:
  - verdict: PASS | FAIL | CONDITIONAL
  - violations: [constitutional-principle-id]
  - conditions: [condition-string]
status: ACTIVE
```

---

### PROC-CASE-001 — Adaptive Case Workflow
```yaml
id: PROC-CASE-001
name: Adaptive Case Workflow
version: 1.1.0
owner: delivery
classification: CASE
complexity: ENTERPRISE
avg_duration_ms: null   # open-ended
governance:
  tier_required: 1
  constitutional_check: true
  audit_level: ENHANCED
inputs:
  - case_definition: case schema
  - initial_context: context map
outputs:
  - case_id: string
  - resolution: case-resolution schema
  - case_history: event-log
status: ACTIVE
```

---

## Process Relationships

```
PROC-GOV-001 (RFC Approval)
  └── PROC-GOV-005 (Constitutional Review)
  └── PROC-GOV-006 (Quorum Collection)

PROC-ENG-001 (Deployment)
  └── PROC-QA-001 (Quality Gate)

PROC-INCIDENT-001 (Incident Response)
  └── PROC-INCIDENT-002 (Triage)
  └── PROC-INCIDENT-003 (Postmortem)

PROC-CASE-001 (Adaptive Case)
  └── [dynamic subprocess selection at runtime]
```

---

## Deprecation Policy

1. Mark process `status: DEPRECATED` with `deprecated_date` and `replaced_by: PROC-XXX`
2. Deprecated processes remain executable for 90 days
3. All active instances of deprecated process must complete or migrate within 90 days
4. After 90 days, process is archived and no longer instantiable
