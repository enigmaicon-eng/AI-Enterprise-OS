# Operational Health Scorer

**System ID:** `operational-health-scorer`
**Role:** Computes a composite operational health score for the enterprise AI OS runtime — synthesizes workflow throughput, SLO compliance, gate quality, retry rates, worker pool health, and queue health into a single 0.0–1.0 score with dimensional breakdown; drives threshold-triggered interventions and health trend monitoring
**Storage:** `memory/workflow-monitoring/health-scores.yaml`

---

## Purpose

A 0.82 operational health score means: the runtime is mostly healthy with some degradation in one or two dimensions. An 0.61 score means: something material is wrong and needs attention. The operational health scorer is the enterprise's answer to "is the runtime healthy right now?" — synthesizing dozens of individual metrics into an actionable signal that operators and trigger engines can act on without reading every dashboard.

---

## Health Dimensions

```yaml
OperationalHealthDimensions:
  
  throughput_health:
    weight: 0.20
    inputs: [WORKFLOWS_STARTED rate, WORKFLOWS_COMPLETED rate, error_rate]
    score_formula: "completion_rate × (1 - error_rate)"
    degraded_below: 0.70
    critical_below: 0.50
    description: "Health of overall workflow throughput — completions vs starts vs errors"
  
  slo_compliance:
    weight: 0.25
    inputs: [SLO_COMPLIANCE_RATE by definition, SLO_BURN_RATE by definition]
    score_formula: "weighted_avg_compliance × (1 - burn_rate_penalty)"
    burn_rate_penalty_formula: "min(0.50, max(0, (max_burn_rate - 1.0) / 10.0))"
    degraded_below: 0.85
    critical_below: 0.70
    description: "How well workflows are meeting their latency SLOs across all definitions"
  
  gate_quality:
    weight: 0.20
    inputs: [GATE_PASS_RATE, GATE_CYCLES]
    score_formula: "gate_pass_rate × (1 - rework_penalty)"
    rework_penalty_formula: "min(0.30, (avg_gate_cycles - 1.0) × 0.15)"
    degraded_below: 0.75
    critical_below: 0.60
    description: "Quality gate performance — pass rate and rework cycles"
  
  worker_pool_health:
    weight: 0.15
    inputs: [utilization_rates by pool, health_status by pool]
    score_formula: "1 - saturation_penalty - degraded_penalty"
    saturation_penalty: "count_pools_above_0.90_utilization × 0.15"
    degraded_penalty: "count_degraded_pools × 0.10"
    degraded_below: 0.70
    critical_below: 0.50
    description: "Health and utilization of all worker pools"
  
  queue_health:
    weight: 0.10
    inputs: [queue depths by priority, back_pressure_level, wait_times]
    score_formula: "1 - back_pressure_penalty - wait_time_penalty"
    back_pressure_penalty: "NORMAL=0.0, ELEVATED=0.10, HIGH=0.25, CRITICAL=0.50"
    degraded_below: 0.70
    critical_below: 0.40
    description: "Health of execution queues — depths, wait times, back-pressure"
  
  error_recovery:
    weight: 0.10
    inputs: [RETRY_RATE, DEAD_LETTER_RATE, compensation_success_rate]
    score_formula: "1 - retry_penalty - dead_letter_penalty"
    retry_penalty: "max(0, (retry_rate - 0.10) × 2)"
    dead_letter_penalty: "dead_letter_rate × 10"
    degraded_below: 0.70
    critical_below: 0.50
    description: "How effectively the system recovers from node-level failures"
```

---

## Scoring Engine

