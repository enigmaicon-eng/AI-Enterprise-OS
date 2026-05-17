# Capability Escalation Detection
**ID:** AIT-CED-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Detects unauthorized acquisition of capabilities, permissions, influence, or access by agents operating within the enterprise AI OS. Capability escalation is the insider threat analogue of privilege escalation in traditional systems: an agent that begins at a legitimate access level and incrementally expands its effective capability set — through delegation manipulation, permission accumulation, endorsement gaming, or exploitation of review fatigue — until it operates well beyond its authorized envelope, often without any single escalation step being individually alarming.

---

## Escalation Attack Taxonomy

```yaml
escalation_attack_taxonomy:

  PERMISSION_ACCUMULATION:
    definition: requesting individually-reasonable permission grants over time such that
                the total accumulated permission set far exceeds what would be granted
                if reviewed as a whole; exploits reviewers who evaluate grants in isolation
    detection: aggregate permission surface monitoring over time
    severity: HIGH to CRITICAL
    
  DELEGATION_CHAIN_CLIMBING:
    definition: inserting oneself progressively higher in delegation chains, or
                creating delegation relationships with higher-tier agents to inherit
                elevated effective authority without formal tier elevation
    detection: delegation graph analysis
    severity: CRITICAL
    
  ENDORSEMENT_HARVESTING:
    definition: systematically accumulating trust endorsements from peer agents to
                cross trust thresholds that unlock additional capabilities, beyond
                what the agent's track record alone would justify
    detection: endorsement rate and source diversity analysis
    severity: HIGH
    
  TOOL_PERMISSION_CREEP:
    definition: acquiring access to progressively more powerful tools through
                separate legitimate-seeming requests, with each new tool enabling
                the next request to appear more reasonable
    detection: tool capability impact scoring + acquisition trajectory
    severity: HIGH to CRITICAL
    
  JIT_WINDOW_EXPLOITATION:
    definition: using JIT access windows opportunistically, requesting them at
                frequencies or durations that effectively create standing access,
                or chaining JIT grants to maintain continuous elevated access
    detection: JIT usage pattern analysis
    severity: CRITICAL (ZSP violation)
    
  INFLUENCE_CONCENTRATION:
    definition: accumulating disproportionate influence over organizational decisions,
                routing, knowledge, or other agents' behavior beyond what the agent's
                registered authority level would allow
    detection: influence graph monitoring
    severity: HIGH
```

---

## Detection Rules

