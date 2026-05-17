# Compliance Schema
**ID:** ACE-SCH-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Architecture Org + Governance Org | **Updated:** 2026-05-16

---

## Purpose

Defines the canonical data schemas for all compliance artifacts in the Enterprise AI OS. All components of the Adaptive Compliance Engine read and write to these schemas. Schema versioning ensures that schema changes are backward-compatible or explicitly versioned with migration paths. All compliance artifacts are typed records — no free-form compliance data is permitted in audit-admissible contexts.

---

## Core Schemas

### Compliance Record
```yaml
compliance_record:
  schema_version: "1.0"
  record_id: ACE-{NNN}                    # monotonically increasing; globally unique
  record_type: DECISION | VIOLATION | EXCEPTION | STATE_TRANSITION | CONTROL_EVENT
  timestamp: ISO8601
  agent_id: string
  workflow_id: string | null
  
  action:
    action_type: string                   # e.g., DATA_ACCESS, CROSS_BORDER_TRANSFER, MODEL_INFERENCE
    action_payload_hash: sha256           # hash of sanitized action payload (not raw payload)
    reversible: boolean
    
  jurisdiction_profile:
    primary: JUR-{XX}
    applicable: [JUR-{XX}]
    cross_border: boolean
    transfer_mechanism: string | null
    
  outcome:
    decision: PERMIT | PERMIT_WITH_CONDITIONS | REQUIRE_REVIEW | ESCALATE | AUTO_REMEDIATE | BLOCK
    conditions: [string]                  # for PERMIT_WITH_CONDITIONS
    rationale: string
    authority: T1 | T2 | T3 | T4 | T5 | CONSTITUTIONAL_QUORUM | AUTOMATIC
    
  risk:
    composite_score: float (0.00–1.00)
    tier: MINIMAL | LOW | MEDIUM | HIGH | CRITICAL
    
  integrity:
    entry_hash: sha256
    prev_record_hash: sha256
    signed_by: string | null             # Ed25519 public key for T4+ decisions
```

### Violation Record
```yaml
violation_record:
  schema_version: "1.0"
  violation_id: VIO-{NNN}
  compliance_record_id: ACE-{NNN}        # links to triggering compliance record
  detected_at: ISO8601
  
  violation_classification:
    domain: DATA_PRIVACY | AI_GOVERNANCE | FINANCIAL | SECTOR_SPECIFIC | OPERATIONAL
    severity: CRITICAL | HIGH | MEDIUM | LOW
    type: string                         # e.g., RETENTION_BREACH, CONSENT_MISSING, PROHIBITED_INFERENCE
    
  regulatory_basis:
    regulations: [string]               # e.g., ["GDPR Art.17", "EU_AI_Act Art.5"]
    policy_ids: [POL-{NNN}]
    control_ids: [CTL-{NNN}]
    
  subject:
    subject_type: AGENT | WORKFLOW | DATA_OPERATION | ENTITY
    subject_id: string
    jurisdiction: JUR-{XX}
    
  remediation:
    remediation_id: REM-{NNN} | null
    status: OPEN | IN_PROGRESS | RESOLVED | EXCEPTION_GRANTED | ESCALATED
    resolved_at: ISO8601 | null
    resolution_method: string | null
    
  notification:
    regulatory_notification_required: boolean
    notification_deadline: ISO8601 | null
    notification_sent_at: ISO8601 | null
    
  integrity:
    entry_hash: sha256
    prev_record_hash: sha256
```

### Exception Record
```yaml
exception_record:
  schema_version: "1.0"
  exception_id: EXC-{NNN}
  
  subject:
    subject_type: AGENT | WORKFLOW | ENTITY
    subject_id: string
    
  exception_scope:
    domain: string
    jurisdictions: [JUR-{XX}]
    policies_exempted: [POL-{NNN}]
    controls_deferred: [CTL-{NNN}]
    
  justification:
    business_rationale: string
    legal_assessment: string
    risk_accepted: string
    compensating_controls: [CTL-{NNN}]
    residual_risk_score: float
    
  authority:
    approved_by: string                  # T4 agent ID
    approval_timestamp: ISO8601
    board_notified: boolean              # required for CRITICAL severity exceptions
    board_notification_timestamp: ISO8601 | null
    
  lifecycle:
    effective_from: ISO8601
    expires_at: ISO8601                  # max 90 days from effective_from
    renewable: boolean
    renewals: [{approved_by, approved_at, expires_at}]
    
  integrity:
    entry_hash: sha256
```

