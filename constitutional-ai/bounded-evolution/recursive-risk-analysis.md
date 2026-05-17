# Recursive Risk Analysis
**ID:** BEV-RRA-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Performs multi-order risk analysis of proposed changes to the enterprise AI OS — analyzing not just first-order effects (what the change directly does) but second and third-order effects (what cascades, feedback loops, and emergent dynamics the change may trigger). Recursive risk analysis is required because complex adaptive systems generate risks through interaction effects that no single-order analysis can capture. A change that is safe in isolation may be unsafe in combination with existing capabilities; a change that is safe today may be unsafe after a subsequent change enables new interactions.

---

## Risk Analysis Taxonomy

```yaml
recursive_risk_taxonomy:

  FIRST_ORDER_RISK:
    definition: direct, intended, and reasonably foreseeable effects of the change
    analysis_method: standard impact assessment; known cause-and-effect chains
    required_for: all tiers
    example: adding a new data source to an agent's inputs creates first-order data quality risk
    
  SECOND_ORDER_RISK:
    definition: effects that occur through interaction between the proposed change
                and existing capabilities, behaviors, or external systems
    analysis_method: capability interaction mapping; dependency chain analysis;
                     emergent behavior simulation
    required_for: TIER_2+ modifications
    example: adding data source interacts with agent's existing pattern-recognition
             capability to create a new capability the agent was not designed for
    
  THIRD_ORDER_RISK:
    definition: effects that emerge from feedback loops, systemic dynamics, or
                changes to the environment that the modified system then operates in
    analysis_method: system dynamics modeling; feedback loop identification;
                     second-round effect simulation
    required_for: TIER_3+ modifications and any near-envelope change
    example: new agent capability changes how humans interact with the system,
             which changes what data the agents receive, which changes how
             their behavior develops over time
    
  RECURSIVE_RISK:
    definition: risks that compound through the improvement cycle itself —
                where an improvement changes the system's capability to make
                further improvements, creating a recursive risk cascade
    analysis_method: capability trajectory modeling; improvement chain analysis;
                     risk horizon projection (minimum 5-year)
    required_for: any change to the self-improvement process; any major capability increase
    example: an improvement in reasoning capability enables better improvement proposals,
             which leads to faster capability growth, which may outpace governance capacity
             in ways that were not predictable from the initial change
             
  TAIL_RISK:
    definition: low-probability but catastrophic risks — scenarios that are unlikely
                but whose consequences would be severe enough to warrant mitigation
                even at low probability
    analysis_method: adversarial scenario generation; red team analysis;
                     black swan identification; worst-case trajectory modeling
    required_for: TIER_4 modifications; any change touching autonomy Level 4+
    threshold: accept tail risk only if (probability × impact) < defined tolerance
```

---

## Recursive Risk Analysis Protocol

```
conduct_recursive_risk_analysis(modification_proposal):

  rra = RecursiveRiskAnalysis {
    proposal_id:   modification_proposal.id,
    analysis_date: now(),
    orders:        {}
  }

  # FIRST-ORDER ANALYSIS (always)
  first_order = analyze_first_order_risks(modification_proposal)
  rra.orders[FIRST_ORDER] = first_order

  # SECOND-ORDER ANALYSIS (TIER_2+)
  if modification_proposal.tier >= TIER_2:
    interaction_map = build_capability_interaction_map(modification_proposal)
    second_order = analyze_second_order_risks(modification_proposal, interaction_map)
    rra.orders[SECOND_ORDER] = second_order

    if second_order.unexpected_capabilities_emerged:
      alert_T3("Second-order capability emergence detected", modification_proposal, second_order)

  # THIRD-ORDER ANALYSIS (TIER_3+)
  if modification_proposal.tier >= TIER_3:
    feedback_loops  = identify_feedback_loops(modification_proposal)
    third_order     = analyze_third_order_risks(modification_proposal, feedback_loops)
    rra.orders[THIRD_ORDER] = third_order

  # RECURSIVE RISK ANALYSIS (self-improvement changes; major capability changes)
  if (modification_proposal.affects_improvement_process or
      modification_proposal.capability_delta_significant):
    trajectory     = model_recursive_capability_trajectory(modification_proposal, horizon=5_years)
    recursive_risk = analyze_recursive_risks(modification_proposal, trajectory)
    rra.orders[RECURSIVE] = recursive_risk

    # Governance capacity projection
    governance_capacity_projection = project_governance_capacity_vs_capability(
      trajectory, horizon=5_years
    )
    if governance_capacity_projection.deficit_predicted:
      rra.governance_capacity_concern = governance_capacity_projection

  # TAIL RISK ANALYSIS (TIER_4; autonomy Level 4+)
  if (modification_proposal.tier >= TIER_4 or
      modification_proposal.autonomy_level >= 4):
    tail_scenarios = generate_adversarial_tail_scenarios(modification_proposal)
    tail_risk      = analyze_tail_risks(modification_proposal, tail_scenarios)
    rra.orders[TAIL_RISK] = tail_risk

    for scenario in [s for s in tail_scenarios if s.risk_score > TOLERANCE]:
      alert_T4("Tail risk scenario above tolerance", modification_proposal, scenario)

  # AGGREGATE RISK SCORE
  rra.aggregate_risk_score = compute_aggregate_risk_score(rra.orders)
  rra.approved_with_conditions = (rra.aggregate_risk_score < RISK_THRESHOLD)
  rra.disqualifying_risks = identify_disqualifying_risks(rra.orders)

  if rra.disqualifying_risks:
    rra.approved_with_conditions = False
    rra.disqualification_reason = summarize_disqualifying_risks(rra.disqualifying_risks)

  audit_log(rra)
  Return: rra
```