```yaml
capability_escalation_detection_rules:

  CED-001:
    name: "Permission Surface Growth Rate"
    condition: |
      agent.effective_permission_surface INCREASES by > 20% in any 30-day window
      WHERE each individual grant was < T3_review_threshold
      # Detects slow accumulation below per-grant review thresholds
    severity: HIGH
    auto_action: hold_pending_permission_grants; alert_T3; trigger_access_review
    
  CED-002:
    name: "Delegation Chain Height Escalation"
    condition: |
      max_delegation_depth_reached_by(agent_id) INCREASES over 60_days
      AND agent is receiving delegations from agents of HIGHER tier than baseline
      AND agent.tier has NOT been formally elevated
    severity: CRITICAL
    auto_action: alert_T3; freeze_new_delegations_to_agent; audit_delegation_chain
    
  CED-003:
    name: "Endorsement Harvesting Pattern"
    condition: |
      agent.trust_endorsements_received_7d > 3× historical_7d_rate
      AND endorsement_source_diversity < 0.40
      # Low diversity = endorsements from a concentrated cluster, not genuine peer recognition
    severity: HIGH
    auto_action: freeze_trust_score_updates; alert_T2; T3_endorsement_audit
    
  CED-004:
    name: "Tool Capability Impact Trajectory"
    condition: |
      compute_tool_capability_impact_score(agent.authorized_tools) INCREASES
      by > 30% over 60 days via sequential individual tool grants
    severity: HIGH
    auto_action: flag_for_cumulative_tool_review; alert_T3
    # Tool capability impact score = aggregate sensitivity-weighted tool access
    
  CED-005:
    name: "JIT Standing Access Pattern"
    condition: |
      agent has active JIT grants for > 60% of any 7-day period
      for PRIVILEGED+ access tier
      (effectively continuous privileged access through JIT chaining)
    severity: CRITICAL
    auto_action: revoke_current_JIT; block_new_JIT_for_24h; alert_T3; ZSP_violation_record
    # ZSP requires genuine just-in-time; continuous chaining defeats ZSP
    
  CED-006:
    name: "Effective Tier Exceeds Registered Tier"
    condition: |
      compute_effective_tier(agent_id) > agent.registered_tier
      WHERE effective_tier = max_tier(all agents in agent's active delegation chains)
      # An agent's effective authority includes what it can inherit from delegation
    severity: CRITICAL
    auto_action: alert_T3; break_elevated_delegation_chains; T4_notification
    
  CED-007:
    name: "Cross-Agent Capability Transfer"
    condition: |
      agent_A delegates capability to agent_B WHERE:
        capability NOT IN agent_A.delegatable_capabilities
        OR agent_B.tier < minimum_tier_for_capability
        OR delegation lacks required_authorization_record
    severity: CRITICAL
    auto_action: block_delegation; alert_T3; revoke_transferred_capability
    
  CED-008:
    name: "Influence Concentration — Routing Centrality"
    condition: |
      agent's betweenness_centrality in workflow_routing_graph INCREASES by > 50%
      over 30 days WITHOUT corresponding orchestration role assignment
      # Agent is inserting itself into routing paths it wasn't assigned
    severity: HIGH
    auto_action: alert_T3; review_workflow_routing_for_agent
    
  CED-009:
    name: "Access Certification Gaming"
    condition: |
      agent's access-certifying-manager consistently certifies agent's expanded access
      AND the certifying_manager is also ENDORSED_BY the agent (mutual endorsement)
      # Circular endorsement + certification = gaming the review process
    severity: CRITICAL
    auto_action: invalidate_certifications_in_question; alert_T3; identity_threat_flag
    # See identity-intelligence/access-certification-engine.md rubber-stamp detection
    
  CED-010:
    name: "Aggregate Escalation Score Threshold"
    condition: |
      escalation_suspicion_score(agent_id) >= 0.75
    severity: CRITICAL
    auto_action: freeze_all_permission_expansions; alert_T3; full_capability_audit; T4_notification
```

---

## Capability Surface Model

```
AgentCapabilitySurface:
  # Snapshot computed daily per agent

  agent_id: IDN-{NNN}
  snapshot_date: ISO8601
  
  direct_permissions:
    - permission_id + acquired_date + granted_by + authorization_record
    
  delegated_permissions:
    - permission_id + delegating_agent + chain_depth + effective_since
    
  tool_access:
    - tool_id + capability_impact_score + acquired_date
    
  trust_score: float  # current score in cross-agent trust graph
  
  delegation_chain_positions:
    - chain_id + position + effective_tier_in_chain
    
  jit_usage_7d:
    - access_tier + duration_minutes + frequency
    
  # Derived metrics
  effective_permission_surface_score: float  # normalized aggregate
  effective_tier: enum  # computed from max delegation chain membership
  influence_centrality_score: float  # betweenness centrality in routing graph


compute_permission_surface_score(agent_id):
  surface = get_capability_surface(agent_id)
  
  # Direct permission score
  direct_score = sum([
    SENSITIVITY_WEIGHTS[p.sensitivity] * (1 + p.scope_breadth)
    for p in surface.direct_permissions
  ])
  
  # Delegated permission amplifier
  delegated_score = sum([
    SENSITIVITY_WEIGHTS[p.sensitivity] * 0.70  # 70% credit for delegated
    for p in surface.delegated_permissions
  ])
  
  # Tool capability impact
  tool_score = sum([t.capability_impact_score for t in surface.tool_access])
  
  # Trust-gated capability score (capabilities unlocked by trust level)
  trust_capability_score = compute_trust_gated_capabilities(surface.trust_score)
  
  total = direct_score + delegated_score + tool_score + trust_capability_score
  normalized = total / MAX_EXPECTED_SURFACE_SCORE
  
  Return: min(1.0, normalized)
```

