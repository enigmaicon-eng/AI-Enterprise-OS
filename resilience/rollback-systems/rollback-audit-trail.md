# Rollback Audit Trail
**ID:** RBK-AUD-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Engineering Org | **Updated:** 2026-05-16

---

## Purpose

Permanent, tamper-evident record of every rollback operation across the Enterprise AI OS. The rollback audit trail captures the complete lifecycle of each rollback: what triggered it, what authority authorized it, what compensations were attempted, what succeeded, what failed, and what residual state remains. It serves regulatory compliance requirements, supports post-incident investigation, and provides the governance layer with full visibility into how often and why the system reverses its own actions.

---

## Audit Record Schema

```yaml
rollback_audit_record:
  # Identity
  record_id: RBKAUD-{NNN}               # monotonically increasing, no gaps
  prev_record_hash: sha256              # hash chain for tamper evidence
  record_hash: sha256
  
  # Rollback context
  rollback_id: RBK-{NNN}
  dag_id: RDAG-{NNN} | null
  sandbox_id: SBOX-{NNN} | null
  saga_id: SAGA-{NNN} | null
  
  # Trigger
  trigger:
    source: AUTOMATIC | HUMAN_INITIATED | GOVERNANCE
    reason: string
    trigger_detail: {}                  # source-specific context (step failure, blast radius score, etc.)
    triggered_at: ISO8601
    
  # Authorization
  authorization:
    requested_by: string               # agent_id or human_id
    authority_level: T2 | T3 | T4
    authorization_method: PRE_AUTHORIZED | EXPLICIT_APPROVAL | GOVERNANCE_TRIGGER
    authorized_at: ISO8601
    
  # Scope
  scope:
    total_actions_targeted: number
    resources_affected: [string]
    systems_affected: [string]
    
  # Execution summary
  execution:
    compensations_attempted: number
    compensations_succeeded: number
    compensations_failed: number
    compensations_expired: number
    compensations_skipped: number
    duration_ms: number
    started_at: ISO8601
    completed_at: ISO8601
    
  # Completeness
  completeness:
    coverage_pct: float
    state_verification_outcome: MATCH | PARTIAL_MATCH | MISMATCH | NOT_VERIFIED
    unresolved_resources: [string]     # resources that could not be rolled back
    residual_effects: [string]         # documented residual state
    
  # Outcome
  outcome: FULL_SUCCESS | PARTIAL | FAILED | IMPOSSIBLE
  human_action_required: boolean
  human_action_description: string | null
  
  # Cross-references
  journal_entry_ids: [string]          # JRN-{NNN} entries for each compensation
  compensation_ids: [string]           # COMP-{NNN} entries executed
  snapshot_ids: [string]               # SNAP-{NNN} entries used
  
  # Governance
  constitutional_check: PASSED | NOT_REQUIRED
  regulatory_flags: [string]           # e.g., GDPR_RELEVANT, SOX_RELEVANT
  
  recorded_at: ISO8601
```

---

## Hash Chain

```
record_hash = sha256(
  prev_record_hash +
  record_id +
  rollback_id +
  trigger.source +
  trigger.reason +
  authorization.authority_level +
  outcome +
  compensations_succeeded +
  compensations_failed +
  recorded_at
)
```

Chain validates across all records from RBKAUD-0001 to current. Any break = CRITICAL security event.

---

## Audit Events Captured

Every stage of a rollback lifecycle produces an audit record:

```yaml
rollback_audit_events:
  ROLLBACK_INITIATED:
    captured: trigger, authorization, scope declaration
    
  ROLLBACK_DAG_CONSTRUCTED:
    captured: dag_id, node_count, coverage_pct, uncompensatable_nodes
    
  COMPENSATION_STARTED:
    captured: compensation_id, target_resource, reversibility_class, authority
    
  COMPENSATION_SUCCEEDED:
    captured: compensation_id, duration_ms, post_undo_verification
    
  COMPENSATION_FAILED:
    captured: compensation_id, failure_reason, escalation_level
    flag: always flag FAILED compensations to T3
    
  COMPENSATION_EXPIRED:
    captured: compensation_id, expired_at, resource_state_at_expiry
    
  HUMAN_DECISION_REQUIRED:
    captured: decision_type, options_presented, escalation_level, deadline
    
  HUMAN_DECISION_RECEIVED:
    captured: decision_made, decided_by, authority_level, timestamp
    
  ROLLBACK_COMPLETED:
    captured: outcome, coverage_pct, residual_effects, duration_ms
    
  ROLLBACK_PARTIAL:
    captured: succeeded_count, failed_count, residual_resources, follow_up_required
    flag: always escalate PARTIAL to T3
    
  ROLLBACK_FAILED:
    captured: all failed compensations, current system state, manual_action_required
    flag: always escalate FAILED to T4
    
  RESIDUAL_STATE_DOCUMENTED:
    captured: resource_id, expected_state_hash, actual_state_hash, delta_description
```

