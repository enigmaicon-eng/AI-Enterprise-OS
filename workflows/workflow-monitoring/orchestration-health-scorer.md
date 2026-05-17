# Orchestration Health Scorer

**System ID:** `orchestration-health-scorer`
**Role:** Computes a composite orchestration health score — synthesizes agent routing accuracy, delegation chain efficiency, trust score distributions, handoff quality, coordination overhead, and authority utilization into a single 0.0–1.0 score that reflects how well the agent orchestration layer is functioning
**Storage:** `memory/workflow-monitoring/orchestration-health-scores.yaml`

---

## Purpose

Orchestration failures are often invisible until they cascade. A routing table misconfiguration silently misdirects 15% of tasks to suboptimal agents. Delegation chains slowly deepen from 2 to 5 as routing rules accumulate exceptions. Trust scores cluster at the bottom of the MEDIUM tier, barely above the HUMAN_REVIEW threshold. The orchestration health scorer surfaces these patterns as a composite signal — providing early warning of orchestration degradation before it becomes a routing crisis.

---

## Health Dimensions

```yaml
OrchestrationHealthDimensions:
  
  routing_quality:
    weight: 0.25
    inputs: [routing_accuracy, routing_fallback_rate, routing_failure_rate]
    score_formula: "routing_accuracy × (1 - fallback_penalty)"
    fallback_penalty: "min(0.30, routing_fallback_rate × 2)"
    degraded_below: 0.80
    critical_below: 0.65
    description: "How accurately and efficiently the routing layer matches tasks to agents"
  
  delegation_efficiency:
    weight: 0.20
    inputs: [delegation_success_rate, avg_delegation_depth, circular_delegation_count]
    score_formula: "delegation_success_rate × depth_penalty × (1 - circular_penalty)"
    depth_penalty: "max(0.50, 1.0 - (avg_depth - 2) × 0.15)"   # Penalty for depth > 2
    circular_penalty: "min(1.0, circular_delegation_count × 0.20)"
    degraded_below: 0.75
    critical_below: 0.55
    description: "Efficiency and correctness of delegation chains — depth, success, circularity"
  
  trust_score_quality:
    weight: 0.20
    inputs: [confidence_score_p25, confidence_score_p50, disqualifier_rate]
    score_formula: "p50_normalized × (1 - disqualifier_penalty)"
    p50_normalized: "min(1.0, confidence_score_p50 / 0.75)"     # Normalized to 0.75 target
    disqualifier_penalty: "min(0.50, disqualifier_rate × 10)"
    degraded_below: 0.70
    critical_below: 0.50
    description: "Confidence scores and disqualifier rates across all orchestrated workflows"
  
  handoff_quality:
    weight: 0.20
    inputs: [handoff_success_rate, handoff_retry_rate, handoff_latency_p99_ms]
    score_formula: "handoff_success_rate × (1 - retry_penalty) × (1 - latency_penalty)"
    retry_penalty: "min(0.25, handoff_retry_rate × 3)"
    latency_penalty: "min(0.20, max(0, (p99_latency_ms - 5000) / 50000))"
    degraded_below: 0.85
    critical_below: 0.70
    description: "Quality and speed of agent-to-agent handoffs"
  
  authority_utilization:
    weight: 0.10
    inputs: [authority_mismatch_rate, approval_completion_rate_by_tier]
    score_formula: "1 - mismatch_penalty - tier_gap_penalty"
    mismatch_penalty: "min(0.40, authority_mismatch_rate × 8)"
    tier_gap_penalty: "compute_tier_coverage_gap_penalty()"    # Penalty if T4/T5 are bottlenecked
    degraded_below: 0.75
    critical_below: 0.55
    description: "How well authority levels are matched to task requirements"
  
  coordination_efficiency:
    weight: 0.05
    inputs: [coordination_overhead_ratio, inter_agent_latency_p99_ms]
    score_formula: "1 - overhead_penalty - latency_penalty"
    overhead_penalty: "min(0.40, max(0, (coordination_overhead_ratio - 0.10) × 4))"
    latency_penalty: "min(0.20, max(0, (p99_latency_ms - 1000) / 20000))"
    degraded_below: 0.70
    critical_below: 0.50
    description: "Efficiency of coordination relative to actual execution work"
```

