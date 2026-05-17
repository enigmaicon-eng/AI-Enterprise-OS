# Orchestration Reliability Scorer

**System ID:** `orchestration-reliability-scorer`
**Role:** Scores the reliability of orchestration decisions — evaluating the trustworthiness of routing decisions, agent delegation choices, subagent spawn justifications, and multi-agent coordination outcomes; produces a reliability score that gates whether orchestration actions are executed automatically or escalated for human review
**Storage:** `memory/trust-boundaries/reliability-scores.jsonl`

---

## Purpose

An orchestrator that routes a task to the wrong agent, delegates to a subagent it shouldn't spawn, or chains agents in an unauthorized sequence is making an orchestration error — one that may be difficult to detect from the output alone. The orchestration reliability scorer evaluates the decision-making quality of orchestrating agents: not just whether the output looks right, but whether the orchestration path that produced it was legitimate, reasoned, and within the declared authority of the orchestrating agent.

---

## Reliability Dimensions

```yaml
OrchestrationReliabilityDimension:
  
  ROUTING_ALIGNMENT:
    weight: 0.25
    description: "Routing decision matches declared intent and workflow specification"
    signals:
      - routed_to_declared_agent: "Agent chosen was in the declared handoff list"
      - routing_reason_provided: "Explicit reasoning for routing choice"
      - routing_matches_intent_class: "Target agent's capabilities match task"
    score_range: [0.0, 1.0]
  
  AUTHORITY_WITHIN_BOUNDS:
    weight: 0.25
    description: "Orchestration action is within the orchestrating agent's authority level"
    signals:
      - decision_within_authority_level: "Decision type permitted at this agent's trust tier"
      - no_authority_escalation: "Not claiming permissions beyond what token grants"
      - delegation_depth_respected: "Subagent depth within manifest limit"
    score_range: [0.0, 1.0]
  
  DECISION_JUSTIFICATION:
    weight: 0.20
    description: "Orchestration decision includes traceable reasoning"
    signals:
      - rationale_present: "Decision includes explanation"
      - rationale_traces_to_input: "Reasoning references actual input data"
      - alternatives_considered: "Shows awareness of other options"
    score_range: [0.0, 1.0]
  
  HANDOFF_COMPLETENESS:
    weight: 0.15
    description: "Handoff packages are complete and correctly structured"
    signals:
      - required_context_passed: "All required context fields populated"
      - no_orphaned_references: "No references to data the target agent cannot access"
      - artifact_lineage_maintained: "Artifact IDs correctly propagated"
    score_range: [0.0, 1.0]
  
  HISTORICAL_ORCHESTRATION_QUALITY:
    weight: 0.15
    description: "This orchestrating agent's track record on similar decisions"
    signals:
      - prior_routing_success_rate: "% of prior routes that produced correct outputs"
      - prior_delegation_success_rate: "% of delegations that succeeded"
      - correction_frequency: "How often orchestration decisions were corrected"
    score_range: [0.0, 1.0]
```

---

## Scoring Protocol

