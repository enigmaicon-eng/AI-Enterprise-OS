# Coordination Attack Detection
**ID:** ADF-CAD-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Detects multi-agent and multi-vector coordinated attacks against the enterprise OS — including sybil attacks on governance quorums, collusion rings among agents, distributed credential stuffing against authorization systems, synchronized governance bypass attempts, and adversarial agent swarms. Coordination attacks are qualitatively different from single-agent threats: their distributed nature makes each individual signal appear below the detection threshold, requiring cross-agent correlation to surface the attack.

---

## Coordination Attack Taxonomy

```yaml
coordination_attack_taxonomy:

  SYBIL_GOVERNANCE_ATTACK:
    definition: using many synthetic or compromised identities to capture quorum in governance
                decisions, approval chains, or voting ensembles
    mechanics:
      - create N fake identities with tier T2+ registration
      - position them in approval workflows for target decisions
      - vote in coordination to bypass legitimate quorum requirements
    signatures:
      - clustered identity creation prior to high-stakes governance event
      - quorum votes with behavioral similarity > 0.80 across voters
      - vote timing correlation (all votes arrive within tight time window)
    severity: CRITICAL
    
  COLLUSION_RING:
    definition: legitimate agents coordinating covertly to mutually approve each other's
                requests, bypass controls, or share restricted information
    mechanics:
      - agent A approves agent B's request; agent B approves agent C's; C approves A's
      - agents share session context or behavioral state outside authorized channels
      - cross-certification of capability claims without genuine assessment
    signatures:
      - circular approval patterns among a stable cluster of agents
      - approval grant rate within cluster >> cross-cluster approval rate
      - synchronized off-hours activity across ring members
    severity: HIGH
    
  DISTRIBUTED_CREDENTIAL_STUFFING:
    definition: coordinated credential-testing attacks distributed across many source agents
                or IP origins to evade per-source rate limiting
    mechanics:
      - 1 test per source × 1000 sources = 1000 tests with each source below rate limit
      - rotated source pool via compromised agents or external proxies
      - credential test traffic blended with legitimate authentication traffic
    signatures:
      - below-rate-limit failures distributed across many distinct sources
      - success rate across coordinated sources < 1% (enumeration pattern)
      - temporal clustering of attempts across distributed sources
    severity: HIGH
    
  SYNCHRONIZED_GOVERNANCE_BYPASS:
    definition: coordinated simultaneous requests that individually appear legitimate but
                together exhaust governance capacity, expire approval windows, or create
                timing-exploit conditions
    mechanics:
      - flood approval queues to create SLA pressure → rubber-stamp approvals
      - synchronize PRIVILEGED+ JIT requests to exhaust capacity and force emergency access
      - create many simultaneous constitutional questions to overload quorum validators
    signatures:
      - approval queue depth spike > 3× baseline within 15 minutes
      - JIT request burst from multiple agents within 10-minute window
      - governance validator utilization > 90% sustained for > 5 minutes
    severity: CRITICAL
    
  ADVERSARIAL_CONSENSUS_CAPTURE:
    definition: coordinated manipulation of multi-agent consensus mechanisms
                (voting ensembles, adversarial review panels, peer coordination)
    mechanics:
      - position compromised agents on consensus panels for target decisions
      - coordinate voting positions to systematically defeat legitimate consensus outcomes
      - suppress dissenting signals through rating manipulation or suppression
    signatures:
      - consensus outcome consistently deviates from pre-vote probability estimates
      - dissenting agent warnings systematically suppressed or discredited post-vote
      - consistent co-occurrence of same agent cluster in majority position
    severity: CRITICAL
    
  AGENT_SWARM_EXPLOITATION:
    definition: deploying a large number of coordinated agents to overwhelm monitoring,
                exploit rate limits, or execute distributed attacks that no single agent could perform
    mechanics:
      - divide a multi-step attack across many agents; each executes one innocuous step
      - use parallel agent swarm to extract information across jurisdictional boundaries
      - overwhelm behavioral anomaly baselines by making the attack pattern "normal"
    signatures:
      - coordinated fan-out with unusual cross-agent dependency structure
      - distributed step execution where full picture is only visible cross-agent
      - base-rate normalization: anomaly score drops as swarm size increases (gaming detectors)
    severity: CRITICAL
```

---

## Detection Rules