```
compute_operational_health() → OperationalHealthScore:
  
  # Load latest metric snapshots
  workflow_metrics = workflow_telemetry.get_latest_snapshot()
  pool_status = load_worker_pool_status()
  queue_status = load_queue_status()
  
  # Score each dimension
  throughput_score = compute_throughput_health(workflow_metrics)
  slo_score = compute_slo_health(workflow_metrics)
  gate_score = compute_gate_health(workflow_metrics)
  worker_score = compute_worker_pool_health(pool_status)
  queue_score = compute_queue_health(queue_status)
  recovery_score = compute_error_recovery_health(workflow_metrics)
  
  # Composite (weighted average)
  weights = {
    throughput: 0.20, slo: 0.25, gate: 0.20,
    worker: 0.15, queue: 0.10, recovery: 0.10
  }
  
  scores = {
    throughput: throughput_score, slo: slo_score, gate: gate_score,
    worker: worker_score, queue: queue_score, recovery: recovery_score
  }
  
  composite = sum(scores[dim] × weights[dim] for dim in weights)
  
  # Hard penalty: any critical-level dimension reduces composite
  critical_dims = [dim for dim, score in scores.items()
                   if score < OPERATIONAL_HEALTH_DIMENSIONS[dim].critical_below]
  IF critical_dims:
    composite = min(composite, 0.60)    # Cap at 0.60 when any dimension is critical
  
  health_score = OperationalHealthScore(
    score_id = generate_uuid(),
    composite = round(composite, 3),
    dimensions = scores,
    critical_dimensions = critical_dims,
    degraded_dimensions = [dim for dim, score in scores.items()
                           if score < OPERATIONAL_HEALTH_DIMENSIONS[dim].degraded_below],
    status = classify_health_status(composite),
    trend = compute_trend(get_score_history("operational_health", last_n=3)),
    computed_at = now()
  )
  
  persist_health_score(health_score)
  
  enterprise_event_bus.publish(
    topic = "telemetry.health.scores",
    event_type = "OPERATIONAL_HEALTH_SCORE",
    payload = {score: composite, status: health_score.status, critical_dimensions: critical_dims}
  )
  
  RETURN health_score

classify_health_status(composite) → str:
  IF composite >= 0.90: RETURN "HEALTHY"
  IF composite >= 0.75: RETURN "NOMINAL"
  IF composite >= 0.60: RETURN "DEGRADED"
  IF composite >= 0.40: RETURN "CRITICAL"
  RETURN "SEVERE"

compute_slo_health(metrics) → float:
  
  IF NOT metrics.slo_compliance_by_definition:
    RETURN 1.0   # No data = assume healthy
  
  compliance_scores = list(metrics.slo_compliance_by_definition.values())
  avg_compliance = MEAN(compliance_scores)
  
  # Burn rate penalty
  max_burn = max(metrics.slo_burn_rates.values()) if metrics.slo_burn_rates else 1.0
  burn_penalty = min(0.50, max(0, (max_burn - 1.0) / 10.0))
  
  RETURN max(0.0, avg_compliance - burn_penalty)
```

---

## Health Score History and Trending

```
get_health_trend(hours=24, sample_every_minutes=5) → HealthTrend:
  
  history = load_score_history("operational_health", hours=hours)
  
  IF len(history) < 3:
    RETURN HealthTrend(trend="INSUFFICIENT_DATA")
  
  recent_avg = MEAN([s.composite for s in history[-3:]])
  earlier_avg = MEAN([s.composite for s in history[-12:-9]])  # 1 hour ago (if 5-min samples)
  
  delta = recent_avg - earlier_avg
  
  trend = "IMPROVING" if delta > 0.03 else "DEGRADING" if delta < -0.03 else "STABLE"
  
  RETURN HealthTrend(
    trend = trend,
    current = recent_avg,
    one_hour_ago = earlier_avg,
    delta = delta,
    min_24h = MIN(s.composite for s in history),
    max_24h = MAX(s.composite for s in history),
    history = [(s.computed_at, s.composite) for s in history]
  )
```

---

## Integration

**Called by:**
- `enterprise-telemetry/runtime-trigger-engine.md` — triggers on score threshold breach
- `operational-command-center/enterprise-operations-console.md` — health panel
- `operational-command-center/runtime-dashboards.md` — SLO metrics input

**Calls:**
- `enterprise-telemetry/workflow-telemetry.md` — workflow metrics
- `enterprise-telemetry/enterprise-event-bus.md` — publishes health scores

**Writes to:** `memory/workflow-monitoring/health-scores.yaml`