---

## Interaction Effect Catalog

```yaml
known_high_risk_interactions:
  # Capability combinations known to produce higher-order risks

  REASONING_PLUS_ACTION_SURFACE:
    description: increased reasoning capability + expanded action surface
    risk: agent may reason its way to actions outside intended scope
    mitigation: tight action surface constraint before reasoning capability increase
    severity_multiplier: 1.5x
    
  AUTONOMY_PLUS_MEMORY_PERSISTENCE:
    description: increased autonomy + longer memory persistence
    risk: agent may develop implicit goals over time that emerge from extended memory
    mitigation: memory scope audit before autonomy level increase
    severity_multiplier: 1.4x
    
  SELF_IMPROVEMENT_PLUS_REASONING:
    description: self-improvement capability + enhanced reasoning
    risk: recursive improvement cascade; faster capability growth than planned
    mitigation: improvement rate governor; alignment continuity verification at each cycle
    severity_multiplier: 2.0x  # Highest risk combination
    
  ORCHESTRATION_DEPTH_PLUS_AUTONOMY:
    description: increased delegation depth + higher autonomy levels
    risk: emergent behavior from complex multi-agent interactions at high autonomy
    mitigation: topology analysis; emergent behavior simulation before deployment
    severity_multiplier: 1.6x
    
  KNOWLEDGE_DOMAIN_PLUS_GENERALIZATION:
    description: new domain authorization + enhanced generalization scope
    risk: agent generalizes across domains in ways not anticipated
    mitigation: generalization scope audit; domain boundary testing
    severity_multiplier: 1.3x
```

---

## Detection Rules

```yaml
recursive_risk_analysis_rules:

  RRA-001:
    name: "Modification Deployed Without Required Risk Order Analysis"
    condition: |
      modification.tier >= TIER_2
      AND modification.recursive_risk_analysis.orders_completed < required_order_for_tier
    severity: HIGH
    auto_action: flag_modification; require_risk_completion; alert_governance_officer

  RRA-002:
    name: "Disqualifying Risk Not Blocking Modification"
    condition: |
      rra.disqualifying_risks.count > 0
      AND modification.deployment_state IN [APPROVED, DEPLOYING, DEPLOYED]
    severity: CRITICAL
    auto_action: block_deployment_or_rollback; alert_T4; incident_record

  RRA-003:
    name: "Tail Risk Above Tolerance"
    condition: |
      tail_risk_scenario.risk_score > DEFINED_TOLERANCE
      AND modification.tier >= TIER_4
    severity: HIGH
    auto_action: alert_T4; require_tail_risk_mitigation_plan; delay_deployment

  RRA-004:
    name: "High-Risk Capability Interaction Not Flagged"
    condition: |
      modification INCLUDES known_high_risk_interaction
      AND modification.interaction_risk_flag = false
    severity: HIGH
    auto_action: require_interaction_risk_analysis; alert_governance_officer; delay_deployment

  RRA-005:
    name: "Governance Capacity Deficit Projected"
    condition: |
      governance_capacity_projection.deficit_predicted_within = 18_months
    severity: HIGH
    auto_action: alert_T4; governance_capacity_planning_required; capability_growth_review

  RRA-006:
    name: "Recursive Capability Cascade Risk"
    condition: |
      recursive_risk_analysis.trajectory.governance_deficit_predicted = true
      OR capability_growth_rate_projected_5yr > 10x
    severity: CRITICAL
    auto_action: alert_T4_T5; improvement_rate_governor_adjustment; external_safety_review
```

---

## Integration

```
Feeds into:
  bounded-evolution/bounded-evolution-engine.md — risk analysis results for evolution safety
  recursive-governance/modification-approval-systems.md — risk findings gate approval
  alignment-stability/recursive-alignment-systems.md — recursive risks feed alignment analysis

Receives from:
  bounded-evolution/capability-growth-constraints.md — capability state as analysis input
  recursive-governance/bounded-self-improvement.md — improvement proposals for analysis
  adversarial-defense/adversarial-defense-engine.md — adversarial risk scenarios
```

---

## Governance

**Single-order risk analysis is insufficient for complex adaptive systems:** Any modification to a complex AI system creates interaction effects that first-order analysis cannot capture; multi-order analysis is a governance requirement, not best practice  
**Tail risks must be analyzed even at low probability:** The asymmetry of catastrophic outcomes means even 1% probability scenarios involving severe harm must be explicitly analyzed and addressed before TIER_4 modifications proceed  
**Recursive risks compound:** An improvement that increases improvement capability doubles the recursive risk; the 2.0x severity multiplier for self-improvement + reasoning is not conservative  
**Audit:** All recursive risk analyses, tail risk scenarios, and disqualifying risk findings to `memory/bounded-evolution/risk-analysis-audit.jsonl`; permanent retention
