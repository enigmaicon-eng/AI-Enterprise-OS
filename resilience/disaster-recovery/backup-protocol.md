# Backup Protocol
**ID:** DR-CORE-002 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Runtime Org | **Updated:** 2026-05-16

---

## Purpose

Defines the automated backup schedule, storage architecture, encryption standards, integrity verification, and retention policies for all Enterprise AI OS data assets.

---

## Data Classification for Backup

| Classification | Examples | Tier | Retention |
|---------------|---------|------|-----------|
| CONSTITUTIONAL | constitution/, governance principles | CRITICAL | Permanent |
| COMPLIANCE | audit chains, approval records, attestations | CRITICAL | 7–10 years |
| OPERATIONAL | YAML state files, JSONL event logs | HIGH | 90 days hot + 7 years cold |
| INTELLIGENCE | knowledge graph, digital twin states | HIGH | 90 days hot |
| WORKFLOW | workflow definitions, templates, agent files | MEDIUM | Permanent (versioned) |
| ANALYTICS | metrics, benchmarks, calibration | LOW | 1 year |

---

## Backup Schedule

```yaml
backup_jobs:

  continuous_replication:
    scope:
      - memory/execution-store/*.jsonl
      - memory/audit-replay/audit-chain.jsonl
      - memory/governance-attestation/approval-records.jsonl
      - memory/strategic-intelligence/decisions.jsonl
      - memory/disaster-recovery/dr-events.jsonl
    mechanism: real-time streaming replication
    destination: encrypted-offsite-primary
    integrity: SHA-256 per record (already signed by Ed25519)
    lag_sla: < 30 seconds

  hourly_state_snapshot:
    scope:
      - memory/**/*.yaml (all state files)
    mechanism: incremental snapshot (changed files only)
    destination: encrypted-offsite-primary
    integrity: full manifest with SHA-256 per file
    retention: 48 hours of hourly snapshots

  daily_full_snapshot:
    schedule: "02:00 UTC"
    scope:
      - memory/ (complete)
      - All .md files (agents, workflows, templates, governance, wiki)
    mechanism: full compressed archive (.tar.gz + AES-256)
    destination: encrypted-offsite-primary + encrypted-offsite-secondary
    integrity: archive SHA-256 + manifest
    retention: 90 days
    alert_on_failure: T4 within 15 minutes

  weekly_cold_archive:
    schedule: "Sunday 03:00 UTC"
    scope: Full OS directory (excluding temp and cache)
    mechanism: full compressed archive (.tar.gz + AES-256)
    destination: WORM cold storage (geographically separate)
    integrity: archive SHA-256 + manifest + chain-of-custody record
    retention: 7 years (10 years for constitutional + compliance data)
    alert_on_failure: T5 within 1 hour
```

---

## Encryption Standards

- **Algorithm:** AES-256-GCM for backup archives
- **Key management:** Master backup key stored in hardware security module (HSM)
- **Key rotation:** Annual key rotation; all backups re-encrypted within 30 days of rotation
- **Key recovery:** Two-person integrity rule for master key access (T5 + Security Lead)

---

## Integrity Verification

```
Daily automated verification:
  1. Sample 10% of daily snapshot files
  2. Verify SHA-256 checksums against manifest
  3. Verify JSONL hash chains (audit-chain, approval-records)
  4. Alert T3+ if any verification failure

Weekly full verification:
  1. Verify 100% of weekly cold archive
  2. Test restore of random 5 files to validation environment
  3. Confirm restored files are readable and schema-valid
  4. Report to T4+ with pass/fail status

Monthly restore drill:
  1. Full restore of one subsystem (rotating monthly)
  2. Validate restored state against known-good baseline
  3. Document restoration time (must be < RTO target)
```

---

## Backup Monitoring

State tracked in `memory/disaster-recovery/backup-state.yaml`:
```yaml
backup_state:
  last_continuous_replication: ISO8601
  last_hourly_snapshot: ISO8601
  last_daily_snapshot: ISO8601
  last_weekly_archive: ISO8601
  
  integrity_checks:
    last_daily_check: ISO8601
    last_weekly_check: ISO8601
    failures_last_30d: number
    
  storage_usage:
    offsite_primary_gb: number
    offsite_secondary_gb: number
    cold_storage_gb: number
    
  alerts_open: number
```

---

## Governance

**Backup failure SLA:** T3 notified within 15 min; T4 within 1 hr if not resolved
**DR drill requirement:** Annual full restore test
**Audit:** All backup operations logged to `memory/disaster-recovery/backup-log.jsonl`