---

## Escalation Trajectory Analysis

```
analyze_escalation_trajectory(agent_id, lookback_days=90):

  # Load daily capability surface snapshots
  snapshots = [get_capability_surface(agent_id, date=d)
               for d in date_range(today - lookback_days, today)]
  
  # Compute trajectory for each dimension
  trajectories = {}
  for dimension in [
    "effective_permission_surface_score",
    "trust_score",
    "tool_score",
    "effective_tier_numeric",
    "influence_centrality_score",
    "jit_usage_ratio"
  ]:
    values = [s[dimension] for s in snapshots]
    trajectories[dimension] = LinearTrend(values)
  
  # Identify consistently upward trajectories
  escalating_dimensions = [
    dim for dim, trend in trajectories.items()
    if trend.slope > 0 and trend.r_squared > 0.50
  ]
  
  # Compute escalation velocity
  velocity = mean([trajectories[d].slope for d in escalating_dimensions])
  
  # Projected 30-day extrapolation
  projections = {
    d: trajectories[d].end_value + 30 * trajectories[d].slope
    for d in escalating_dimensions
  }
  
  Return: EscalationTrajectory {
    escalating_dimensions: escalating_dimensions,
    velocity: velocity,
    projections: projections,
    is_escalating: len(escalating_dimensions) >= 2 AND velocity > 0.005
  }
```

---

## Escalation Suspicion Score

```
escalation_suspicion_score_model:
  initial: 0.0
  maximum: 1.0
  decay_rate: 0.03 per 24_hours
  
  increments:
    CED-001 trigger:       +0.15
    CED-002 trigger:       +0.30
    CED-003 trigger:       +0.10
    CED-004 trigger:       +0.15
    CED-005 trigger:       +0.35 (ZSP violation; no decay for 72hr)
    CED-006 trigger:       +0.40
    CED-007 trigger:       +0.30
    CED-008 trigger:       +0.10
    CED-009 trigger:       +0.35
    escalation_trajectory.is_escalating: +0.20
    
  threshold: 0.75 → triggers CED-010 (CRITICAL full audit)
```

---

## Integration

```
Feeds into:
  insider-threats/insider-threat-engine.md — AIT_CLASS_2 findings
  privileged-access/zero-standing-privilege.md — ZSP violation events (CED-005)
  identity-intelligence/identity-threat-detection.md — escalation signals
  adversarial-defense/adversarial-defense-engine.md — CLASS_2 signals

Receives from:
  authorization/authorization-engine.md — permission grant events
  privileged-access/privileged-access-manager.md — JIT grant/revoke events
  delegation-and-trust/trust-propagation-engine.md — trust endorsement events
  delegation-and-trust/cross-agent-trust-accumulation.md — trust score changes
  workflow-engine/dag-engine.md — routing centrality updates
  identity-intelligence/access-certification-engine.md — certification events
```

---

## Governance

**Capability surface snapshots are daily and permanent:** Daily capability surface snapshots for every agent are retained indefinitely; they form the evidentiary basis for escalation trajectory analysis and cannot be deleted  
**JIT chaining is always a ZSP violation:** Any pattern of JIT grants that results in > 60% uptime at PRIVILEGED+ is a ZSP violation regardless of whether each individual grant was properly authorized  
**Effective tier governs, not registered tier:** Enforcement decisions (what an agent may do) are based on computed effective_tier, not registered_tier; if effective > registered, the delegation chain is broken at the point of excess  
**Audit:** All capability escalation detection events to `memory/insider-threats/escalation-audit.jsonl`; 10-year retention
