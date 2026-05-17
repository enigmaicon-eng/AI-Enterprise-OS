# Workflow Health Hub

## Role
Unified aggregation point for all workflow health signals. Combines operational, governance, and orchestration health scores into a single composite view. The authoritative health signal consumed by dashboards, alerts, and the self-optimization engine.

## Signal Sources

| Source | Signal | Refresh |
|--------|--------|---------|
| `workflow-monitoring/operational-health-scorer.md` | throughput, SLO compliance, gate pass rate, worker health, queue depth, recovery rate | 60s |
| `workflow-monitoring/governance-health-scorer.md` | constitutional clearance, approval chain, attestation, policy adherence | 60s |
| `workflow-monitoring/orchestration-health-scorer.md` | routing accuracy, delegation depth, trust scores, handoff quality | 60s |
| `enterprise-telemetry/workflow-telemetry.md` | portfolio metrics, latency distributions, burn rates | 30s |
| `performance-learning/efficiency-benchmark-tracker.md` | efficiency index, dimension scores | 5min |

## Composite Workflow Health Score

```
composite_health = (
  operational_health  × 0.35
  + governance_health × 0.30
  + orchestration_health × 0.20
  + efficiency_index  × 0.15
)

HEALTH_BANDS:
  HEALTHY:    >= 0.80
  DEGRADED:   0.60-0.79  → WARN alert
  IMPAIRED:   0.40-0.59  → HIGH alert + T3 notification
  CRITICAL:   < 0.40     → CRITICAL alert + T4 escalation + intake throttle
```

## Health Breakdown View

```
╔════════════════════════════════════════════════════╗
║  WORKFLOW HEALTH HUB                                ║
║  Composite: {score} ({band})  Last: {timestamp}     ║
╠════════════════════════════════════════════════════╣
║  Operational:    {score}  [{bar}]                   ║
║  Governance:     {score}  [{bar}]                   ║
║  Orchestration:  {score}  [{bar}]                   ║
║  Efficiency:     {score}  [{bar}]                   ║
╠════════════════════════════════════════════════════╣
║  Active Workflows:  {N}   Queued: {N}  Blocked: {N} ║
║  Gate Pass Rate:    {N}%  SLO Compliance: {N}%      ║
║  p95 Latency:       {N}ms vs baseline {N}ms         ║
╚════════════════════════════════════════════════════╝
```

## Health Trend Tracking
- 15min rolling: detect rapid degradation
- 24hr trend: detect slow decay
- 7d trend: capacity and planning signal

## Alert Routing
```
CRITICAL: → operational-command-center/enterprise-operations-console.md
IMPAIRED: → orchestration-control-plane + T3 on-call
DEGRADED: → workflow-command-center (dashboard only)
```