---

## Regulatory Compliance Records

For audits requiring evidence of rollback operations:

```
generate_compliance_record(rollback_id, regulation) → ComplianceRecord:

  EU_AI_ACT:
    include: authorization chain, constitutional check, human oversight evidence
    format: Art.12 audit log format
    
  SOX:
    include: financial record changes, authorization levels, outcome
    format: SOX control evidence format
    
  GDPR_ART_22:
    include: automated decision flag, human review evidence, outcome
    format: GDPR processing record format
    
  ISO_42001:
    include: AI system audit record per Annex A.6
    format: ISO 42001 audit format
```

---

## Reporting

```yaml
standard_reports:

  rollback_health_report:
    frequency: weekly
    content:
      - total rollbacks this week
      - full_success_rate (target > 95%)
      - partial_rate (alert if > 3%)
      - failed_rate (alert if > 1%)
      - mean_duration_ms
      - top 5 trigger reasons
      - resources most frequently rolled back
      - compensation TTL expiry count
    recipients: [T3 governance, engineering leads]
    
  incident_rollback_report:
    trigger: any FAILED or PARTIAL outcome
    content: full audit record + compensation failure details + follow-up actions
    recipients: [T3 immediate, T4 if FAILED]
    
  monthly_governance_digest:
    content: rollback rate trend, coverage trend, compensation library gaps, residual state accumulation
    recipients: [T4, Architecture Org, Compliance Org]
```

---

## Storage and Retention

```yaml
storage:
  file: memory/rollback-systems/rollback-audit.jsonl
  format: append-only JSONL; one record per line
  
  rotation: monthly archive
  
  retention:
    FULL_SUCCESS records: 3 years
    PARTIAL records: permanent
    FAILED records: permanent
    IMPOSSIBLE records: permanent
    constitutional_incident_related: permanent
    
  integrity:
    hash_chain: continuous; daily validation sweep
    signature: Ed25519 per record; public key in governance/signing-keys.md
    backup: mirrored to secondary storage within 5 minutes
```

---

## Query Interface

```
query_rollback_audit(filters) → [rollback_audit_record]:
  filters:
    rollback_id: string
    sandbox_id: string
    saga_id: string
    outcome: FULL_SUCCESS | PARTIAL | FAILED | IMPOSSIBLE
    date_range: {from, to}
    trigger_source: AUTOMATIC | HUMAN_INITIATED | GOVERNANCE
    resource_affected: string
    
  authorization:
    T2: own agent's rollbacks only
    T3: all rollbacks
    T4: all rollbacks + hash chain validation access
    
  export:
    supported_formats: JSONL, CSV, regulatory_format
    requires: T3 authorization
```

---

## Integration

```
Feeds into:
  governance dashboards — rollback health metrics
  compliance reporting — regulatory evidence records
  incident postmortem tooling — rollback timeline reconstruction

Receives from:
  rollback-coordinator.md — all rollback lifecycle events
  rollback-dag-engine.md — per-node compensation outcomes
  compensating-transaction-engine.md — saga-level rollback context
  execution-journal.md — cross-referenced JRN entry IDs
```

---

## Governance

**Append-only:** No record is ever modified or deleted; tampering = CRITICAL security event + chain break  
**Hash chain:** Daily integrity validation; any break triggers read-only mode + T4 immediate investigation  
**PARTIAL/FAILED escalation:** Automatic; no human must manually trigger the alert  
**Regulatory records:** Generated on demand; format-correct for EU AI Act, SOX, GDPR, ISO 42001  
**Audit of the audit:** Quarterly review of rollback audit completeness by Compliance Org
