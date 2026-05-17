# Decision Audit Trail

## Purpose
Provides a complete, tamper-proof audit trail of every decision made within the enterprise — workflow routing decisions, governance approvals, policy evaluations, and runtime decision engine outputs. This is the single source of truth for decision accountability.

---

## Audit Record Categories

| Category | Source | Retention |
|---|---|---|
| `DECISION_ENGINE` | runtime-decision-engine.md | 7 years |
| `GOVERNANCE_APPROVAL` | approval queue, orchestration-control-plane | 7 years |
| `POLICY_ROUTING` | policy-routing-engine.md | 3 years |
| `GOVERNANCE_BRANCH` | governance-aware-branching.md | 7 years |
| `CONSTITUTIONAL_EVAL` | PROC-GOV-005, governance-aware-branching | permanent |
| `OVERRIDE` | governance-aware-branching override system | permanent |
| `ESCALATION_DECISION` | escalation-case-system.md | 7 years |
| `INCIDENT_DECISION` | incident-case-management.md | 7 years |

---

## Universal Audit Record Schema

```yaml
audit_record:
  # Identity
  record_id: "AUD-uuid"
  category: [from table above]
  subcategory: string
  
  # Timing
  recorded_at: ISO-8601
  decision_at: ISO-8601   # when decision was actually made (may differ from recorded_at)
  
  # Principal
  decided_by:
    agent_id: string
    agent_type: HUMAN | AI | AUTOMATED_RULE | SYSTEM
    tier: 0–5
    org: string
  
  # Context
  workflow_instance_id: string | null
  case_id: string | null
  node_id: string | null
  correlation_id: string
  
  # Decision content
  decision:
    type: APPROVE | REJECT | ROUTE | EVALUATE | BRANCH | OVERRIDE | ESCALATE | CLOSE
    input_summary: string     # human-readable description of what was decided on
    output_summary: string    # human-readable description of the decision
    inputs_hash: "sha256:..."
    outputs_hash: "sha256:..."
    
  # Full content (for ENHANCED audit level)
  full_record:
    inputs: {}
    outputs: {}
    metadata: {}
    rationale: string
  
  # Integrity
  previous_record_hash: "sha256:..."   # chain link to previous record in sequence
  record_hash: "sha256 of entire record excluding record_hash field"
  signature: "Ed25519 signature by audit system key"
  
  # Immutability flags
  immutable: true   # records can never be modified or deleted
  correction_ref: "AUD-uuid | null"   # if this corrects a prior record (addendum pattern)
```

---

## Hash Chain Integrity

The audit trail forms an immutable hash chain:

```
Record N-1: {..., record_hash: H(N-1)}
Record N:   {..., previous_record_hash: H(N-1), record_hash: H(N)}
Record N+1: {..., previous_record_hash: H(N), record_hash: H(N+1)}
```

Verification:
```
verify_chain(records):
  for i in range(1, len(records)):
    expected_prev = H(records[i-1])
    actual_prev = records[i].previous_record_hash
    
    if expected_prev != actual_prev:
      raise ChainIntegrityViolation(at=records[i].record_id, gap=i)
  
  return CHAIN_INTACT
```

Chain verification runs:
- On demand (audit query)
- Daily automated background job
- On any tamper detection alert

---

## Correction Pattern

Records cannot be modified. Corrections use addendum records:

```yaml
correction_record:
  record_id: "AUD-uuid-correction"
  category: same as original
  decision:
    type: CORRECTION
    corrects_record: "AUD-uuid-original"
    correction_reason: string
    original_error_description: string
    corrected_values:
      field_name: new_value
  
  # Corrections require elevated approval
  approved_by:
    - agent_id: governance-lead-id
      tier: 4
  
  immutable: true
  
# Note: the original record remains unchanged; both records exist in the trail
# Queries must be aware of corrections and apply them when computing current state
```

---

## Audit Query API

```
query_audit_trail(
  filters: {
    category: string | null,
    decided_by_agent: string | null,
    workflow_instance_id: string | null,
    case_id: string | null,
    decision_type: string | null,
    date_from: ISO-8601 | null,
    date_to: ISO-8601 | null,
    tier_min: integer | null,
    correlation_id: string | null
  },
  options: {
    include_full_record: boolean = false,   # default: summary only
    include_corrections: boolean = true,
    verify_chain: boolean = false,          # expensive; use only for compliance audits
    page_size: integer = 100,
    cursor: string | null
  }
) → {records: [AuditRecord], next_cursor: string | null, chain_valid: boolean | null}
```

---

## Audit Access Controls

```yaml
access_controls:
  SUMMARY_READ:   # record_id, category, decided_by, decision.output_summary, recorded_at
    allowed_tiers: [1, 2, 3, 4, 5]
    scope: own_decisions_only | all (Tier 3+)
  
  FULL_RECORD_READ:   # includes inputs, outputs, full rationale
    allowed_tiers: [3, 4, 5]
    scope: all records in own org | all (Tier 4+)
  
  CHAIN_VERIFY:
    allowed_tiers: [4, 5]
    rationale_required: true
  
  CORRECTION_WRITE:
    allowed_tiers: [4, 5]
    requires_dual_approval: true   # two Tier-4+ approvals
  
  EXPORT:
    allowed_tiers: [4, 5]
    formats: [JSONL, CSV, PDF-signed]
    audit_export_itself: true   # exports are themselves audited
```

---

## Compliance Reports

Pre-built compliance reports generated from the audit trail:

```yaml
reports:
  GOVERNANCE_SUMMARY:
    description: All approval decisions in period by tier, outcome, and org
    frequency: weekly + on-demand
    recipients: governance-lead, executive-sponsor
  
  CONSTITUTIONAL_COMPLIANCE:
    description: All constitutional evaluations, violations, and resolutions
    frequency: monthly + on-demand
    recipients: governance-lead, board
    retention: permanent
  
  OVERRIDE_REGISTER:
    description: All governance overrides with rationale and approvers
    frequency: monthly
    recipients: governance-lead, Tier-4 principals
  
  AGENT_DECISION_PROFILE:
    description: Per-agent decision pattern analysis (volume, types, outcomes)
    frequency: monthly
    recipients: org-leads, governance-lead
  
  INCIDENT_DECISION_CHAIN:
    description: Complete decision trail for each incident, from detection to closure
    frequency: on incident close
    recipients: incident commander, governance-lead
```

---

## Retention and Archival

```yaml
retention:
  hot_storage:
    duration: 90 days
    storage: primary database
    query_latency: < 100ms
  
  warm_storage:
    duration: 2 years
    storage: indexed archive
    query_latency: < 5 seconds
  
  cold_storage:
    duration: retention period - hot - warm
    storage: compressed immutable archive
    retrieval_time: < 24 hours (batch)
    
  special:
    CONSTITUTIONAL_EVAL: permanent hot
    OVERRIDE: permanent warm
    CORRECTION: permanent (same tier as corrected record)
```
