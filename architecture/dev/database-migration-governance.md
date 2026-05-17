# Database Migration Governance
**ID:** DEV-DBM-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Engineering Org + Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Governs all migrations to append-only JSONL files, YAML state stores, and any future structured storage in the Enterprise AI OS. Schema changes to files that hold audit chains, approval records, or execution ledgers are among the highest-risk operations in the OS — a bad migration can corrupt immutable history or break the hash chain. This governance layer prevents that.

---

## Migration Risk Classification

| File Type | Risk Level | Rationale |
|-----------|-----------|-----------|
| audit-chain.jsonl, approval-records.jsonl | CRITICAL | Hash chain — any schema change breaks chain verification |
| execution-ledger.jsonl | CRITICAL | Append-only audit; schema changes require full re-validation |
| Constitutional documents (constitution/*.md) | CRITICAL | Any change requires T5 + quorum approval |
| Governance YAML state (*.yaml in memory/) | HIGH | Drives live behavior; invalid state = broken workflows |
| Knowledge base entries (knowledge-base/*.md) | MEDIUM | Readable; invalid schema detected by reference validator |
| Configuration files | MEDIUM | Affects behavior; CI/CD catches most issues |
| Archive and cold storage | LOW | Historical; not read in production path |

---

## Migration Protocol

### CRITICAL Files

```
Step 1: Pre-migration validation (before any change)
  - Verify current file integrity: hash chain intact, all records valid against current schema
  - Create verified snapshot: backup with SHA-256 attestation
  - Ensure DR backup current (< 1 hour old)
  
Step 2: Migration design review
  - Propose schema change with migration script
  - Reference validator dry run: what references will break?
  - Hash chain impact assessment: does this break chain verification?
  - T4 approval required; T3 Architecture sign-off
  
Step 3: Staging migration (required; no skipping)
  - Apply migration to staging copy of production data
  - Verify all records valid against new schema (100% validation, not sample)
  - Verify hash chain integrity post-migration (if applicable)
  - Verify all dependent systems can read migrated data
  - 48-hour staging soak period
  
Step 4: Production migration
  - Scheduled maintenance window (low-traffic period)
  - Pause all writes to affected files during migration
  - Apply migration script
  - Verify integrity immediately post-migration
  - Resume writes
  - Monitor for 1 hour: zero errors expected
  
Step 5: Rollback (if needed)
  - Restore from pre-migration snapshot
  - Verify snapshot integrity
  - Resume normal operations
  - Root cause before re-attempting
```

### HIGH Files (YAML state stores)

```
- Schema change proposal with backward-compatibility assessment
- T3 Architecture approval
- Staging validation (4-hour soak)
- Canary deploy: apply to 10% of state; verify; apply to all
- Rollback plan defined before execution
```

### MEDIUM and LOW Files

```
- CI/CD schema validation gate catches breaking changes
- Standard deployment pipeline sufficient
- No additional governance required beyond CI/CD gates
```

---

## Hash Chain Preservation

Migrations on hash-chained files require special handling:

```
OPTION A: Add-only schema change (new optional fields)
  - Safe: new fields default to null in existing records
  - Hash chain: not broken (existing record hashes unaffected)
  - Preferred approach
  
OPTION B: Rename or restructure required fields
  - Breaks hash chain verification for pre-migration records
  - Requires: chain-break migration record:
    {"type": "SCHEMA_MIGRATION", "migration_id": "...", "prev_schema": "v1", 
     "new_schema": "v2", "prev_segment_last_hash": "...", "migration_at": "..."}
  - Post-migration: hash chain verifier must handle both schema versions
  - T4 approval + DPO review (audit trail implications)
  
OPTION C: File replacement (new schema, new file)
  - Create new file with new schema
  - Archive old file (permanent; never delete)
  - New writes go to new file
  - Queries span both files (handled by segment manager)
  - T5 approval required (permanent architectural change)
```

---

## Migration Registry

```yaml
migration_record:
  migration_id: MIG-{NNN}
  target_file: string
  risk_level: CRITICAL | HIGH | MEDIUM | LOW
  
  change_description: string
  schema_version_from: string
  schema_version_to: string
  
  timeline:
    proposed_at: ISO8601
    approved_at: ISO8601
    staging_completed_at: ISO8601
    production_applied_at: ISO8601
    
  approvals:
    architecture_org: string
    t3_or_t4: string
    
  validation:
    records_migrated: number
    validation_errors: number            # target: 0
    hash_chain_intact: boolean
    staging_soak_hours: number
    
  status: PROPOSED | APPROVED | STAGED | APPLIED | ROLLED_BACK
  rollback_applied: boolean
  notes: string
```

All migrations logged to `memory/dev/migration-registry.jsonl` (append-only).

---

## Governance

**CRITICAL migration approval:** T4 required; T5 for constitutional documents
**HIGH migration approval:** T3 Architecture + Engineering
**Migration window:** CRITICAL: scheduled maintenance only; HIGH: low-traffic window
**Rollback authority:** T3 can initiate rollback; automated if integrity check fails post-migration
**Audit:** All migrations permanently logged; never delete migration history
