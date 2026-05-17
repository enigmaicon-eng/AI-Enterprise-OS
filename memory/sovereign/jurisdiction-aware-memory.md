# Jurisdiction-Aware Memory
**ID:** SVM-JAM-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Legal Org | **Updated:** 2026-05-16

---

## Purpose

Every memory record stored in the Enterprise AI OS carries explicit jurisdiction metadata that determines where it may be stored, who may access it, how long it may be retained, and under what legal regime it is governed. Jurisdiction-aware memory prevents cross-border data leakage by attaching legally binding residency constraints to each record at write time and enforcing those constraints at every subsequent read, transfer, and deletion operation.

**Core guarantee:** A memory record created under a given jurisdiction's legal regime cannot be read, copied, or transferred outside that jurisdiction's authorized boundary without explicit legal authorization.

---

## Jurisdiction Registry

```yaml
jurisdiction_registry:
  jurisdictions:
    JUR-EU:
      name: European Union
      primary_regulation: GDPR
      secondary_regulations: [EU_AI_ACT, NIS2, DORA]
      data_residency_regions: [EU_WEST, EU_CENTRAL, EU_NORTH]
      cross_border_transfer_mechanisms: [ADEQUACY_DECISION, SCCs, BCRs]
      retention_ceiling_days: 1825          # 5 years max for most categories
      right_to_erasure: true
      ai_decision_transparency_required: true
      
    JUR-US:
      name: United States
      primary_regulation: CCPA_CPRA          # + sector-specific (HIPAA, SOX, GLBA)
      secondary_regulations: [CCPA, CPRA, SOX, HIPAA, FTC_ACT]
      data_residency_regions: [US_EAST, US_WEST, US_CENTRAL]
      cross_border_transfer_mechanisms: [CONTRACTUAL, CONSENT, BUSINESS_NECESSITY]
      retention_ceiling_days: 2555          # 7 years for financial (SOX)
      right_to_erasure: true               # CCPA/CPRA
      ai_decision_transparency_required: false  # currently sector-specific only
      
    JUR-CN:
      name: China
      primary_regulation: PIPL
      secondary_regulations: [DSL, CSL, MLPS]
      data_residency_regions: [CN_EAST, CN_NORTH, CN_SOUTH]
      cross_border_transfer_mechanisms: [CAC_APPROVAL, STANDARD_CONTRACT, CERTIFICATION]
      retention_ceiling_days: 1095          # 3 years standard; shorter for sensitive
      right_to_erasure: true
      ai_decision_transparency_required: true
      critical_information_infrastructure: true  # CSL applies
      
    JUR-IN:
      name: India
      primary_regulation: DPDP_ACT_2023
      secondary_regulations: [IT_ACT, RBI_GUIDELINES]
      data_residency_regions: [IN_WEST, IN_SOUTH]
      cross_border_transfer_mechanisms: [APPROVED_COUNTRY, CONTRACTUAL]
      retention_ceiling_days: 1095
      right_to_erasure: true
      
    JUR-GB:
      name: United Kingdom
      primary_regulation: UK_GDPR
      secondary_regulations: [DATA_PROTECTION_ACT_2018, ICO_GUIDANCE]
      data_residency_regions: [GB_PRIMARY]
      cross_border_transfer_mechanisms: [ADEQUACY_REGULATION, IDTAs, BCRs]
      retention_ceiling_days: 1825
      right_to_erasure: true
      
    JUR-SG:
      name: Singapore
      primary_regulation: PDPA
      secondary_regulations: [MAS_GUIDELINES, AI_GOVERNANCE_FRAMEWORK]
      data_residency_regions: [SG_PRIMARY]
      cross_border_transfer_mechanisms: [CONTRACTUAL_OBLIGATION, ADEQUACY]
      retention_ceiling_days: 1825
      right_to_erasure: false              # notification required; erasure not absolute
```

---

## Memory Record Schema

Every memory record in the OS carries jurisdiction metadata:

```yaml
memory_record:
  record_id: MEM-{NNN}
  
  # Content
  content_type: KNOWLEDGE | DECISION | AGENT_STATE | WORKFLOW_STATE | CUSTOMER_DATA | FINANCIAL | AUDIT
  content_hash: sha256
  content_encrypted: AES-256              # encrypted at rest; key scoped to jurisdiction
  
  # Jurisdiction classification (set at write time; immutable after write)
  jurisdiction_metadata:
    primary_jurisdiction: JUR-{XX}        # the legal regime governing this record
    data_residency_region: string         # physical storage region (must be in jurisdiction's authorized regions)
    secondary_jurisdictions: [JUR-{XX}]  # other jurisdictions with legitimate interest
    
    data_subject_jurisdiction: JUR-{XX} | null  # jurisdiction of the data subject (if personal data)
    is_personal_data: boolean
    personal_data_categories: [IDENTITY, CONTACT, BEHAVIORAL, FINANCIAL, HEALTH, BIOMETRIC]
    
    sensitivity_tier: STANDARD | ELEVATED | RESTRICTED | SOVEREIGN_CRITICAL
    
    legal_basis:                          # basis for processing (required for personal data)
      primary: CONSENT | CONTRACT | LEGAL_OBLIGATION | VITAL_INTERESTS | PUBLIC_TASK | LEGITIMATE_INTERESTS
      documented_at: ISO8601
      
    cross_border_authorized: boolean
    cross_border_mechanisms: [string]     # which transfer mechanisms are authorized
    
  # Retention
  retention:
    created_at: ISO8601
    retention_policy_id: string
    expires_at: ISO8601                   # must not exceed jurisdiction.retention_ceiling_days
    deletion_scheduled_at: ISO8601
    right_to_erasure_applicable: boolean
    
  # Access control
  access_control:
    authorized_jurisdictions: [JUR-{XX}] # which jurisdictions may read this record
    authorized_regions: [string]          # physical regions that may access
    authorized_roles: [string]
    sovereignty_clearance_required: boolean
    
  # Audit
  created_by: string
  created_in_region: string
  last_accessed_at: ISO8601
  access_log_ref: string                  # pointer to jurisdiction-scoped access log
```