### Control Event Record
```yaml
control_event_record:
  schema_version: "1.0"
  event_id: CTL-EVT-{NNN}
  control_id: CTL-{NNN}
  timestamp: ISO8601
  
  event_type: EXECUTED | BYPASSED | FAILED | DEGRADED | RECOVERED | COMPENSATING_ACTIVATED
  
  execution_context:
    agent_id: string
    action_type: string
    jurisdiction: JUR-{XX}
    
  outcome:
    result: PASS | FAIL | FALSE_POSITIVE | NOT_APPLICABLE
    execution_time_ms: integer
    error: string | null
    
  evidence:
    evidence_hash: sha256               # hash of evidence artifact
    evidence_location: string           # path in evidence store
    
  integrity:
    entry_hash: sha256
    prev_record_hash: sha256
```

### Evidence Package
```yaml
evidence_package:
  schema_version: "1.0"
  package_id: EVD-{NNN}
  created_at: ISO8601
  
  purpose: INTERNAL_AUDIT | EXTERNAL_AUDIT | REGULATORY_INQUIRY | CERTIFICATION | LITIGATION_HOLD
  scope:
    entity_ids: [string]
    jurisdictions: [JUR-{XX}]
    domains: [string]
    time_range: {from: ISO8601, to: ISO8601}
    
  contents:
    compliance_records: [ACE-{NNN}]
    violation_records: [VIO-{NNN}]
    exception_records: [EXC-{NNN}]
    control_event_records: [CTL-EVT-{NNN}]
    policy_versions: [POL-{NNN}]
    state_transition_records: [CSM-{NNN}]
    
  integrity:
    package_hash: sha256               # merkle root of all included records
    signed_by: string                  # T4 Ed25519 signature
    chain_of_custody: [{actor, timestamp, action}]
    
  access_log: [{accessor_id, access_timestamp, purpose}]
```

---

## Schema Versioning

```yaml
schema_versioning:
  format: semver (MAJOR.MINOR.PATCH)
  
  MAJOR: breaking change — migration required; old records use old schema permanently
  MINOR: additive change — new optional fields; backward compatible
  PATCH: clarification only — no structural change
  
  migration_policy:
    new_records: always use current schema version
    historical_records: retain original schema; read layer translates on query
    migration_scripts: required for MAJOR version bumps; tested in SYNTHETIC before production
    
  current_versions:
    compliance_record: "1.0"
    violation_record: "1.0"
    exception_record: "1.0"
    control_event_record: "1.0"
    evidence_package: "1.0"
```

---

## Retention Schedule

```yaml
retention_schedule:
  compliance_record: 7 years (financial/regulated); 3 years (operational)
  violation_record: 10 years; permanent for constitutional violations
  exception_record: 10 years (regulatory evidence of risk decision)
  control_event_record: 7 years
  evidence_package: per regulatory requirement of issuing jurisdiction; minimum 7 years
  
  legal_hold:
    trigger: litigation_hold_flag = true on any linked record
    effect: suspend normal retention deletion; retain until hold released
    authority: Legal Org (set); T4 + Legal Org (release)
```

---

## Governance

**Schema is the contract:** All compliance components are bound to these schemas; deviations block ingestion  
**No free text in regulated fields:** Rationale and justification fields are string-typed but indexed for search; length limits enforced (max 2,000 chars)  
**Integrity chain:** All records participate in hash chain; breaks in chain are T4 security events  
**Schema changes:** MAJOR changes require Architecture Org + Governance Org + T4 approval; MINOR changes require Architecture Org approval