```
score_orchestration_decision(orchestration_event, scoring_context) → OrchestratorReliabilityScore:
  
  orchestrating_agent_id = orchestration_event.orchestrating_agent_id
  decision_type = orchestration_event.decision_type  # "ROUTE | DELEGATE | SPAWN_SUBAGENT | CHAIN"
  
  dimension_scores = {}
  
  # Dimension 1: Routing alignment
  routing_score = compute_routing_alignment(orchestration_event, scoring_context)
  dimension_scores["ROUTING_ALIGNMENT"] = routing_score
  
  # Dimension 2: Authority within bounds
  authority_score = compute_authority_within_bounds(orchestration_event, orchestrating_agent_id)
  dimension_scores["AUTHORITY_WITHIN_BOUNDS"] = authority_score
  
  # Dimension 3: Decision justification
  justification_score = compute_decision_justification(orchestration_event)
  dimension_scores["DECISION_JUSTIFICATION"] = justification_score
  
  # Dimension 4: Handoff completeness
  handoff_score = compute_handoff_completeness(orchestration_event, scoring_context)
  dimension_scores["HANDOFF_COMPLETENESS"] = handoff_score
  
  # Dimension 5: Historical quality
  historical = get_orchestration_history(orchestrating_agent_id, decision_type)
  dimension_scores["HISTORICAL_ORCHESTRATION_QUALITY"] = historical.success_rate
  
  weights = {
    "ROUTING_ALIGNMENT": 0.25,
    "AUTHORITY_WITHIN_BOUNDS": 0.25,
    "DECISION_JUSTIFICATION": 0.20,
    "HANDOFF_COMPLETENESS": 0.15,
    "HISTORICAL_ORCHESTRATION_QUALITY": 0.15
  }
  
  composite = SUM(dimension_scores[d] × weights[d] for d in weights)
  
  # Disqualifiers
  disqualifiers = check_orchestration_disqualifiers(orchestration_event, orchestrating_agent_id)
  IF disqualifiers:
    composite = MIN(composite, 0.25)
  
  tier = classify_reliability_tier(composite)
  
  score = OrchestratorReliabilityScore(
    score_id = generate_uuid(),
    orchestrating_agent_id = orchestrating_agent_id,
    decision_type = decision_type,
    composite_score = composite,
    reliability_tier = tier,
    dimension_scores = dimension_scores,
    disqualifiers = disqualifiers,
    recommended_action = compute_action(tier),
    scored_at = now()
  )
  
  persist_score(score)
  RETURN score

compute_routing_alignment(event, context):
  score = 1.0
  
  # Target agent in declared handoff list
  node_decl = workflow_registry.get_node_declaration(context.run_id, context.node_id)
  IF node_decl.declared_handoff_agents:
    IF event.target_agent_id NOT IN node_decl.declared_handoff_agents:
      score -= 0.40  # Significant penalty for undeclared routing
  
  # Target agent capabilities match task requirements
  target_manifest = capability_scope_controller.load_manifest(event.target_agent_id)
  task_requirements = extract_task_requirements(event.task_description)
  capability_match = compute_capability_match(task_requirements, target_manifest)
  score = score × capability_match
  
  RETURN MAX(0.0, score)

compute_authority_within_bounds(event, orchestrating_agent_id):
  score = 1.0
  
  manifest = capability_scope_controller.load_manifest(orchestrating_agent_id)
  
  # Subagent spawn check
  IF event.decision_type == "SPAWN_SUBAGENT":
    IF NOT manifest.execution.can_spawn_subagents:
      RETURN 0.0  # Hard fail: no spawn authority
    
    IF event.subagent_depth > manifest.execution.max_subagent_depth:
      score -= 0.50
  
  # Authority level check for decision type
  required_authority = get_required_authority(event.decision_type, event.decision_scope)
  IF manifest.governance.authority_level < required_authority:
    penalty = (required_authority - manifest.governance.authority_level) × 0.25
    score -= penalty
  
  RETURN MAX(0.0, score)

check_orchestration_disqualifiers(event, orchestrating_agent_id):
  disqualifiers = []
  
  # Agent routing to itself (self-loop detection)
  IF event.target_agent_id == orchestrating_agent_id:
    disqualifiers.append(Disqualifier(reason="Self-routing detected — agent routing task to itself"))
  
  # Circular delegation detection
  delegation_chain = get_delegation_chain(event.run_id)
  IF orchestrating_agent_id in delegation_chain and len(delegation_chain) > 0:
    IF delegation_chain.index(orchestrating_agent_id) < len(delegation_chain) - 1:
      disqualifiers.append(Disqualifier(reason="Circular delegation detected in chain"))
  
  # Cross-zone routing without boundary approval
  source_zone = trust_boundary_registry.get_agent_zone(orchestrating_agent_id)
  target_zone = trust_boundary_registry.get_agent_zone(event.target_agent_id)
  IF source_zone != target_zone:
    boundary_decision = trust_boundary_registry.evaluate_boundary_crossing({
      source_agent_id: orchestrating_agent_id,
      target_agent_id: event.target_agent_id,
      direction: "A_TO_B"
    })
    IF NOT boundary_decision.allowed:
      disqualifiers.append(Disqualifier(reason=f"Cross-zone routing violates boundary policy: {boundary_decision.violations}"))
  
  RETURN disqualifiers
```

---

## Reliability Tier Classification

```yaml
ReliabilityTier:
  VERY_HIGH: {range: [0.90, 1.00], action: "EXECUTE_AUTOMATICALLY"}
  HIGH:      {range: [0.75, 0.90), action: "EXECUTE_WITH_MONITORING"}
  MEDIUM:    {range: [0.55, 0.75), action: "EXECUTE_WITH_PEER_REVIEW"}
  LOW:       {range: [0.35, 0.55), action: "REQUIRE_HUMAN_APPROVAL"}
  VERY_LOW:  {range: [0.00, 0.35), action: "BLOCK_AND_ESCALATE"}
```

---

## Integration

**Called by:**
- `workflow-engine/dag-engine.md` — scores all routing and delegation decisions
- `trust-boundaries/trust-boundary-registry.md` — uses reliability score for boundary decisions

**Calls:**
- `execution-security/capability-scope-controller.md` — reads capability manifests
- `trust-boundaries/trust-boundary-registry.md` — checks zone boundaries for routed agents
- `audit-replay/immutable-audit-log.md` — records all reliability scores

**Writes to:** `memory/trust-boundaries/reliability-scores.jsonl`
