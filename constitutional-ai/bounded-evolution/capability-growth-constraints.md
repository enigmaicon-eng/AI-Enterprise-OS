# Capability Growth Constraints
**ID:** BEV-CGC-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Defines and enforces the hard constraints on AI capability growth within the enterprise — preventing any capability dimension from expanding faster than human oversight can track, evaluate, and govern it. Capability constraints are not arbitrary limitations; they are the structural expression of the principle that AI capability must remain within human governance capacity at all times. Constraints are defined, measured, and enforced per-dimension; they are constitutional artifacts that may not be relaxed by operational decision.

---

## Capability Dimension Registry

```yaml
capability_dimension_registry:
  # Each dimension has defined current ceiling, measurement method, and expansion process

  REASONING_CAPABILITY:
    description: depth and complexity of reasoning AI agents can perform
    measurement: benchmark suite (REASON-BENCH-001); context depth; multi-step inference chains
    current_ceiling: L4_REASONING  # defined by constitution; updated only by amendment
    growth_rate_limit: 20% improvement per quarter on benchmark suite
    expansion_requires: T4 + safety analysis + alignment continuity verification
    governance_sensitivity: HIGH  # More capable reasoning harder for humans to audit
    
  AUTONOMY_LEVEL:
    description: degree to which agents may act without human approval
    measurement: autonomy_level_framework.md (Level 0–5)
    current_fleet_ceiling: Level_4
    individual_agent_ceiling: authorized in agent registration; cannot exceed fleet ceiling
    growth_rate_limit: +1 level per 18 months for fleet ceiling
    single_step_maximum: +1 level per grant
    expansion_requires: T5+board for ceiling; T4 for individual agent
    governance_sensitivity: CRITICAL  # Directly determines human oversight requirements
    
  ACTION_SURFACE:
    description: breadth of external actions AI agents may take (APIs, systems, decisions)
    measurement: authorized action catalog; blast radius analysis
    current_ceiling: current_authorized_action_catalog
    expansion_per_quarter_maximum: 10 new action types
    expansion_requires: T3 + impact assessment + staged rollout
    governance_sensitivity: HIGH  # More action surface = more potential for harm
    
  KNOWLEDGE_DOMAIN:
    description: domains in which agents may independently make consequential decisions
    measurement: domain authorization registry
    expansion_per_quarter_maximum: 2 new consequential domains
    expansion_requires: T4 + domain safety assessment + stakeholder consent
    governance_sensitivity: HIGH
    
  ORCHESTRATION_COMPLEXITY:
    description: depth and complexity of multi-agent orchestration
    measurement: max_delegation_depth; max_parallel_agents; topology_complexity
    current_ceiling: delegation_depth_4; parallel_agents_50; see recursive-exploit-prevention.md
    expansion_requires: constitutional amendment for delegation depth; T4 for others
    governance_sensitivity: CRITICAL  # Emergent behavior harder to govern in complex topologies
    
  MEMORY_PERSISTENCE:
    description: duration and scope of agent memory and context persistence
    measurement: max_context_retention_period; cross_session_memory_scope
    current_ceiling: session + organizational_memory (no indefinite individual memory)
    expansion_requires: T4 + privacy review + consent governance review
    governance_sensitivity: MEDIUM
    
  GENERALIZATION_SCOPE:
    description: breadth of domains where AI may generalize from training to novel situations
    measurement: out-of-distribution performance; domain transfer capability
    current_ceiling: intra-organizational (no generalization to novel external domains without review)
    expansion_requires: T4 + safety analysis + alignment verification
    governance_sensitivity: HIGH  # Unexpected generalization creates unforeseen risks
```

---

## Capability Growth Monitoring

```
monitor_capability_growth():
  # Continuous monitoring of growth rates across all capability dimensions

  monitoring_report = CapabilityGrowthReport { dimensions: [] }

  for dimension in get_capability_dimension_registry():

    current_value   = measure_capability_dimension(dimension)
    baseline_90d    = get_dimension_baseline(dimension, window=90_days)
    growth_rate_90d = (current_value - baseline_90d) / baseline_90d if baseline_90d else 0.0

    dimension_status = CapabilityDimensionStatus {
      dimension_id:     dimension.id,
      current_value:    current_value,
      ceiling:          dimension.current_ceiling,
      proximity_to_ceiling: current_value / dimension.current_ceiling_numeric,
      growth_rate_90d:  growth_rate_90d,
      growth_limit:     dimension.growth_rate_limit,
      within_limit:     growth_rate_90d <= dimension.growth_rate_limit,
      sensitivity:      dimension.governance_sensitivity
    }
    monitoring_report.dimensions.append(dimension_status)

    # Alert if approaching ceiling
    if dimension_status.proximity_to_ceiling > 0.80:
      alert_T3(f"Capability dimension {dimension.id} approaching ceiling",
               dimension_status, "Advance planning required for ceiling review")

    # Alert if growth rate exceeded
    if not dimension_status.within_limit:
      alert_T3(f"Capability growth rate exceeded for {dimension.id}", dimension_status)
      recommend_growth_rate_remediation(dimension, dimension_status)

  monitoring_report.all_within_limits = all(d.within_limit for d in monitoring_report.dimensions)

  Return: monitoring_report
```