---

## Scoring Engine

```
compute_orchestration_health() → OrchestrationHealthScore:
  
  orch_metrics = orchestration_telemetry.get_latest_snapshot()
  
  scores = {
    routing_quality: compute_routing_quality_score(orch_metrics),
    delegation_efficiency: compute_delegation_score(orch_metrics),
    trust_score_quality: compute_trust_quality_score(orch_metrics),
    handoff_quality: compute_handoff_score(orch_metrics),
    authority_utilization: compute_authority_score(orch_metrics),
    coordination_efficiency: compute_coordination_score(orch_metrics)
  }
  
  weights = {
    routing_quality: 0.25, delegation_efficiency: 0.20, trust_score_quality: 0.20,
    handoff_quality: 0.20, authority_utilization: 0.10, coordination_efficiency: 0.05
  }
  
  composite = sum(scores[dim] × weights[dim] for dim in weights)
  
  # Hard penalty: any circular delegation → cap at 0.70
  IF orch_metrics.delegation.circular_count > 0:
    composite = min(composite, 0.70)
  
  health_score = OrchestrationHealthScore(
    score_id = generate_uuid(),
    composite = round(composite, 3),
    dimensions = scores,
    critical_dimensions = [dim for dim, score in scores.items()
                           if score < ORCHESTRATION_HEALTH_DIMENSIONS[dim].critical_below],
    degraded_dimensions = [dim for dim, score in scores.items()
                           if score < ORCHESTRATION_HEALTH_DIMENSIONS[dim].degraded_below],
    status = classify_orchestration_status(composite),
    circular_delegation_active = orch_metrics.delegation.circular_count > 0,
    computed_at = now()
  )
  
  persist_orchestration_health_score(health_score)
  
  enterprise_event_bus.publish(
    topic = "telemetry.health.scores",
    event_type = "ORCHESTRATION_HEALTH_SCORE",
    payload = {score: composite, status: health_score.status}
  )
  
  RETURN health_score

compute_routing_quality_score(metrics) → float:
  accuracy = metrics.routing.accuracy
  fallback_rate = metrics.routing.fallback_rate
  fallback_penalty = min(0.30, fallback_rate × 2)
  RETURN max(0.0, accuracy - fallback_penalty)

compute_delegation_score(metrics) → float:
  success_rate = metrics.delegation.success_rate
  avg_depth = metrics.delegation.depth_distribution.get("p50", 2.0) if metrics.delegation.depth_distribution else 2.0
  circular = metrics.delegation.circular_count
  
  depth_penalty = max(0, 1.0 - (avg_depth - 2) × 0.15)
  circular_penalty = min(1.0, circular × 0.20)
  
  RETURN max(0.0, success_rate × max(0.50, depth_penalty) × (1 - circular_penalty))

classify_orchestration_status(composite) → str:
  IF composite >= 0.88: RETURN "HEALTHY"
  IF composite >= 0.75: RETURN "NOMINAL"
  IF composite >= 0.60: RETURN "DEGRADED"
  IF composite >= 0.45: RETURN "CRITICAL"
  RETURN "FAILING"
```

---

## Integration

**Called by:**
- `enterprise-telemetry/runtime-trigger-engine.md` — orchestration health threshold triggers
- `operational-command-center/enterprise-operations-console.md` — health panel
- `orchestration-observability/coordination-monitor.md` — health signal

**Calls:**
- `enterprise-telemetry/orchestration-telemetry.md` — orchestration metrics
- `enterprise-telemetry/enterprise-event-bus.md` — publishes orchestration health scores

**Writes to:** `memory/workflow-monitoring/orchestration-health-scores.yaml`
