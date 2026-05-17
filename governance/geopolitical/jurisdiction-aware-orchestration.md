# Jurisdiction-Aware Orchestration
**ID:** GPG-JAO-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Routes and coordinates multi-agent workflows across the sovereign enterprise such that every execution step is assigned to an agent operating within the jurisdiction appropriate for the data and operations involved. The jurisdiction-aware orchestrator ensures that work requiring EU-resident data is executed by EU-region agents, that cross-border orchestration signals carry no unauthorized payload, and that the full execution chain for any workflow respects the most restrictive jurisdiction applicable to that workflow's data.

---

## Jurisdiction-Aware Routing Model

```
GLOBAL ORCHESTRATOR (PARTITION-GLOBAL)
│   ← orchestration metadata only; no personal data in orchestration layer
│
├── EU REGIONAL ORCHESTRATOR (EU_WEST region)
│     Agents: all EU-jurisdictioned agents
│     Data: PARTITION-EU only
│     Cross-border: via cross-border-governance gateway only
│
├── US REGIONAL ORCHESTRATOR (US_EAST region)
│     Agents: all US-jurisdictioned agents
│     Data: PARTITION-US only
│
├── CN REGIONAL ORCHESTRATOR (CN_EAST region)
│     Agents: all CN-jurisdictioned agents
│     Data: PARTITION-CN only (hard isolation)
│     Cross-border: CAC mechanism required
│
├── IN REGIONAL ORCHESTRATOR (IN_WEST region)
│     Agents: all IN-jurisdictioned agents
│     Data: PARTITION-IN only
│
├── GB REGIONAL ORCHESTRATOR (GB_PRIMARY region)
│     Agents: all GB-jurisdictioned agents
│     Data: PARTITION-GB (+ PARTITION-EU via adequacy)
│
└── SG REGIONAL ORCHESTRATOR (SG_PRIMARY region)
      Agents: all SG-jurisdictioned agents
      Data: PARTITION-SG only
```

---

## Workflow Jurisdiction Classification

```
classify_workflow_jurisdiction(workflow_definition, input_payload) → JurisdictionProfile:

  1. Classify input payload:
     payload_jurisdictions = classify_data_jurisdictions(input_payload)
     
  2. Classify data touched by each workflow step:
     step_jurisdictions = []
     for each step in workflow_definition.steps:
       data_sources = step.declared_data_sources
       step_jur = classify_data_jurisdictions(data_sources)
       step_jurisdictions.append((step, step_jur))
       
  3. Identify cross-border requirements:
     for each (step_a, step_b) in consecutive_pairs(step_jurisdictions):
       if step_a.jurisdiction != step_b.jurisdiction:
         cross_border_required.append((step_a, step_b, get_mechanism(step_a.jur, step_b.jur)))
         
  4. Build jurisdiction profile:
     JurisdictionProfile {
       primary_jurisdiction: most_restrictive(all_jurisdictions),
       per_step_jurisdictions: step_jurisdictions,
       cross_border_requirements: cross_border_required,
       multi_jurisdiction: len(unique(all_jurisdictions)) > 1
     }
     
  5. Validate: do cross-border requirements have active mechanisms?
     if any requirement has NO mechanism: BLOCK workflow; alert T4 + Legal
```

---

## Orchestration Payload Sanitization

Orchestration signals crossing jurisdictional boundaries must be sanitized:

```
sanitize_orchestration_payload(payload, source_jurisdiction, target_jurisdiction):

  1. Identify personal data in payload:
     pii_fields = detect_pii(payload)
     
  2. For each PII field:
     field_jurisdiction = classify_field_jurisdiction(field)
     
     if field_jurisdiction == source_jurisdiction and target_jurisdiction != source_jurisdiction:
       # PII must not cross boundary in orchestration signal
       if cross_border_permit exists and covers this field:
         apply_pseudonymization(field)     # replace with pseudonymized token
         register_pseudonym_mapping(token, field, source_jurisdiction)
       else:
         STRIP field from payload
         log FIELD_STRIPPED_CROSS_BORDER
         
  3. Validate sanitized payload:
     assert no unsanitized PII from non-target jurisdiction in result
     
  4. Include jurisdiction metadata in signal envelope:
     payload.envelope.source_jurisdiction = source_jurisdiction
     payload.envelope.target_jurisdiction = target_jurisdiction
     payload.envelope.sanitization_applied = true
     payload.envelope.stripped_fields = [list of stripped field names]
     
  Return: sanitized_payload
```

---

## Regional Orchestrator Selection

