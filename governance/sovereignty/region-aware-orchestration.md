# Region-Aware Orchestration
**ID:** SVC-RAO-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Orchestrates multi-agent workflows across the sovereign enterprise such that every execution decision — agent selection, task routing, data access, result aggregation — is made with full awareness of the regional and jurisdictional context of every participating agent, dataset, and output. Region-aware orchestration is the operational implementation of the jurisdiction-aware orchestration specification (which defines the framework) and the sovereign org structures (which define the org) — it is the runtime system that makes these frameworks execute correctly at scale.

---

## Orchestration Architecture

```
Region-Aware Orchestration Stack:

Tier 1 — GLOBAL META-ORCHESTRATOR
  Location: PARTITION-GLOBAL (no personal data)
  Role: workflow definition distribution, global health monitoring,
        federation coordination, constitutional quorum interface
  Knows about: workflow definitions, entity topology, cross-entity permits
  Does NOT see: entity-resident personal data
  
Tier 2 — ENTITY ORCHESTRATORS (per sovereign entity)
  Location: each entity's SEZ
  Role: route work within entity, coordinate with global meta-orchestrator,
        enforce entity-level policies, manage entity agent pool
  Knows about: entity's workflows, entity's agents, entity's data
  Does NOT see: other entities' data
  
Tier 3 — LOCAL ORCHESTRATORS (per org within entity)
  Location: entity SEZ, org-scoped
  Role: team-level workflow execution, agent assignment, output collection
  Knows about: org's workflows, org's agents
  Does NOT see: data outside org's authorized scope
```

---

## Region-Aware Routing Engine

```
route_task(task_definition, input_context) → execution_plan:

  1. Determine task jurisdiction profile:
     profile = classify_workflow_jurisdiction(task_definition, input_context)
     
  2. For each step in task_definition:
  
     a. Identify step data requirements:
        step_data = step.declared_data_sources
        step_jurisdictions = [classify_jurisdiction(d) for d in step_data]
        
     b. Select agent pool:
        eligible_agents = [a for a in agent_registry
                          if a.deployment_jurisdiction in step_jurisdictions
                          and a.capability_score(step.required_capabilities) > 0.70
                          and a.current_load < 0.80]
        
        if NO eligible agents in required jurisdiction:
          check_cross_entity_delegation(step, step_jurisdictions)
          if delegation possible: add cross-entity agent to eligible (with permit)
          if NOT possible: PAUSE; alert T3
          
     c. Score and select agent:
        selected_agent = rank_by(
          capability_fit,
          jurisdiction_exact_match_bonus = +0.20,  # prefer exact jurisdiction
          load_balance,
          trust_score
        ).first()
        
     d. Assign step to agent:
        assignment = {
          step_id: step.id,
          agent_id: selected_agent.id,
          deployment_jurisdiction: selected_agent.deployment_jurisdiction,
          data_access: step_jurisdictions,
          cross_entity_permit: permit_id | null
        }
        
  3. Validate full plan for jurisdiction coherence:
     for each consecutive step pair (step_A → step_B):
       if step_A.jurisdiction != step_B.jurisdiction:
         validate_cross_jurisdiction_handoff(step_A, step_B)
         
  4. Return: execution_plan {steps, assignments, cross_entity_permits, jurisdiction_map}
```

---

## Jurisdiction-Coherent Task Execution

```
execute_jurisdiction_coherent(execution_plan):

  for each step in execution_plan (topological order):
  
    agent = load_agent(step.assignment.agent_id)
    
    # Step initialization: jurisdiction context
    step_context = {
      deployment_jurisdiction: agent.deployment_jurisdiction,
      authorized_data_jurisdictions: step.assignment.data_access,
      active_policies: policy_catalog.get_for_jurisdiction(agent.deployment_jurisdiction),
      cognition_boundary: regional_cognition_boundaries[agent.deployment_jurisdiction],
      cross_entity_permit: step.assignment.cross_entity_permit
    }
    
    # Execute in agent's zone
    result = execute_in_zone(
      agent = agent,
      task = step.task_definition,
      context = step_context,
      zone = sovereign_execution_zones[agent.deployment_zone]
    )
    
    # If next step is in different jurisdiction: handoff protocol
    if has_next_step and next_step.jurisdiction != step.jurisdiction:
      handoff_payload = prepare_cross_jurisdiction_handoff(
        result = result,
        source_jurisdiction = step.assignment.deployment_jurisdiction,
        target_jurisdiction = next_step.assignment.deployment_jurisdiction,
        permit = execution_plan.cross_entity_permits[(step.id, next_step.id)]
      )
    else:
      handoff_payload = result  # same jurisdiction: no sanitization needed
      
    # Pass to next step
    deliver_to_next_step(next_step.agent_id, handoff_payload)
```

---

## Cross-Entity Handoff Protocol

