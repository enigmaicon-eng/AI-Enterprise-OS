# Conflict Resolution Engine

## Purpose
Detects, categorizes, and resolves conflicts that arise during multi-agent coordination — including disagreements between agents on outputs, resource contention, priority disputes, authority conflicts, and scope ambiguity. Every conflict has a defined resolution path that avoids deadlock, preserves governance integrity, and produces a documented outcome.

---

## Conflict Taxonomy

```yaml
conflict_types:
  OUTPUT_CONFLICT:
    definition: two or more agents produce contradictory outputs for the same question or artifact
    example: agent A concludes policy applies; agent B concludes it does not
    severity_driver: downstream impact of choosing wrong answer; reversibility
    resolution_approach: evidence-based adjudication or human escalation
  
  RESOURCE_CONTENTION:
    definition: two or more agents request the same agent, artifact, or system resource simultaneously
    example: two orchestrators both claim the only EXPERT-level constitutional evaluation agent
    severity_driver: urgency of both requesters; criticality of the resource
    resolution_approach: priority-based arbitration; queueing; resource expansion
  
  PRIORITY_DISPUTE:
    definition: disagreement over which task should execute first when capacity is constrained
    example: orchestrator A claims HIGH priority; orchestrator B claims CRITICAL for same resource
    severity_driver: both tasks' stakes; deadline proximity
    resolution_approach: objective priority scoring; human arbitration for ties
  
  AUTHORITY_CONFLICT:
    definition: two agents both claim authority to make a decision or control a domain
    example: two coordinators both assigned authority over overlapping task domains
    severity_driver: governance risk; potential for contradictory decisions being made
    resolution_approach: authority chain verification; governance escalation
  
  SCOPE_CONFLICT:
    definition: disagreement about what work is within a task's scope
    example: agent believes its task requires acquiring data from an external system; orchestrator disagrees
    severity_driver: impact on deliverable completeness; timeline risk
    resolution_approach: charter review; orchestrator has final say on scope
  
  CONTRACT_DISPUTE:
    definition: provider and consumer disagree on whether a deliverable met contract terms
    example: consumer rejects artifact as incomplete; provider believes it was complete per schema
    severity_driver: task timeline impact; agent relationship integrity
    resolution_approach: per inter-agent-contracts.md dispute resolution tiers
  
  ESCALATION_CONFLICT:
    definition: agent disagrees with escalation handling (escalation received different response than expected, or escalation rejected)
    resolution_approach: structured appeal to governance lead
```

---

## Conflict Detection

```yaml
conflict_detection:
  automated_detection:
    OUTPUT_CONFLICT:
      method: semantic comparison of parallel outputs from the same stage
      trigger: cosine_similarity < 0.50 between outputs on same question
      also_trigger: explicit flag from any agent noting contradiction
    
    RESOURCE_CONTENTION:
      method: assignment ledger monitors concurrent claims on same agent/artifact
      trigger: simultaneous claim attempt on exclusive resource
    
    PRIORITY_DISPUTE:
      method: priority queue detects conflicting priority assignments from different orchestrators
      trigger: same resource targeted by multiple CRITICAL assignments from independent orchestrators
    
    AUTHORITY_CONFLICT:
      method: delegation governance system monitors for overlapping authority scopes
      trigger: two active delegations with intersecting domain + decision_type
    
    SCOPE_CONFLICT:
      method: agent-reported; no automated detection (agent flags in CLARIFICATION_REQUEST)
    
    CONTRACT_DISPUTE:
      method: consumer rejection + provider non-acceptance of rejection = dispute flag
      trigger: FEEDBACK message with REJECTED status where producer disagrees
  
  human_reported:
    mechanism: any agent or human can submit conflict report via governance queue
    form: {conflict_type, parties_involved, evidence, urgency}
    acknowledgment_sla: 15 minutes
```

---

## Resolution Protocol

