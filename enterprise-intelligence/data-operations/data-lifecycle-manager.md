# Data Lifecycle Manager

## Role
Governs the full lifecycle of every data entity in the OS — from creation through active use, archival, and eventual deletion. Enforces retention policies, manages archival transitions, executes compliant purges, and ensures data lifecycle decisions are auditable and reversible within their retention windows.

## Lifecycle Stages

```
STAGE         DESCRIPTION                              TYPICAL DURATION
──────────────────────────────────────────────────────────────────────────
ACTIVE        Freshly written; actively queried        Days–months
AGING         Past freshness SLA; still queryable      Weeks–months
ARCHIVED      Moved to cold storage; queryable on demand  Months–years
PURGED        Deleted; deletion proof retained         (Permanent proof)
```

## Lifecycle State Machine

```
CREATED → ACTIVE → AGING → ARCHIVED → PURGED
                 ↑         |
                 └─────────┘ (RESTORE from archive if needed)

TRANSITIONS:
  ACTIVE → AGING:      age > freshness_sla_min AND no active pipeline consumers
  AGING → ARCHIVED:    age > 0.75 × retention_days AND no active pipeline consumers
  ARCHIVED → PURGED:   age >= retention_days AND deletion approved
  ARCHIVED → ACTIVE:   RESTORE request by T3+ for audit/investigation purposes
  PURGED:              terminal; no transitions out
```

## Retention Policy Catalog

```yaml
retention_policy:
  policy_id: string
  name: string
  
  retention_days: number
  
  archival:
    trigger_days: number         # days after creation to move to cold storage
    storage_tier: WARM | COLD | DEEP_ARCHIVE
    retrieval_sla_min: number    # how long to restore from this tier
  
  deletion:
    requires_approval: boolean
    approver_tier: T1..T5
    deletion_proof_retention_days: number   # retain proof even after deletion
  
  legal_hold_eligible: boolean   # can be placed on legal hold (no auto-deletion)
  
  exceptions:
    eu_ai_act_high_risk:  10yr   # hard override for HIGH_RISK AI data
    constitutional_scope: PERMANENT
    gdpr_erasure:         override_allowed = true  # GDPR art.17 overrides retention
```

## Default Retention Schedules

```
ENTITY TYPE         DEFAULT RETENTION   ARCHIVAL AT    APPROVAL REQUIRED
──────────────────────────────────────────────────────────────────────────
OPERATIONAL         90 days             30 days        T1 (automated)
ANALYTICAL          2 years             6 months       T1 (automated)
COMPLIANCE          7 years             1 year         T3
AUDIT_LOG           7 years             1 year         T3 (PERMANENT for constitutional)
KNOWLEDGE           5 years             1 year         T2
EXTERNAL/CONNECTOR  180 days            60 days        T2
HIGH_RISK_AI_INPUT  10 years            1 year         T4 + DPO
DOCUMENT            3 years             6 months       T1 (automated)
```

## Archival Protocol

```
ARCHIVAL PROCESS:
  1. Identify entities in AGING stage past archival trigger
  2. Check: no active pipeline consumers (lineage downstream check)
  3. Verify: no legal hold placed
  4. Move to cold storage; update catalog entry: stage=ARCHIVED, location=cold
  5. Retain hot-tier metadata (schema, quality score, lineage refs)
  6. Write archival record to lifecycle-events.jsonl
  7. Notify steward

RESTORE FROM ARCHIVE:
  Request: {entity_id, reason, duration_days, requestor_tier}
  Approval: T3 (or T4 for RESTRICTED+)
  SLA: WARM = 15min; COLD = 2hr; DEEP_ARCHIVE = 24hr
  After duration: auto-return to ARCHIVED (unless extended by T3)
```

## Deletion Protocol

```
DELETION PROCESS:
  1. Confirm: age >= retention_days
  2. Check: no legal hold
  3. Check: no open erasure requests (must complete erasure first if PII)
  4. Impact analysis: downstream lineage; derived entities identified
  5. Generate deletion manifest: all record_ids, classification, reason
  6. Approval:
     - OPERATIONAL/ANALYTICAL: T1 auto-approved (retention policy triggered)
     - COMPLIANCE/AUDIT: T3 manual approval
     - RESTRICTED+: T4 + DPO
  7. Execute deletion in verified batches (1000 records/batch)
  8. Verify completeness: spot-check 5% of batch post-deletion
  9. Write deletion-proof record: {entity_id, record_count, deleted_at, verified_by, hash_of_manifest}
 10. Update catalog: stage=PURGED; retain metadata entry for lineage continuity

LEGAL HOLD:
  Placed by: T4 or legal team
  Effect: auto-deletion and archival suspended for all held entities
  Release: T4 or legal team; triggers catch-up deletion review
```

## Persistence
`memory/data-operations/lifecycle-states.yaml`
`memory/data-operations/retention-policies.yaml`
`memory/data-operations/lifecycle-events.jsonl`
`memory/data-operations/legal-holds.yaml`
`memory/data-operations/deletion-proofs.jsonl`
