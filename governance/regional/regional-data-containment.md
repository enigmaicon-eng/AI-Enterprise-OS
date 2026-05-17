# Regional Data Containment
**ID:** RCG-RDC-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Security Org | **Updated:** 2026-05-16

---

## Purpose

Enforces the physical and logical containment of data within its authorized sovereign region. Regional data containment prevents regulated data from leaving its designated geographic boundary through technical controls: network-level enforcement, storage-level encryption key scoping, egress monitoring, and runtime containment validation. While jurisdiction-aware memory handles classification and legal-memory-partitioning handles logical organization, regional data containment is the enforcement layer that makes escape technically infeasible, not merely policy-prohibited.

---

## Containment Architecture

```
Regional Containment Architecture:

┌─────────────────────────────────────────────────────────────────────┐
│                        EU CONTAINMENT ZONE                          │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐                      │
│  │  EU Storage       │    │  EU Compute       │                     │
│  │  (AES-256; EU HSM)│    │  (EU agents only) │                     │
│  │  PARTITION-EU     │    │  EU regional orch │                     │
│  └──────────────────┘    └──────────────────┘                      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   EU NETWORK BOUNDARY                        │   │
│  │   Egress Monitor: DPI + data classification scanning        │   │
│  │   Authorized Egress: cross-border-governance permits only   │   │
│  │   Blocked: all raw personal data exports without permit     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                          │ (authorized egress only) │
└──────────────────────────────────────────┼──────────────────────────┘
                                           │
                              Cross-Border Gateway
                              (cross-border-governance.md)
```

---

## Containment Control Layers

### Layer 1: Network-Level Containment

```yaml
network_containment:
  per_region:
    EU_WEST:
      allowed_inbound: [EU_CENTRAL, EU_NORTH, GB_PRIMARY]  # intra-adequacy
      allowed_outbound:
        data: cross-border-governance gateway ONLY
        orchestration_metadata: GLOBAL orchestrator (no personal data)
      blocked_outbound: [CN_EAST, CN_NORTH, CN_SOUTH]  # hard network block
      
    CN_EAST:
      allowed_inbound: [CN_NORTH, CN_SOUTH]  # domestic only
      allowed_outbound:
        data: CAC-approved egress gateway ONLY
        orchestration_metadata: NONE (CN regional orchestrator is autonomous)
      blocked_outbound: [ALL non-CN regions unless CAC approval active]
      enforcement: HARD_NETWORK_PARTITION  # not software-only; hardware firewall
      
    US_EAST:
      allowed_inbound: [US_WEST, US_CENTRAL, GB_PRIMARY]
      allowed_outbound:
        data: cross-border-governance gateway
        orchestration_metadata: GLOBAL orchestrator
      
  egress_monitoring:
    protocol: DPI (deep packet inspection) + data classification scanner
    scanning_triggers: [file > 1KB, API response > 500 bytes, event payload > 200 bytes]
    classification_on_egress: true  # classify all outbound data before it leaves
    blocked_classification_tiers: [RESTRICTED, SOVEREIGN_CRITICAL]  # never egress
    alert_on_block: T3 immediate
```

### Layer 2: Storage-Level Containment

```yaml
storage_containment:
  encryption_key_scoping:
    principle: each region's data encrypted with keys that exist only in that region's HSM
    EU_KEY_SET: stored in EU HSM only; never replicated outside EU
    CN_KEY_SET: stored in CN HSM only; MLPS-compliant; SM4 for classified data
    US_KEY_SET: stored in US HSM only; FIPS 140-2 Level 3
    
  cross_region_key_access: PROHIBITED
    attempting to use EU_KEY_SET from US compute = CRITICAL security event
    
  storage_binding:
    each storage node is bound to exactly one region
    storage nodes cannot be remounted in another region
    
  backup_containment:
    backups of regional data must remain in same region (or jurisdiction-equivalent)
    EU backup → EU backup region only (not US backup)
    CN backup → CN only (no offshore backup)
```

### Layer 3: Compute-Level Containment

```yaml
compute_containment:
  agent_region_binding:
    each agent instance is bound to a deployment region at instantiation
    region binding is immutable for the lifetime of the agent instance
    
  data_access_from_compute:
    agent in EU_WEST can only access PARTITION-EU storage
    agent in CN_EAST can only access PARTITION-CN storage
    cross-region data access requires cross-border permit + gateway routing
    
  memory_in_flight:
    working memory (LLM context) of EU-region agent: encrypted in transit; EU-region compute only
    context snapshots: stored in EU region; not synced to global
    
  GPU/TPU_containment:
    model inference for regulated data: compute must occur in authorized region
    EU data → EU inference infrastructure
    CN data → CN inference infrastructure (no offshore inference)
```