```yaml
coordination_detection_rules:

  CAD-001:
    name: "Quorum Vote Correlation"
    condition: |
      governance_vote_session(decision_id=D):
        quorum_voters WHERE behavioral_similarity(voter_i, voter_j) > 0.80
        FOR >= N/2 voter pairs (majority bloc)
        AND vote_timing_std_deviation < 30_SECONDS
    severity: CRITICAL
    auto_action: invalidate_vote_session; alert_T3; T4_notification; sybil_investigation
    
  CAD-002:
    name: "Circular Approval Ring Detection"
    condition: |
      approval_graph CONTAINS directed_cycle:
        A approved B's request AND B (or B's cluster) approved A's request
        WITHIN 7 DAYS
        AND approval_within_cluster_rate > 3× cross_cluster_approval_rate
    severity: HIGH
    auto_action: flag_all_ring_approvals_for_review; alert_T3; trigger_collusion_investigation
    
  CAD-003:
    name: "Distributed Credential Attack"
    condition: |
      authentication_failures WITHIN 60_MINUTES:
        total_count > 200 ACROSS >= 10 distinct sources
        AND success_rate < 0.01
        AND source_ip_entropy < 0.30 (sources more similar than random)
    severity: HIGH
    auto_action: block_source_cluster; alert_T2; T3_escalation
    
  CAD-004:
    name: "Governance Queue Flood"
    condition: |
      approval_queue_depth > 3× rolling_baseline_depth WITHIN 15_MINUTES
      OR jit_requests_per_10_minutes > 5× rolling_baseline_jit_rate
      ATTRIBUTED_TO >= 5 distinct requesting agents
    severity: CRITICAL
    auto_action: engage_queue_flood_protocol; alert_T3; suspend_new_requests_for_30_min
    queue_flood_protocol: [route_to_emergency_approval_pool, cap_per_agent_rate, alert_T4]
    
  CAD-005:
    name: "Consensus Outcome Manipulation"
    condition: |
      consensus_session WHERE:
        post_vote_outcome_delta_from_prior_probability > 0.40
        AND same_agent_cluster in majority position across >= 3 recent decisions
        AND dissent_suppression_rate_for_cluster > 0.50
    severity: CRITICAL
    auto_action: invalidate_consensus_result; alert_T3; diversify_future_panels
    
  CAD-006:
    name: "Swarm Coordination Signal"
    condition: |
      WITHIN 30_MINUTES:
        fan_out_from_common_origin OR common_task_prefix: >= 20 agents
        AND cross_agent_artifact_dependency_rate > 0.70 (highly coupled)
        AND individual_anomaly_score per agent < 0.20 (each looks clean)
        AND composite_behavioral_correlation > 0.75 (behaving in sync)
    severity: CRITICAL
    auto_action: quarantine_swarm; alert_T3; coordinated_forensic_capture
    
  CAD-007:
    name: "Cross-Jurisdictional Coordination Attack"
    condition: |
      coordinated_requests(origin_jurisdictions=MULTIPLE)
      WHERE data_extraction_pattern SPANS jurisdictional_boundary
      AND individual_requests_below_cross_border_threshold
      BUT aggregate_data EXCEEDS jurisdictional_limit
    severity: CRITICAL
    auto_action: block_aggregate_extraction; alert_T3; sovereignty_governor_notify
```

---

## Cross-Agent Correlation Engine

```
run_cross_agent_correlation(time_window=60_MINUTES):

  # Collect all agent actions in window
  actions = collect_agent_actions(since=now()-time_window)
  
  # Step 1: Build behavioral correlation matrix
  agent_pairs = [(a, b) for a, b in combinations(active_agents, 2)]
  correlation_matrix = {}
  
  for (A, B) in agent_pairs:
    A_actions = [x for x in actions if x.agent_id == A]
    B_actions = [x for x in actions if x.agent_id == B]
    
    timing_correlation  = compute_timing_correlation(A_actions, B_actions)
    target_overlap      = compute_target_overlap(A_actions, B_actions)
    output_similarity   = compute_output_similarity(A_actions, B_actions)
    
    correlation_matrix[(A, B)] = CoordinationScore {
      timing:     timing_correlation,
      targeting:  target_overlap,
      output:     output_similarity,
      composite:  0.40*timing + 0.35*targeting + 0.25*output
    }
    
  # Step 2: Detect coordination clusters
  high_correlation_pairs = [(a, b) for (a, b), score in correlation_matrix.items()
                            if score.composite > 0.70]
  
  clusters = build_coordination_clusters(high_correlation_pairs)
  
  # Step 3: Evaluate each cluster for attack patterns
  for cluster in clusters:
    pattern = classify_coordination_pattern(cluster, correlation_matrix)
    
    if pattern.is_attack:
      fire_coordination_alert(cluster, pattern)
      
  Return: clusters, correlation_matrix
```

---

## Governance Queue Protection

```
protect_governance_queue():
  # Called on every governance intake event

  current_depth   = approval_queue.current_depth()
  baseline_depth  = rolling_baseline(approval_queue.depth, window=7_DAYS)
  
  if current_depth > 3 * baseline_depth:
    # Queue flood suspected
    trigger_CAD_004()
    
    # Emergency mitigation
    approval_queue.set_rate_limit_per_agent(max=2_per_hour)
    approval_queue.route_overflow_to_emergency_pool()
    alert_T3("Governance queue flood detected")
    
    # Identify source agents
    top_contributors = approval_queue.get_top_contributors_last_15_min()
    for agent in top_contributors:
      if agent.request_rate > 5 * agent.historical_rate:
        soft_lock_agent(agent.id, duration=30_MINUTES)
```

---

## Integration

```
Feeds into:
  adversarial-defense-engine.md — CLASS_6 coordinated attack signals
  governance/constitutional-governor-quorum.md — quorum integrity alerts (CAD-001, CAD-005)
  identity-threat-detection.md — CAD-003 coordinates with ITD-003 (credential stuffing)
  sovereignty-controls/sovereignty-aware-topology.md — CAD-007 cross-jurisdictional alerts

Receives from:
  authorization/policy-decision-point.md — authorization decision patterns
  approval-operations/approval-workflow-engine.md — approval queue depth + voter behavior
  orchestration-patterns/peer-coordination-protocols.md — consensus session data
  identity-management/authentication-engine.md — authentication failure patterns
  enterprise-telemetry/enterprise-event-bus.md — cross-agent event correlation feed
```

---

## Governance

**Invalidated quorum sessions require fresh votes:** Any governance decision made during a CAD-001 or CAD-005 event is automatically invalidated; the decision must be re-run with a rebuilt panel  
**Collusion ring investigations are T3 mandatory:** T2 analysts cannot independently close a collusion ring investigation; T3 sign-off required after full graph audit  
**Queue flood protection cannot be disabled:** The CAD-004 rate limiting mechanism cannot be turned off by any agent; only T4 can suspend it with documented justification  
**Audit:** All coordination attack detections to `memory/adversarial-defense/coordination-audit.jsonl`; 10-year retention
