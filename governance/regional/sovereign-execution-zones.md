# Sovereign Execution Zones
**ID:** RCG-SEZ-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Defines and enforces isolated execution environments that are physically and logically bound to a sovereign jurisdiction. A sovereign execution zone (SEZ) is the runtime environment in which agents execute when handling jurisdiction-specific data — compute, memory, network, and cryptographic resources all scoped to the zone's jurisdiction. No data from a zone's custody may escape to another zone without passing through the regional containment layer and cross-border governance gateway. The SEZ is the operationalization of data nationalism at the compute layer.

---

## Zone Definition

```yaml
sovereign_execution_zone:
  zone_id: SEZ-{XX}                     # e.g., SEZ-EU, SEZ-CN, SEZ-US
  jurisdiction: JUR-{XX}
  
  physical_infrastructure:
    compute_regions: [string]            # cloud/on-prem regions hosting this zone
    storage_regions: [string]            # must match jurisdiction.data_residency_regions
    network_boundary: string            # network segment / VPC / VNet scope
    hsm_region: string                  # HSM backing this zone's keys
    
  zone_characteristics:
    isolation_level: HARD | SOFT
    # HARD: hardware-enforced network isolation (CN, IN for critical infra)
    # SOFT: software-enforced with monitoring (EU, US, GB, SG)
    
    autonomous_operation: boolean        # can zone operate if global connectivity lost?
    # CN: true (must operate fully autonomously)
    # EU, US, GB, SG: true (regional orchestrator autonomous for regional workflows)
    
    constitutional_decisions:
      can_decide_locally: false          # NEVER — always escalate to PRIMARY quorum
      if_isolated: BLOCK_CONSTITUTIONAL_DECISIONS
      
  agent_runtime:
    max_agents: number
    agent_deployment_locked_to_zone: true
    agent_data_access: [PARTITION-{XX}]  # only this zone's partition(s)
    inference_infrastructure: zone-local  # model inference within zone boundary
    
  zone_keys:
    encryption_key_set: string
    signing_key_set: string
    key_rotation_days: 90
    
  compliance_profile: [string]           # regulations this zone is configured for
```

---

## Zone Catalog

```yaml
zone_catalog:
  SEZ-EU:
    zone_id: SEZ-EU
    jurisdiction: JUR-EU
    physical_infrastructure:
      compute_regions: [eu-west-1, eu-central-1, eu-north-1]
      storage_regions: [eu-west-1, eu-central-1, eu-north-1]
      hsm_region: eu-west-1
    isolation_level: SOFT
    autonomous_operation: true
    compliance_profile: [GDPR, EU_AI_ACT, NIS2, DORA]
    
  SEZ-CN:
    zone_id: SEZ-CN
    jurisdiction: JUR-CN
    physical_infrastructure:
      compute_regions: [cn-east-1, cn-north-1]
      storage_regions: [cn-east-1, cn-north-1]
      network_boundary: dedicated_vnet_cn_only
      hsm_region: cn-east-1
    isolation_level: HARD
    autonomous_operation: true
    compliance_profile: [PIPL, DSL, CSL, MLPS]
    special_requirements:
      icp_license: required
      mlps_level: 3_minimum
      sm4_encryption: required_for_classified
      
  SEZ-US:
    zone_id: SEZ-US
    jurisdiction: JUR-US
    physical_infrastructure:
      compute_regions: [us-east-1, us-west-2, us-central-1]
      storage_regions: [us-east-1, us-west-2, us-central-1]
      hsm_region: us-east-1
    isolation_level: SOFT
    autonomous_operation: true
    compliance_profile: [CCPA_CPRA, SOX, HIPAA, GLBA, FTC_ACT]
    
  SEZ-IN:
    zone_id: SEZ-IN
    jurisdiction: JUR-IN
    physical_infrastructure:
      compute_regions: [in-west-1, in-south-1]
      storage_regions: [in-west-1, in-south-1]
      hsm_region: in-west-1
    isolation_level: SOFT
    autonomous_operation: true
    compliance_profile: [DPDP_ACT_2023, IT_ACT, RBI_GUIDELINES]
    
  SEZ-GB:
    zone_id: SEZ-GB
    jurisdiction: JUR-GB
    physical_infrastructure:
      compute_regions: [gb-south-1]
      storage_regions: [gb-south-1]
      hsm_region: gb-south-1
    isolation_level: SOFT
    autonomous_operation: true
    cross_zone_with_adequacy: [SEZ-EU]   # GB↔EU via adequacy
    compliance_profile: [UK_GDPR, DATA_PROTECTION_ACT_2018]
    
  SEZ-SG:
    zone_id: SEZ-SG
    jurisdiction: JUR-SG
    physical_infrastructure:
      compute_regions: [sg-primary-1]
      storage_regions: [sg-primary-1]
      hsm_region: sg-primary-1
    isolation_level: SOFT
    autonomous_operation: true
    compliance_profile: [PDPA, MAS_GUIDELINES]
```

---

## Zone Provisioning