```
prepare_cross_jurisdiction_handoff(result, source_jurisdiction, target_jurisdiction, permit):

  1. Validate permit:
     if permit is None or permit.expired: BLOCK handoff; log HANDOFF_PERMIT_MISSING
     
  2. Apply data minimization:
     minimized = apply_minimization_rules(result, source_jurisdiction, target_jurisdiction)
     
  3. Sanitize sensitive fields:
     sanitized = sanitize_orchestration_payload(minimized, source_jurisdiction, target_jurisdiction)
     
  4. Pseudonymize cross-jurisdictional identifiers:
     pseudonymized = pseudonymize_identifiers(sanitized, source_jurisdiction)
     # registers token→real_id mapping in source jurisdiction only
     
  5. Package with jurisdiction envelope:
     handoff_package = {
       payload: pseudonymized,
       source_jurisdiction: source_jurisdiction,
       target_jurisdiction: target_jurisdiction,
       permit_id: permit.permit_id,
       transfer_mechanism: permit.mechanism,
       fields_stripped: [list],
       fields_pseudonymized: [list],
       source_entity: source_jurisdiction.entity_id,
       package_hash: sha256(pseudonymized),
       created_at: ISO8601
     }
     
  6. Log handoff in source jurisdiction audit trail
  
  Return: handoff_package
```

---

## Region-Aware Load Balancing

```yaml
region_aware_load_balancing:
  principle: prefer jurisdiction-local assignment; cross-jurisdiction only as fallback
  
  priority_order:
    1. Same jurisdiction, same org (lowest latency, highest sovereignty compliance)
    2. Same jurisdiction, different org (still compliant)
    3. Same sovereignty cluster (e.g., EU + GB via adequacy)
    4. Cross-jurisdiction with active mechanism (highest overhead)
    5. Cross-entity delegation (requires explicit permit; last resort)
    
  load_thresholds:
    overload_threshold: 0.85 utilization
    rebalance_trigger: 0.80 utilization for 5 minutes
    rebalance_target: 0.65 utilization
    cross_jurisdiction_rebalance: only if same-jurisdiction pool exhausted
    
  rebalance_algorithm:
    1. Find underloaded agents in same jurisdiction
    2. If none: find underloaded agents in sovereignty cluster
    3. If none: request cross-entity delegation (T3 pre-auth required)
    4. If none: queue work; alert T3 (jurisdiction capacity issue)
```

---

## Workflow Orchestration Modes

```yaml
orchestration_modes:

  LOCAL_ONLY:
    description: Entire workflow executes within one entity's jurisdiction
    data_flow: no cross-jurisdiction
    mechanism_required: false
    performance: lowest overhead
    use_when: all data and all agents in single jurisdiction
    
  FEDERATED:
    description: Workflow coordinates agents across jurisdictions; data stays local
    data_flow: metadata only across jurisdictions; data stays in zone
    mechanism_required: true (for metadata containing derivations of personal data)
    performance: moderate overhead (sanitization + permit verification)
    use_when: global workflows coordinating regional execution
    
  DATA_FOLLOWS_AGENT:
    description: Agent moves to where data is (data never moves)
    data_flow: agent deployed in target jurisdiction; processes data locally
    mechanism_required: false (agent is jurisdictionally re-deployed, not data transferred)
    performance: higher setup overhead; lower ongoing overhead
    use_when: large data volume, frequent access patterns warrant in-jurisdiction agent
    
  HYBRID:
    description: Combination of LOCAL and FEDERATED steps within one workflow
    routing: each step classified independently
    mechanism_required: per step as needed
```

---

## Orchestration Telemetry

```yaml
region_aware_orchestration_metrics:
  per_entity:
    - workflow_completion_rate
    - cross_jurisdiction_step_rate (% of steps requiring cross-jurisdictional handoff)
    - handoff_success_rate (target > 99.5%)
    - permit_expiry_rate (permits expiring before handoff completes)
    - jurisdiction_mismatch_blocks (should be 0)
    - entity_capacity_utilization
    
  system_wide:
    - federation_coherence_score (how well cross-entity workflows complete end-to-end)
    - cross_entity_delegation_rate (% of tasks delegated cross-entity; target < 5%)
    - region_aware_routing_accuracy (correct jurisdiction selected on first attempt)
    
  alerting:
    jurisdiction_mismatch_block: T3 immediate
    cross_entity_delegation_rate > 10%: T3 review (may indicate capacity issue)
    handoff_success_rate < 99%: T3 investigate
```

---

## Integration

```
Feeds into:
  sovereignty-aware-topology.md — orchestration topology reflects this routing architecture
  cross-region-federation-controls.md — federated orchestration uses federation protocol

Receives from:
  jurisdiction-aware-orchestration.md — framework specification implemented here
  sovereign-org-structures.md — org structure determines eligible agent pools
  enterprise-federation.md — federation agreements define cross-entity delegation rules
  regional-policy-enforcement.md — policies gate each orchestration step
  cross-border-governance.md — cross-entity permits issued here
```

---

## Governance

**Jurisdiction-local preference:** Routing algorithm always prefers same-jurisdiction execution; cross-jurisdiction escalation requires load evidence  
**Cross-entity delegation cap:** System alert at > 10% cross-entity delegation rate; indicates structural capacity problem  
**Handoff sanitization:** Non-negotiable; every cross-jurisdiction handoff is sanitized; no bypass  
**Permit verification:** Every cross-jurisdiction step verifies permit validity before executing; expired permit = step blocked, not skipped  
**Audit:** All routing decisions, handoffs, and jurisdiction mismatches to `memory/sovereignty-controls/orchestration-log.jsonl` (per-entity copies)