```
select_orchestrator(workflow_id, step_id, step_jurisdiction, payload):

  primary = load_regional_orchestrator(step_jurisdiction)
  
  if primary.status == HEALTHY:
    return primary
    
  elif primary.status == DEGRADED:
    # Check if secondary within same jurisdiction exists
    secondary = load_secondary_orchestrator(step_jurisdiction)
    if secondary exists and healthy: return secondary
    
  elif primary.status == OFFLINE:
    # Can we failover to adjacent jurisdiction without violating sovereignty?
    adjacent = find_adjacent_jurisdiction(step_jurisdiction)
    
    for adj in adjacent:
      # Only if adequacy decision or pre-approved BCR covers this pair
      if transfer_mechanism_active(step_jurisdiction, adj.jurisdiction):
        emergency_permit = request_emergency_cross_border(step_jurisdiction, adj.jurisdiction)
        if permit.approved:
          log ORCHESTRATOR_FAILOVER_CROSS_JURISDICTION
          sanitized = sanitize_orchestration_payload(payload, step_jurisdiction, adj.jurisdiction)
          return (adj.orchestrator, sanitized, emergency_permit)
          
    # No safe failover possible
    PAUSE workflow; alert T4; await primary recovery
    constitutional_quorum: if CN partition isolated, constitutional decisions stay BLOCKED
```

---

## Jurisdiction-Aware Execution Context

Every workflow execution carries a jurisdiction context:

```yaml
execution_context:
  workflow_id: string
  
  jurisdiction_context:
    workflow_primary_jurisdiction: JUR-{XX}
    current_step_jurisdiction: JUR-{XX}
    
    active_cross_border_permits: [CBP-{NNN}]
    
    data_residency_map:
      - step_id: string
        data_sources: [string]
        jurisdiction: JUR-{XX}
        
    orchestrator_chain:
      - orchestrator_id: string
        region: string
        jurisdiction: JUR-{XX}
        role: GLOBAL | REGIONAL | LOCAL
        
  jurisdiction_constraints:
    must_complete_in_jurisdiction: JUR-{XX} | null
    cannot_send_to_jurisdictions: [JUR-{XX}]
    requires_human_review_if_cross_border: boolean
    
  sovereignty_audit_trail: [string]     # list of orchestration hop records
```

---

## Multi-Jurisdiction Workflow Orchestration

For workflows that legitimately span jurisdictions (e.g., global analytics that federate across regions):

```
orchestrate_multi_jurisdiction_workflow(workflow_id, jurisdiction_profile):

  # Phase 1: Validate all cross-border requirements have active mechanisms
  for req in jurisdiction_profile.cross_border_requirements:
    validate_mechanism_active(req.source, req.target, req.mechanism)
    
  # Phase 2: Issue cross-border permits per step transition
  permits = {}
  for (step_a, step_b, mechanism) in jurisdiction_profile.cross_border_requirements:
    permit = cross_border_governance.authorize(
      operation_type = COGNITIVE_DELEGATION,
      source = step_a.jurisdiction,
      target = step_b.jurisdiction,
      mechanism = mechanism
    )
    permits[(step_a.id, step_b.id)] = permit
    
  # Phase 3: Execute per step with jurisdiction handoff
  for step in workflow.steps:
    regional_orchestrator = select_orchestrator(step.jurisdiction)
    
    if step is cross_border_from_previous:
      payload = sanitize_orchestration_payload(
        payload, previous_step.jurisdiction, step.jurisdiction
      )
      attach_permit(payload, permits[(previous_step.id, step.id)])
      
    result = regional_orchestrator.execute(step, payload)
    
  # Phase 4: Consolidate results respecting jurisdiction constraints
  return federated_result_merge(results, jurisdiction_profile)
```

---

## Orchestration Audit Trail

```yaml
orchestration_audit_record:
  record_id: JAO-{NNN}
  workflow_id: string
  step_id: string
  
  source_orchestrator: string
  target_orchestrator: string
  source_jurisdiction: JUR-{XX}
  target_jurisdiction: JUR-{XX}
  
  cross_border: boolean
  cross_border_permit_id: CBP-{NNN} | null
  sanitization_applied: boolean
  fields_stripped: [string]
  
  payload_hash: sha256                  # hash of sanitized payload (not raw)
  
  timestamp: ISO8601
  duration_ms: number
```

---

## Integration

```
Feeds into:
  sovereignty-aware-topology.md — topology determines orchestrator placement
  region-aware-orchestration.md — regional orchestrators implement this spec
  sovereign-execution-zones.md — execution zones match orchestration jurisdiction

Receives from:
  cross-border-governance.md — cross-border permits required before handoff
  regional-policy-enforcement.md — policies gate each orchestration step
  regulatory-conflict-arbitration.md — conflict resolutions affect routing rules
  legal-memory-partitioning.md — data residency constraints inform step jurisdiction assignment
```

---

## Governance

**No personal data in global orchestration layer:** Global orchestrator handles only workflow metadata; personal data stays in regional orchestrators  
**Cross-jurisdiction handoff:** Sanitization applied before every cross-jurisdiction payload transmission; non-negotiable  
**CN hard isolation:** CN regional orchestrator never receives orchestration signals from outside China except via CAC-approved mechanism; hard network enforcement  
**Failover sovereignty:** Cross-jurisdiction failover only via active transfer mechanism + emergency permit; never silently  
**Audit:** All orchestration hops logged to `memory/geopolitical-governance/orchestration-audit.jsonl` (per-jurisdiction copies)
