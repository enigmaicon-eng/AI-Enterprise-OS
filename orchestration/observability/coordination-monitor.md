# Coordination Monitor

**System ID:** `coordination-monitor`
**Role:** Monitors real-time coordination quality between agents — tracks handoff success rates, delegation chain efficiency, inter-agent communication latency, collaboration contract adherence, and coordination failure patterns; identifies which agent pairings are producing coordination failures and what intervention is needed
**Storage:** `memory/orchestration-observability/coordination-state.yaml`

---

## Purpose

Two agents can individually be healthy while their coordination is failing. Agent A completes its task and hands off to Agent B. Agent B's input expectations don't match Agent A's output format. The handoff fails silently, the workflow retries, and three cycles later a human escalation is triggered. The coordination monitor watches these inter-agent interactions directly — tracking not the agents themselves but the quality of the connections between them — surfacing the coordination failures before they cost cycles.

---

## Coordination Metrics

```yaml
CoordinationMetrics:
  
  # Per agent-pair metrics (from_agent_id → to_agent_id)
  HANDOFF_SUCCESS_RATE:
    description: "Fraction of handoffs from agent A to agent B that complete without retry"
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    alert_below: 0.90
  
  HANDOFF_LATENCY_MS:
    description: "Time from handoff initiation to acknowledgment by receiving agent"
    aggregation: HISTOGRAM
    percentiles: [p50, p90, p99]
    alert_p99_ms: 5000
  
  HANDOFF_RETRY_COUNT:
    description: "Average number of retries per handoff"
    aggregation: AVERAGE
    alert_above: 1.5
  
  ARTIFACT_FORMAT_MISMATCH_RATE:
    description: "Fraction of handoffs where receiving agent rejects input format"
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    alert_above: 0.05
  
  # Per delegation pair
  DELEGATION_SUCCESS_RATE:
    description: "Fraction of delegations from orchestrator to sub-agent that complete successfully"
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    alert_below: 0.92
  
  DELEGATION_DEPTH_TREND:
    description: "Is the average delegation depth increasing over time?"
    aggregation: TREND
    alert: "INCREASING" # Increasing depth = routing inefficiency
  
  CONTEXT_PRESERVATION_SCORE:
    description: "How much of the delegating agent's context survives to the sub-agent"
    unit: ratio
    aggregation: AVERAGE
    alert_below: 0.70
  
  # Collaboration contract compliance
  CONTRACT_VIOLATION_RATE:
    description: "Fraction of cross-org interactions that violate collaboration contracts"
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    alert_above: 0.02
  
  # Communication quality
  RESPONSE_COMPLETENESS_SCORE:
    description: "How completely the sub-agent addresses the delegating agent's request"
    unit: ratio
    aggregation: AVERAGE
    alert_below: 0.70
```

---

## Coordination Monitoring Engine