### Layer 4: Runtime Containment Validation

```yaml
runtime_validation:
  continuous_checks:
    frequency: every 60 seconds per agent
    checks:
      - agent_deployment_region matches agent_data_access_region
      - no cross-region storage reads without permit in execution_context
      - no cross-region API calls without sanitized payload + permit
      - HSM key usage matches expected key_set for region
      
  validation_failure_response:
    MINOR (1 anomaly): log + alert T2
    MODERATE (3 in 10 minutes): suspend agent; alert T3
    CRITICAL (cross-region key usage, hard-partition breach): CRITICAL alert T4; quarantine immediately
```

---

## Egress Classification Scanner

All data leaving a region boundary passes through the egress scanner:

```
scan_egress(payload, source_region, destination):

  1. Classify payload content:
     classifications = classify_all_fields(payload)
     max_tier = max(classifications.sensitivity_tiers)
     
  2. Check against containment rules:
     if max_tier == SOVEREIGN_CRITICAL:
       BLOCK unconditionally
       log SOVEREIGN_CRITICAL_EGRESS_BLOCKED
       alert T4 immediately
       
     if max_tier == RESTRICTED:
       if cross_border_permit exists and covers this data:
         apply minimization + pseudonymization
         allow (flagged)
       else:
         BLOCK
         log RESTRICTED_DATA_EGRESS_BLOCKED
         alert T3
         
     if max_tier == ELEVATED:
       verify permit; allow with logging
       
     if max_tier == STANDARD:
       allow with logging
       
  3. Apply pseudonymization for cross-region transfer (if permitted):
     replace_pii_with_tokens(payload, source_region)
     register_token_map(tokens, source_region)
     
  4. Log egress event with classification tier, size, destination
  
  Return: ALLOWED | BLOCKED, sanitized_payload | null
```

---

## Data Residency Attestation

```yaml
data_residency_attestation:
  frequency: monthly
  scope: all RESTRICTED and SOVEREIGN_CRITICAL records
  
  attestation_process:
    1. For each record: verify physical storage location matches declared residency_region
    2. Verify HSM key set matches region's key set
    3. Verify no unauthorized replicas exist in other regions
    4. Verify backup storage is within jurisdiction boundary
    
  attestation_report:
    compliant_records: count
    non_compliant_records: count  ← immediate remediation required
    remediation_sla: 24 hours for SOVEREIGN_CRITICAL; 7 days for RESTRICTED
    
  evidence_retention: permanent (regulatory proof of data residency)
  signed_by: T4 + Architecture Org
```

---

## Containment Breach Response

```yaml
containment_breach_protocol:
  severity_levels:
    CRITICAL: data confirmed to have crossed boundary without authorization
      - Immediately notify T4 + Legal + Security Org
      - Initiate data recall where technically feasible
      - Notify affected jurisdiction supervisory authority within 72 hours (GDPR Art.33)
      - Document: what data, which boundary, how many records, detection time, duration
      - Post-incident: root cause analysis + remediation within 7 days
      
    HIGH: attempted breach blocked; no confirmed crossing
      - Alert T3
      - Investigate source (agent, workflow, system error)
      - Patch vector within 24 hours
      
    MEDIUM: policy violation (wrong handling) but no cross-border event
      - Alert T2
      - Remediate within 72 hours
```

---

## Integration

```
Feeds into:
  sovereign-execution-zones.md — execution zones enforce compute-level containment
  cross-region-federation-controls.md — containment boundaries define what federation must respect
  legal-memory-partitioning.md — physical containment implements partition isolation

Receives from:
  jurisdiction-aware-memory.md — jurisdiction determines containment zone
  regional-policy-enforcement.md — policies specify what containment is required
  cross-border-governance.md — authorized egress events communicated to egress scanner
```

---

## Governance

**Hard network partition for CN:** Not software-only; hardware-enforced; cannot be overridden by any software agent  
**HSM key scope:** Cross-region key access is architecturally impossible (keys never leave HSM; HSMs are region-bound)  
**Egress scanner bypass:** PROHIBITED; T5 cannot bypass; architectural invariant  
**Monthly attestation:** Signed by T4; evidence retained permanently for regulatory defensibility  
**Audit:** All containment events to `memory/regional-cognition/containment-log.jsonl` (region-resident logs)