---

## Write Protocol

```
write_memory_record(content, write_context) → record_id:

  1. Classify jurisdiction:
     primary_jurisdiction = classify_jurisdiction(
       data_subject_location = write_context.data_subject_location,
       operator_location = write_context.operator_location,
       content_origin = write_context.content_origin
     )
     
  2. Validate storage region:
     authorized_regions = jurisdiction_registry[primary_jurisdiction].data_residency_regions
     if write_context.target_region not in authorized_regions:
       BLOCK; log RESIDENCY_VIOLATION_PREVENTED
       escalate: T3
       
  3. Classify sensitivity:
     sensitivity_tier = classify_sensitivity(content, primary_jurisdiction)
     
  4. Determine retention:
     retention_policy = lookup_retention_policy(content_type, primary_jurisdiction)
     expires_at = min(
       now() + retention_policy.max_days,
       now() + jurisdiction_registry[primary_jurisdiction].retention_ceiling_days
     )
     
  5. Select encryption key:
     key = jurisdiction_key_vault[primary_jurisdiction].current_key
     
  6. Encrypt and write to region-scoped storage:
     encrypted_content = AES_256_encrypt(content, key)
     write_to_region(write_context.target_region, encrypted_content)
     
  7. Assign jurisdiction metadata (immutable after write)
  
  8. Register in jurisdiction-scoped memory index
  
  9. Return record_id
```

---

## Jurisdiction Classification Rules

```
classify_jurisdiction(data_subject_location, operator_location, content_origin):

  # Data subject location takes precedence for personal data
  if content contains personal data:
    if data_subject_location in EU_MEMBER_STATES: return JUR-EU
    if data_subject_location == CN: return JUR-CN
    if data_subject_location == IN: return JUR-IN
    if data_subject_location == GB: return JUR-GB
    if data_subject_location == SG: return JUR-SG
    if data_subject_location in US_STATES: return JUR-US
    
  # For non-personal data: operator location governs
  if operator_location is defined:
    return map_location_to_jurisdiction(operator_location)
    
  # Default: most restrictive jurisdiction of all parties
  return most_restrictive([data_subject_location, operator_location, content_origin])
```

---

## Immutability of Jurisdiction Metadata

```yaml
immutability_rules:
  jurisdiction_metadata_fields:
    primary_jurisdiction: IMMUTABLE       # set at write; never changed
    data_residency_region: IMMUTABLE
    is_personal_data: IMMUTABLE
    personal_data_categories: IMMUTABLE
    
  mutable_fields:
    expires_at: MUTABLE (only shorter; never extended beyond ceiling)
    cross_border_authorized: MUTABLE (T4 + legal counsel required)
    access_control.authorized_roles: MUTABLE (T3)
    
  jurisdiction_reclassification:
    authority: T5 + external legal counsel opinion + audit record
    never_automatic: true
```

---

## Integration

```
Feeds into:
  legal-memory-partitioning.md — partitions storage by jurisdiction
  sovereignty-aware-retrieval.md — enforces jurisdiction at query time
  regional-cognition-boundaries.md — cognitive access boundaries derived from jurisdiction metadata
  cross-region-federation-controls.md — federation respects jurisdiction constraints

Receives from:
  jurisdiction-aware-orchestration.md — execution context provides jurisdiction signal
  regional-policy-enforcement.md — policy rules applied at write time
  regulatory-conflict-arbitration.md — conflict resolution feeds cross_border_mechanisms
```

---

## Governance

**Jurisdiction metadata immutability:** Primary jurisdiction and residency region are write-once; any attempted modification = CRITICAL security event  
**Residency violation prevention:** Block and alert before any write to unauthorized region; never write-then-cleanup  
**Retention ceiling enforcement:** expires_at never exceeds jurisdiction ceiling; automatic purge on expiry  
**Audit:** All jurisdiction classification decisions and cross-border access events logged to `memory/sovereign-memory/jurisdiction-audit.jsonl` (jurisdiction-scoped, append-only)