```
monitor_coordination(window_minutes=60) → CoordinationMonitorReport:
  
  window_start = now() - timedelta(minutes=window_minutes)
  
  # Load orchestration traces for the window
  traces = load_orchestration_traces(since=window_start)
  
  # Extract all coordination events
  handoff_spans = extract_spans_by_type(traces, "HANDOFF")
  delegation_spans = extract_spans_by_type(traces, "DELEGATION")
  
  # --- Per-pair analysis ---
  pair_stats = compute_pair_stats(handoff_spans, delegation_spans)
  
  # --- Failure pattern detection ---
  failure_patterns = detect_coordination_failure_patterns(handoff_spans, delegation_spans)
  
  # --- Contract compliance ---
  contract_violations = load_contract_violations(window_start)
  violation_rate = len(contract_violations) / max(len(handoff_spans) + len(delegation_spans), 1)
  
  # --- Alert on problematic pairs ---
  problem_pairs = []
  FOR (from_id, to_id), stats in pair_stats.items():
    IF stats.handoff_success_rate < 0.90:
      problem_pairs.append(CoordinationProblem(
        from_agent = from_id,
        to_agent = to_id,
        problem_type = "HANDOFF_FAILURE",
        severity = "CRITICAL" if stats.handoff_success_rate < 0.70 else "HIGH",
        metric = stats.handoff_success_rate,
        threshold = 0.90,
        recommendation = diagnose_handoff_failure(from_id, to_id, stats)
      ))
    
    IF stats.artifact_mismatch_rate > 0.05:
      problem_pairs.append(CoordinationProblem(
        from_agent = from_id,
        to_agent = to_id,
        problem_type = "ARTIFACT_FORMAT_MISMATCH",
        severity = "HIGH",
        metric = stats.artifact_mismatch_rate,
        threshold = 0.05,
        recommendation = "Review artifact schema alignment between agents"
      ))
    
    IF stats.p99_handoff_latency_ms > 5000:
      problem_pairs.append(CoordinationProblem(
        from_agent = from_id,
        to_agent = to_id,
        problem_type = "HANDOFF_LATENCY",
        severity = "MEDIUM",
        metric = stats.p99_handoff_latency_ms,
        threshold = 5000
      ))
  
  FOR problem in problem_pairs:
    enterprise_event_bus.publish(
      topic = "org.capacity.signals",
      event_type = "COORDINATION_PROBLEM_DETECTED",
      payload = {
        from_agent = problem.from_agent,
        to_agent = problem.to_agent,
        problem_type = problem.problem_type,
        severity = problem.severity
      },
      priority = "HIGH" if problem.severity in ["CRITICAL", "HIGH"] else "NORMAL"
    )
  
  # --- Context preservation analysis ---
  context_scores = compute_context_preservation_scores(delegation_spans)
  
  RETURN CoordinationMonitorReport(
    window_start = window_start,
    window_end = now(),
    total_handoffs = len(handoff_spans),
    total_delegations = len(delegation_spans),
    pair_stats = pair_stats,
    problem_pairs = problem_pairs,
    failure_patterns = failure_patterns,
    contract_violation_rate = violation_rate,
    contract_violations = contract_violations[:10],   # Top 10
    context_preservation = {
      avg_score: MEAN(context_scores.values()) if context_scores else null,
      by_delegating_agent: context_scores
    },
    health_score = orchestration_health_scorer.get_current_score().composite,
    generated_at = now()
  )

detect_coordination_failure_patterns(handoff_spans, delegation_spans) → [FailurePattern]:
  
  patterns = []
  
  # Pattern 1: Retry cascade — repeated retries between same agents
  retry_chains = identify_retry_cascades(handoff_spans)
  FOR chain in retry_chains:
    IF chain.retry_count > 3:
      patterns.append(FailurePattern(
        pattern_type = "RETRY_CASCADE",
        severity = "HIGH",
        description = f"Agent pair {chain.from_agent}→{chain.to_agent} has {chain.retry_count} consecutive retries",
        affected_agents = [chain.from_agent, chain.to_agent],
        recommendation = "Investigate artifact schema compatibility and handoff timeout settings"
      ))
  
  # Pattern 2: Delegation depth explosion — chain getting progressively deeper
  if len(delegation_spans) >= 10:
    depths = sorted([s.attributes.get("depth", 0) for s in delegation_spans])
    if depths[-1] > depths[0] × 1.5:
      patterns.append(FailurePattern(
        pattern_type = "DELEGATION_DEPTH_EXPLOSION",
        severity = "MEDIUM",
        description = f"Delegation depth trend: {depths[0]} → {depths[-1]} in window",
        recommendation = "Review routing rules for circular delegation or routing inefficiency"
      ))
  
  # Pattern 3: Star explosion — one orchestrator delegating to many sub-agents simultaneously
  delegation_from = count_by_field(delegation_spans, "attributes.parent_agent_id")
  FOR orchestrator_id, count in delegation_from.items():
    IF count > 10:
      patterns.append(FailurePattern(
        pattern_type = "DELEGATION_STAR_EXPLOSION",
        severity = "MEDIUM",
        description = f"Orchestrator '{orchestrator_id}' spawned {count} sub-agents in window — excessive fan-out",
        affected_agents = [orchestrator_id],
        recommendation = "Consider batching or hierarchical delegation"
      ))
  
  RETURN patterns

diagnose_handoff_failure(from_id, to_id, stats) → str:
  IF stats.artifact_mismatch_rate > 0.10:
    RETURN "Artifact format mismatch — verify both agents share the same output/input schema version"
  IF stats.p99_handoff_latency_ms > 30000:
    RETURN "Handoff timeout likely — increase handoff timeout or investigate receiving agent capacity"
  IF stats.handoff_retry_count > 2:
    RETURN "High retry rate — investigate transient failures; consider retry strategy review"
  RETURN "Review coordination logs for specific error messages between these agents"
```

---

## Collaboration Contract Verification

```
verify_collaboration_contracts(window_minutes=60) → ContractComplianceReport:
  
  # COLLABORATION-CONTRACTS.md defines inter-org interaction expectations
  contracts = load_collaboration_contracts()
  
  window_start = now() - timedelta(minutes=window_minutes)
  interactions = load_cross_org_interactions(window_start)
  
  violations = []
  FOR interaction in interactions:
    applicable_contract = find_applicable_contract(
      from_org = interaction.from_org,
      to_org = interaction.to_org,
      interaction_type = interaction.type
    )
    
    IF applicable_contract:
      violation = check_contract_compliance(interaction, applicable_contract)
      IF violation:
        violations.append(violation)
  
  RETURN ContractComplianceReport(
    total_interactions = len(interactions),
    violations = violations,
    violation_rate = len(violations) / max(len(interactions), 1),
    violations_by_contract = group_by(violations, "contract_id"),
    generated_at = now()
  )
```

---

## Integration

**Called by:**
- `workflow-monitoring/orchestration-health-scorer.md` — coordination quality inputs
- `operational-command-center/enterprise-operations-console.md` — coordination alerts
- Human operators — inter-agent coordination investigation

**Calls:**
- `orchestration-observability/orchestration-tracer.md` — trace data for analysis
- `enterprise-telemetry/enterprise-event-bus.md` — coordination problem events
- `workflow-monitoring/orchestration-health-scorer.md` — health score context

**Writes to:** `memory/orchestration-observability/coordination-state.yaml`