```
provision_agent_in_zone(agent_definition, target_zone_id):

  zone = load_zone(target_zone_id)
  
  1. Validate agent compliance:
     verify agent_definition.compliance_requirements ⊆ zone.compliance_profile
     if agent requires compliance profile not covered by zone: REJECT
     
  2. Provision compute resources:
     allocate compute from zone.compute_regions only
     bind agent_runtime to zone.network_boundary
     mount zone storage (PARTITION-{zone.jurisdiction} only)
     
  3. Configure zone-scoped cryptography:
     agent.encryption_key = zone.zone_keys.encryption_key_set
     agent.signing_key = zone.zone_keys.signing_key_set
     
  4. Apply zone policy constraints:
     agent.active_policies = policy_catalog.get_for_zone(target_zone_id)
     agent.cogniton_boundary = regional_cognition_boundaries[zone.jurisdiction]
     agent.data_access = [PARTITION-{zone.jurisdiction}]
     
  5. Bind zone identity:
     agent.deployment_zone = target_zone_id  # immutable for this instance
     agent.deployment_jurisdiction = zone.jurisdiction  # immutable
     
  6. Register in zone agent registry
  
  Return: agent_instance_id, zone_binding
```

---

## Zone Isolation Enforcement

```
enforce_zone_isolation(agent_instance_id, operation):

  binding = load_zone_binding(agent_instance_id)
  zone = load_zone(binding.zone_id)
  
  CHECK 1 — Data source in zone:
    if operation.data_source.region not in zone.storage_regions:
      if cross_border_permit covers this: ALLOW with logging
      else: BLOCK; log CROSS_ZONE_DATA_ACCESS_BLOCKED
      
  CHECK 2 — Network destination in zone:
    if operation.network_destination not in zone.network_boundary:
      route through egress scanner + cross-border gateway
      BLOCK if no permit
      
  CHECK 3 — Key usage:
    if operation.encryption_key not in zone.zone_keys:
      BLOCK immediately; log KEY_SCOPE_VIOLATION; alert T4
      
  CHECK 4 — Compute region:
    if operation.compute_target not in zone.compute_regions:
      BLOCK; log COMPUTE_SCOPE_VIOLATION
      
  Return: ISOLATED (all checks pass) | VIOLATION (any check fails)
```

---

## Zone Autonomous Operation

Each zone can operate autonomously when disconnected from the global network:

```yaml
autonomous_operation_protocol:
  trigger: global connectivity lost for > 60 seconds
  
  SEZ-CN (always autonomous):
    regional_orchestrator: ACTIVE (handles all CN workflows)
    constitutional_decisions: BLOCKED (cannot reach PRIMARY quorum)
    new_cross_border: BLOCKED
    existing_workflows: continue using cached policies and agent registry
    sync_on_reconnect: event-sourced catchup from GLOBAL orchestrator
    
  SEZ-EU / SEZ-US / SEZ-GB / SEZ-SG / SEZ-IN:
    regional_orchestrator: ACTIVE (handles all regional workflows)
    constitutional_decisions: BLOCKED (safety over availability)
    new_cross_border: BLOCKED (cannot verify mechanisms without global connectivity)
    existing_cross_border_permits: continue until TTL (do not renew)
    sync_on_reconnect: delta sync with GLOBAL orchestrator
    
  reconnection_protocol:
    1. Validate event log integrity (hash chain check)
    2. Sync missed events from GLOBAL (ordered, deduplicated)
    3. Re-validate cross-border permits (some may have expired)
    4. Re-enable constitutional decisions
    5. Log ZONE_RECONNECTED with duration of isolation
```

---

## Zone Health Monitoring

```yaml
zone_health:
  monitored_metrics:
    - compute_utilization (alert at 80%)
    - storage_utilization (alert at 75%)
    - agent_count_vs_capacity
    - isolation_check_pass_rate (target 100%; alert if < 99.9%)
    - cross_zone_violations_blocked (count per hour; alert if > 0)
    - hsm_key_operations_per_second (alert on spike = possible key abuse)
    - zone_connectivity_to_global (detect isolation mode activation)
    
  zone_health_score:
    formula: weighted composite of above metrics
    threshold: HEALTHY > 0.85 | DEGRADED 0.70–0.85 | CRITICAL < 0.70
    
  critical_response:
    CRITICAL score → T3 immediate + capacity remediation
    isolation_check_fail → T4 immediate + security investigation
```

---

## Integration

```
Feeds into:
  jurisdiction-aware-orchestration.md — zones are the physical deployment targets for regional orchestrators
  regional-data-containment.md — zones implement compute-level containment
  restricted-cognition-domains.md — zone-level restrictions enforce cognitive boundaries
  sovereignty-aware-topology.md — zone topology is the foundation of sovereign topology

Receives from:
  jurisdiction-aware-memory.md — zone assignment from jurisdiction classification
  regional-policy-enforcement.md — compliance policies applied at zone provisioning
  cross-border-governance.md — cross-zone permits from the cross-border gateway
  regional-cognition-boundaries.md — cognitive boundary constraints loaded at zone provisioning
```

---

## Governance

**Zone binding immutability:** Agent zone binding set at provisioning and immutable for that instance lifetime; re-deploy to change zone  
**CN hard isolation:** HARD isolation cannot be downgraded to SOFT without T5 + board approval; architectural invariant  
**Constitutional decisions:** Never made in isolated zone regardless of zone capability; always require PRIMARY quorum  
**Key scope:** Zone HSM keys never leave HSM; cross-zone key access = immediate CRITICAL event and full forensic investigation  
**Audit:** All zone provisioning, isolation enforcement, and autonomous operation events to `memory/regional-cognition/zone-audit.jsonl` (zone-resident)