```yaml
resolution_protocol:
  tier_1_automated_resolution:
    applies_to: RESOURCE_CONTENTION, PRIORITY_DISPUTE
    
    RESOURCE_CONTENTION_resolution:
      step_1: compute urgency scores for all claimants (priority × deadline_proximity × blast_radius)
      step_2: allocate resource to highest urgency claimant
      step_3: queue other claimants by urgency; notify with estimated wait
      step_4: if urgency is equal: oldest request wins (FIFO tie-break)
      step_5: if resource critically unavailable: alert orchestration strategy engine to find alternative
    
    PRIORITY_DISPUTE_resolution:
      step_1: apply objective priority scoring (see priority_scoring below)
      step_2: highest objective score wins
      step_3: if score tied within 0.05: both escalated to their respective supervisors for joint arbitration
      decision_time: < 30 seconds for automated resolution
    
    priority_scoring:
      formula: (governance_level × 0.35) + (deadline_urgency × 0.30) + (blast_radius × 0.20) + (requestor_tier × 0.15)
      governance_level: CRITICAL=1.0, ENHANCED=0.75, STANDARD=0.50
      deadline_urgency: 1.0 if < 30min; 0.7 if < 2h; 0.4 if < 24h; 0.1 otherwise
      blast_radius: normalized count of affected agents/humans
      requestor_tier: T4=1.0, T3=0.75, T2=0.50, T1=0.25
  
  tier_2_arbitration:
    applies_to: OUTPUT_CONFLICT, CONTRACT_DISPUTE, SCOPE_CONFLICT, unresolved tier_1
    
    arbiter_selection:
      criteria: agent with EXPERT proficiency in the conflicted domain; tier >= all parties; not a party
      if_no_agent_arbiter_available: human escalation immediately
      selected_via: agent-discovery-engine.md PRECISE mode
    
    arbitration_protocol:
      step_1: arbiter receives full conflict record (outputs, evidence, positions from all parties)
      step_2: arbiter independently analyzes using STRUCTURED_DELIBERATION protocol
      step_3: arbiter produces ARBITRATION_DECISION with:
        - finding: which party's position is upheld (or a synthesis)
        - reasoning: explicit rationale
        - confidence: float (if < 0.75 → escalate to tier 3)
        - required_actions: what each party must do
      step_4: decision communicated to all parties
      step_5: parties must comply; non-compliance = governance violation
      
      timeline_sla:
        standard_priority: 30 minutes
        high_priority: 15 minutes
        critical_priority: 5 minutes (arbiter must be immediately available or escalate to human)
    
    OUTPUT_CONFLICT_specific:
      additional_step: arbiter may request third output from independent agent if evidence insufficient
      resolution_outcomes:
        ONE_CORRECT: arbiter selects one output as authoritative; other discarded; performance note for wrong party
        SYNTHESIS_NEEDED: arbiter commissions synthesized output incorporating valid elements of both
        INSUFFICIENT_EVIDENCE: escalate to tier 3 (human)
  
  tier_3_governance_escalation:
    applies_to: AUTHORITY_CONFLICT, ESCALATION_CONFLICT, unresolved tier_2, any conflict involving T3+ agents
    
    escalation_target: delegation governance lead (or capability governance lead for capability-related)
    
    process:
      step_1: governance lead reviews full conflict record including all prior resolution attempts
      step_2: consults relevant policy (delegation-model, capability-governance, orchestration pattern)
      step_3: issues GOVERNANCE_DECISION with:
        - ruling: binding decision
        - policy_basis: which policy or principle supports this ruling
        - precedent_note: if this creates a precedent for future conflicts
        - consequential_actions: performance notes, policy updates, investigation if warranted
      decision_sla: 1 hour for HIGH; 2 hours for MEDIUM; 24 hours for LOW
    
    AUTHORITY_CONFLICT_specific:
      step_1: trace both authority claims to their originating delegation records
      step_2: identify where the overlap originated (planning error or delegation error)
      step_3: resolve by: clarifying scope boundaries; revoking conflicting delegation; establishing precedence
      step_4: update orchestration plan and delegation records
  
  tier_4_human_executive_decision:
    applies_to: unresolved tier_3; constitutional questions; decisions affecting Tier-4+ authority
    escalation_target: Tier-4+ human leadership
    response_SLA: 4 hours
    no_appeal: human executive decision is final within this conflict instance
```

---

## Conflict Record Schema

```yaml
conflict_record:
  conflict_id: "CFR-{timestamp}-{seq}"
  conflict_type: string
  
  parties: [
    {agent_id, role_in_conflict, position_summary, evidence_refs}
  ]
  
  timeline:
    detected_at: ISO-8601
    detected_by: automated | agent_id | human_id
    resolution_tier_reached: int (1-4)
    resolved_at: ISO-8601 | null
    resolution_time_minutes: int | null
  
  resolution:
    status: OPEN | RESOLVED | ESCALATED | UNRESOLVABLE
    tier_resolutions: [
      {tier, resolver_id, decision, rationale, outcome, at}
    ]
    final_decision: string
    actions_required: [{agent_id, action, deadline}]
    precedent_created: boolean
    precedent_description: string | null
  
  impact:
    task_delay_minutes: int | null
    affected_tasks: [task_id]
    governance_consequence: string | null
  
  audit:
    audit_level: STANDARD | ENHANCED
    retention: 1 year (STANDARD); 3 years (ENHANCED)
```

---

## Conflict Prevention

```yaml
conflict_prevention:
  at_planning_time:
    orchestration_strategy_engine: validates no overlapping authority assignments before plan approval
    work_distribution_engine: detects resource contention before dispatch (pre-flight check)
    delegation_governance: monitors for overlapping delegation scopes
  
  at_team_formation:
    inter_agent_contracts: explicit scope and deliverable schema prevents later scope disputes
    explicit_dependencies: all inter-agent dependencies mapped before work begins
    escalation_paths_pre_defined: no improvised escalation needed during execution
  
  common_root_causes_and_mitigations:
    vague_task_scope → mandate deliverable schema at planning time
    parallel_authority_grants → delegation governance overlap detection
    insufficient_capacity_planning → capacity checks before assignment
    ambiguous_priority → objective priority scoring applied at assignment time
  
  conflict_rate_target:
    overall: < 2% of work units trigger a conflict
    resource_contention: < 1% (capacity planning quality metric)
    output_conflict: < 0.5% (agent quality metric)
    authority_conflict: < 0.1% (planning quality metric; near-zero is achievable)
```

---

## Integration Points

| System | Role |
|---|---|
| `coordination-operations/work-distribution-engine.md` | Resource contention detected during assignment |
| `coordination-operations/inter-agent-messaging.md` | ESCALATION messages route to this engine |
| `delegation-and-trust/inter-agent-contracts.md` | Contract disputes handled per contract dispute resolution |
| `delegation-and-trust/delegation-governance.md` | Authority conflicts governed here |
| `orchestration-patterns/peer-coordination-protocols.md` | Consensus deadlocks escalate to this engine |
| `agent-intelligence/agent-reasoning-engine.md` | STRUCTURED_DELIBERATION used by arbiters |
| `coordination-operations/orchestration-operations-dashboard.md` | Conflict metrics displayed here |