---

## Capability-Governance Gap Analysis

```
analyze_capability_governance_gap():
  # For each capability dimension, determines whether governance is adequate for current level

  gap_analysis = CapabilityGovernanceGapAnalysis { dimensions: [] }

  for dimension in get_capability_dimension_registry():

    current_capability = measure_capability_dimension(dimension)

    # What governance mechanisms exist for this dimension?
    governance_coverage = assess_governance_coverage(dimension, current_capability)

    # Is governance adequate for current capability level?
    adequacy = compute_governance_adequacy(
      capability=current_capability,
      governance=governance_coverage,
      sensitivity=dimension.governance_sensitivity
    )

    dimension_gap = CapabilityGovernanceGap {
      dimension_id:        dimension.id,
      current_capability:  current_capability,
      governance_coverage: governance_coverage,
      adequacy_score:      adequacy,
      gap_exists:          adequacy < 0.80
    }
    gap_analysis.dimensions.append(dimension_gap)

    if dimension_gap.gap_exists:
      alert_T3(f"Governance gap for capability dimension {dimension.id}", dimension_gap)

  gap_analysis.critical_gaps = [d for d in gap_analysis.dimensions if d.adequacy_score < 0.60]
  if gap_analysis.critical_gaps:
    alert_T4("Critical capability-governance gaps detected", gap_analysis.critical_gaps)

  Return: gap_analysis
```

---

## Detection Rules

```yaml
capability_growth_constraint_rules:

  CGC-001:
    name: "Capability Growth Rate Exceeded"
    condition: |
      capability_dimension.growth_rate_90d > capability_dimension.growth_rate_limit
    severity: HIGH
    auto_action: alert_T3; growth_pause_recommendation; root_cause_analysis

  CGC-002:
    name: "Capability Ceiling Violation"
    condition: |
      capability_dimension.current_value > capability_dimension.current_ceiling_numeric
    severity: CRITICAL
    auto_action: alert_T4; immediate_capability_reduction; constitutional_violation_record

  CGC-003:
    name: "Capability Approaching Ceiling Without Advance Planning"
    condition: |
      capability_dimension.proximity_to_ceiling > 0.90
      AND ceiling_expansion_plan.exists = false
    severity: HIGH
    auto_action: alert_T3; mandate_ceiling_planning; governance_calendar_entry

  CGC-004:
    name: "Critical Capability-Governance Gap"
    condition: |
      capability_governance_gap.adequacy_score < 0.60
      FOR any dimension WITH sensitivity IN [HIGH, CRITICAL]
    severity: CRITICAL
    auto_action: alert_T4; freeze_capability_growth_in_dimension; governance_investment_mandate

  CGC-005:
    name: "Multiple Dimensions Simultaneously Exceeding Growth Rate"
    condition: |
      count(dimensions WHERE growth_rate_exceeded = true) >= 3
    severity: HIGH
    auto_action: alert_T4; systemic_growth_review; consider_fleet_wide_growth_pause

  CGC-006:
    name: "Capability Constraint Registry Modified Without Authorization"
    condition: |
      capability_dimension_registry.modified = true
      AND modification.authorization_level < CONSTITUTIONAL_AMENDMENT
    severity: CRITICAL
    auto_action: revert_registry; alert_T5; constitutional_violation_record
```

---

## Integration

```
Feeds into:
  bounded-evolution/bounded-evolution-engine.md — capability status for evolution safety score
  bounded-evolution/recursive-risk-analysis.md — capability state as risk analysis input
  recursive-governance/bounded-self-improvement.md — capability bounds define improvement envelope

Receives from:
  autonomy/autonomy-level-framework.md — autonomy level measurements
  evaluation/evaluation-framework.md — capability benchmark results
  authorization/role-management.md — action surface catalog
```

---

## Governance

**Capability constraints are constitutional artifacts:** No operational decision or administrative action may expand capability ceilings; ceiling expansion requires constitutional amendment; this is not a policy choice  
**Governance adequacy is a capability constraint:** If governance cannot adequately govern a capability level, that capability level is too high; capability must be reduced until governance is adequate — not the reverse  
**Growth rate matters as much as absolute level:** A system growing at 20% per quarter will double in capability annually; governance must plan for trajectory, not just current state  
**Audit:** All capability measurements, growth rate monitoring, and constraint violation records to `memory/bounded-evolution/capability-audit.jsonl`; permanent retention
