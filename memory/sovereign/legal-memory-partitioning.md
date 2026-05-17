# Legal Memory Partitioning
**ID:** SVM-LMP-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Legal Org | **Updated:** 2026-05-16

---

## Purpose

Organizes the Enterprise AI OS memory layer into legally isolated partitions that enforce data residency, regulate cross-partition access, and ensure that each partition complies with the legal regime of its governing jurisdiction. Legal memory partitioning is the physical and logical implementation of jurisdiction-aware memory: it translates jurisdiction metadata into storage topology, access controls, encryption key scoping, and retention enforcement. No cross-partition memory operation may occur without passing through the partition gateway.

---

## Partition Architecture

```
GLOBAL MEMORY LAYER (orchestration only — no personal data)
│
├─── PARTITION-EU  ─────────────────────────────────────────────
│     Physical: EU-WEST-1 + EU-CENTRAL-1 + EU-NORTH-1
│     Encryption: EU_KEY_SET (GDPR-scoped HSM)
│     Regulation: GDPR + EU AI Act + NIS2
│     Access: EU-authorized agents only
│     Isolation: Network-level + encryption-level + logical ACL
│
├─── PARTITION-US  ─────────────────────────────────────────────
│     Physical: US-EAST-1 + US-WEST-2 + US-CENTRAL-1
│     Encryption: US_KEY_SET (SOX/HIPAA-capable HSM)
│     Regulation: CCPA/CPRA + SOX + HIPAA (where applicable)
│     Access: US-authorized agents only
│     Isolation: Network-level + encryption-level + logical ACL
│
├─── PARTITION-CN  ─────────────────────────────────────────────
│     Physical: CN-EAST-1 + CN-NORTH-1 (ICP licensed)
│     Encryption: CN_KEY_SET (MLPS-compliant HSM; SM4 for classified)
│     Regulation: PIPL + DSL + CSL + MLPS
│     Access: CN-authorized agents only; CAC-compliant audit
│     Isolation: Network-level + encryption-level + logical ACL + hard network partition
│
├─── PARTITION-IN  ─────────────────────────────────────────────
│     Physical: IN-WEST-1 + IN-SOUTH-1
│     Encryption: IN_KEY_SET
│     Regulation: DPDP Act 2023 + RBI Guidelines
│     Access: IN-authorized agents only
│
├─── PARTITION-GB  ─────────────────────────────────────────────
│     Physical: GB-PRIMARY-1
│     Encryption: GB_KEY_SET (UK GDPR-scoped)
│     Regulation: UK GDPR + Data Protection Act 2018
│     Access: GB-authorized agents; EU cross-access via adequacy channel
│
├─── PARTITION-SG  ─────────────────────────────────────────────
│     Physical: SG-PRIMARY-1
│     Encryption: SG_KEY_SET
│     Regulation: PDPA + MAS Guidelines
│     Access: SG-authorized agents only
│
└─── PARTITION-GLOBAL ──────────────────────────────────────────
      Physical: Distributed (orchestration nodes only)
      Content: Non-personal operational metadata only
      Encryption: GLOBAL_KEY_SET
      Regulation: Enterprise constitutional principles only
      Access: All authorized agents (read-only for operational state)
```

---

## Partition Schema

```yaml
memory_partition:
  partition_id: PART-{XX}
  jurisdiction: JUR-{XX}
  
  physical_regions: [string]            # must match jurisdiction.data_residency_regions
  
  encryption:
    key_set_id: string                  # jurisdiction-scoped HSM key set
    algorithm: AES-256-GCM             # default; SM4 for CN classified data
    key_rotation_days: 90
    hsm_backed: true                    # hardware security module required
    
  content_classes_allowed: [string]     # which content types may reside here
  content_classes_prohibited: [string]  # explicit prohibitions
  
  access_policy:
    authorized_agent_regions: [string]
    authorized_roles: [string]
    cross_partition_read: boolean
    cross_partition_write: boolean
    gateway_required_for_cross_partition: true  # always
    
  retention_policy:
    ceiling_days: number                # from jurisdiction registry
    auto_purge: true                    # enforced; no manual extension
    
  compliance_profile: [string]          # regulations this partition is configured for
  
  audit:
    access_log: memory/sovereign-memory/partitions/{partition_id}/access-log.jsonl
    cross_partition_log: memory/sovereign-memory/partitions/{partition_id}/cross-partition-log.jsonl
    retention_action_log: memory/sovereign-memory/partitions/{partition_id}/retention-log.jsonl
```

---

## Partition Gateway

All cross-partition memory operations route through the partition gateway:

```
partition_gateway_request(source_partition, target_partition, operation, record_id, requester):

  1. Check if cross-partition operation is permitted:
     policy = load_cross_partition_policy(source_partition.jurisdiction, target_partition.jurisdiction)
     if policy == PROHIBITED: BLOCK immediately; log CROSS_PARTITION_BLOCKED
     
  2. Identify transfer mechanism:
     mechanism = policy.required_transfer_mechanism
     
  3. Validate transfer mechanism is active:
     if mechanism == ADEQUACY_DECISION: verify adequacy still in force (daily check)
     if mechanism == SCCs: verify SCCs are signed and current
     if mechanism == CAC_APPROVAL: verify CAC approval reference is valid
     
  4. Authorization check:
     required_authority = policy.minimum_authority
     if requester.authority < required_authority: DENIED
     
  5. Data minimization:
     apply minimization_rules(record, target_partition.jurisdiction)
     strip fields prohibited in target jurisdiction before transfer
     
  6. Re-encrypt for target partition:
     decrypt with source_partition.key_set
     encrypt with target_partition.key_set
     
  7. Write to target partition (not copied — original remains in source):
     target_record = write_to_partition(target_partition, re_encrypted_content)
     target_record.jurisdiction_metadata.primary_jurisdiction = source_partition.jurisdiction
     target_record.jurisdiction_metadata.transfer_mechanism = mechanism
     
  8. Log cross-partition operation in both source and target audit logs
  
  9. Return: target_record_id, transfer_record
```

---

## Data Minimization Rules

Before any cross-partition transfer, data minimization is applied per target jurisdiction:

```yaml
minimization_rules:
  EU_target:
    strip_if_no_purpose: true            # GDPR Art.5 — purpose limitation
    pseudonymize_identifiers: true       # GDPR Art.25 — data minimization
    strip_special_categories_without_explicit_consent: true
    
  CN_target:
    strip_non_essential_personal_data: true
    strip_data_above_import_quota: true  # volume thresholds per CAC
    retain_only_necessary_for_stated_purpose: true
    
  US_target:
    strip_health_data_without_hipaa_cover: true
    strip_children_data: true            # COPPA absolute
    add_opt_out_metadata: true           # CCPA
    
  all_targets:
    strip_field: [internal_agent_id, system_metadata, constitutional_annotations]
    reason: reduces information asymmetry across jurisdictions
```

---

## Retention Enforcement

```
retention_enforcer (runs daily at 02:00 UTC per partition timezone):

  for each partition in partition_registry:
    for each record where expires_at <= now():
      
      1. Check: is this record subject to legal hold?
         if YES: skip deletion; log LEGAL_HOLD_PRESERVING_EXPIRED_RECORD
         
      2. Check: is right_to_erasure_applicable?
         if NO erasure request: proceed with standard deletion
         
      3. Securely delete:
         overwrite content with zeros (3-pass for RESTRICTED+)
         revoke encryption key reference (key_set_id → key_set_PURGED)
         mark record: status = PURGED; content_hash = sha256(PURGED)
         
      4. Log: RECORD_PURGED to retention-action-log
      5. Log: PURGE_CONFIRMATION to jurisdiction audit trail
      
  generate: daily retention report per partition
  alert if: any record overdue for deletion > 24 hours → T3 immediate
```

---

## Legal Hold Management

```yaml
legal_hold:
  hold_id: LH-{NNN}
  partition_id: PART-{XX}
  record_ids: [MEM-{NNN}]            # specific records, or
  record_pattern: {}                  # pattern matching (all records of a type/date range)
  
  legal_authority: string             # court order reference, regulatory inquiry ref
  issued_by: string                   # legal team member
  issued_at: ISO8601
  expires_at: ISO8601 | null         # null = indefinite until manually lifted
  
  scope: FREEZE_DELETION_ONLY        # records still readable; just cannot be purged
  
  authority_to_lift: T4 + Legal Org
  
  audit: all hold events logged; cannot be silently removed
```

---

## Partition Health

```yaml
partition_health_metrics:
  monitored_per_partition:
    - storage_utilization_pct (alert at 80%)
    - records_approaching_expiry_24h (daily report)
    - cross_partition_access_rate (anomaly detection)
    - failed_cross_partition_attempts (alert if > 0)
    - key_rotation_overdue (alert if > 100 days since last rotation)
    - adequacy_decision_status (daily verification for EU↔GB transfers)
    
  health_score: composite 0–1 per partition
  critical_threshold: < 0.70 → T3 immediate
```

---

## Integration

```
Feeds into:
  sovereignty-aware-retrieval.md — queries routed to correct partition
  cross-region-federation-controls.md — federation respects partition boundaries
  jurisdiction-aware-memory.md — partition selection from jurisdiction metadata

Receives from:
  jurisdiction-aware-memory.md — write requests carry partition selection
  regulatory-conflict-arbitration.md — conflict resolutions may update partition policies
  regional-policy-enforcement.md — policy changes pushed to partition configs
```

---

## Governance

**Hard partition isolation:** CN partition has additional hard network partition; no software-only bypass  
**Key scoping:** Each partition's encryption keys are scoped to that partition's HSM; cross-partition key access = CRITICAL security event  
**Adequacy monitoring:** Daily verification of adequacy decisions (EU-GB, EU-US DPF); auto-suspend cross-partition transfers if adequacy lapses  
**Legal hold authority:** T4 + Legal Org required to place or lift legal holds; no agent may place holds autonomously  
**Audit:** All partition operations to jurisdiction-scoped audit logs; logs themselves are partition-resident
